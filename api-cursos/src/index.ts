export interface Env {
	devsenai_db?: D1Database;
	DB?: D1Database;
	devsenai_trabalhos?: R2Bucket;
	API_KEY?: string;
}

interface CourseRow {
	id: string;
	title: string;
	description: string | null;
	image: string | null;
	tags: string | null;
}

interface VideoRow {
	id: string;
	course_id: string;
	youtubeId: string;
	title: string;
	description: string | null;
	duration: string | null;
	order_index: number;
}

interface AlunoRow {
	id: string;
	nome: string;
	matricula: string;
	pin: string;
	avatar_url: string | null;
	created_at: string;
	total_trabalhos?: number;
}

interface TrabalhoRow {
	id: string;
	aluno_id: string;
	titulo: string;
	modulo: string;
	descricao: string | null;
	entry_url: string;
	tipo?: string;
	total_bytes?: number;
	created_at: string;
}

const PUBLIC_R2_BASE = "https://pub-ff69a66708ca48ab894fd03e1fefefa4.r2.dev";
const R2_PUBLIC_BASE = PUBLIC_R2_BASE;

// Headers padrão para suporte completo a CORS
const corsHeaders: Record<string, string> = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, X-Access-Key, X-Aluno-Pin",
};

// Respostas padronizadas
function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			...corsHeaders,
		},
	});
}

function errorResponse(message: string, status = 400): Response {
	return jsonResponse({ success: false, error: message }, status);
}

// Whitelist global de extensões permitidas para uploads de trabalhos
const ALLOWED_EXTENSIONS = [".html", ".htm", ".css", ".js", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"];

// Mapeamento explícito de Content-Type para renderização no R2 / iframe
function getContentType(filename: string): string {
	const ext = filename.split(".").pop()?.toLowerCase();
	switch (ext) {
		case "html":
		case "htm":
			return "text/html; charset=utf-8";
		case "css":
			return "text/css; charset=utf-8";
		case "js":
		case "mjs":
			return "application/javascript; charset=utf-8";
		case "json":
			return "application/json; charset=utf-8";
		case "png":
			return "image/png";
		case "jpg":
		case "jpeg":
			return "image/jpeg";
		case "gif":
			return "image/gif";
		case "svg":
			return "image/svg+xml";
		case "webp":
			return "image/webp";
		case "ico":
			return "image/x-icon";
		case "pdf":
			return "application/pdf";
		case "txt":
		case "md":
			return "text/plain; charset=utf-8";
		default:
			return "application/octet-stream";
	}
}

// Verificação de autenticação de admin (para cursos e vídeos)
function checkAdminAuth(request: Request, env: Env): boolean {
	const expectedKey = env.API_KEY;
	if (!expectedKey) return true;
	const providedKey = request.headers.get("X-Access-Key");
	return providedKey === expectedKey;
}

const MAX_TRABALHOS_POR_ALUNO = 15;

// Validação estrita de URL externa HTTPS (bloqueia protocolos inseguros e IPs locais)
function validateExternalHttpsUrl(rawUrl: string): { valid: boolean; url?: string; error?: string } {
	const trimmed = (rawUrl || "").trim();
	if (!trimmed) {
		return { valid: false, error: "A URL pública do projeto é obrigatória." };
	}

	const lower = trimmed.toLowerCase();
	if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:") || lower.startsWith("file:")) {
		return { valid: false, error: "Protocolo de URL não permitido." };
	}

	let parsed: URL;
	try {
		parsed = new URL(trimmed);
	} catch {
		return { valid: false, error: "URL inválida. Informe um endereço completo começando com https://." };
	}

	if (parsed.protocol !== "https:") {
		return { valid: false, error: "Por segurança, apenas URLs HTTPS (https://) são permitidas." };
	}

	const host = parsed.hostname.toLowerCase();
	if (
		!host ||
		host === "localhost" ||
		host === "127.0.0.1" ||
		host === "0.0.0.0" ||
		host === "::1" ||
		host === "[::1]" ||
		host.endsWith(".local") ||
		host.startsWith("10.") ||
		host.startsWith("192.168.") ||
		/^172\.(1[6-9]|2\d|3[01])\./.test(host)
	) {
		return { valid: false, error: "Endereços locais ou redes privadas não são permitidos." };
	}

	return { valid: true, url: parsed.toString() };
}

// Resolve aluno (por id, matrícula ou novo_nome), valida PIN e trava de 15 trabalhos
async function resolveAndAuthenticateStudentForWork(
	db: D1Database,
	params: { aluno_id?: string; matricula?: string; novo_nome?: string; pin: string }
): Promise<{ aluno?: AlunoRow; error?: { message: string; status: number } }> {
	const { aluno_id, matricula, novo_nome, pin } = params;
	let aluno: AlunoRow | null = null;

	const lookupKey = (aluno_id || matricula || "").trim();

	if (lookupKey) {
		aluno = await db
			.prepare("SELECT id, nome, matricula, pin, avatar_url, created_at FROM alunos WHERE id = ? OR matricula = ?")
			.bind(lookupKey, lookupKey)
			.first<AlunoRow>();

		if (!aluno) {
			return { error: { message: "Aluno selecionado não foi encontrado.", status: 404 } };
		}

		if (aluno.pin === "1234" || !aluno.pin) {
			await db.prepare("UPDATE alunos SET pin = ? WHERE id = ?").bind(pin, aluno.id).run();
			aluno.pin = pin;
		} else if (aluno.pin !== pin) {
			return { error: { message: "PIN incorreto para este aluno. Digite o PIN que você cadastrou.", status: 401 } };
		}
	} else if (novo_nome) {
		const existing = await db
			.prepare("SELECT id, nome, matricula, pin, avatar_url, created_at FROM alunos WHERE LOWER(nome) = LOWER(?)")
			.bind(novo_nome)
			.first<AlunoRow>();

		if (existing) {
			aluno = existing;
			if (aluno.pin === "1234" || !aluno.pin) {
				await db.prepare("UPDATE alunos SET pin = ? WHERE id = ?").bind(pin, aluno.id).run();
				aluno.pin = pin;
			} else if (aluno.pin !== pin) {
				return { error: { message: `Aluno '${novo_nome}' já cadastrado. O PIN informado está incorreto.`, status: 401 } };
			}
		} else {
			const newId = `aluno_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
			const generatedMatricula = `ALU${Date.now().toString().slice(-7)}`;
			await db
				.prepare("INSERT INTO alunos (id, nome, matricula, pin, avatar_url) VALUES (?, ?, ?, ?, ?)")
				.bind(newId, novo_nome, generatedMatricula, pin, "")
				.run();

			aluno = {
				id: newId,
				nome: novo_nome,
				matricula: generatedMatricula,
				pin,
				avatar_url: "",
				created_at: new Date().toISOString(),
			};
		}
	} else {
		return { error: { message: "Selecione um aluno da lista, informe a matrícula ou um novo nome.", status: 400 } };
	}

	const countRow = await db
		.prepare("SELECT COUNT(*) as total FROM trabalhos WHERE aluno_id = ?")
		.bind(aluno.id)
		.first<{ total: number }>();

	if (Number(countRow?.total || 0) >= MAX_TRABALHOS_POR_ALUNO) {
		return {
			error: {
				message: `Limite máximo de ${MAX_TRABALHOS_POR_ALUNO} trabalhos por aluno atingido. Exclua um trabalho antigo antes de publicar um novo.`,
				status: 400,
			},
		};
	}

	return { aluno };
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const pathname = url.pathname;
		const method = request.method;

		// 1. Tratamento Preflight CORS (OPTIONS)
		if (method === "OPTIONS") {
			return new Response(null, {
				status: 204,
				headers: corsHeaders,
			});
		}

		// 2. Validação da conexão com o banco D1
		const db = env.devsenai_db || env.DB;
		if (!db) {
			return errorResponse("Binding do banco de dados D1 (devsenai_db) não encontrado.", 500);
		}

		// 3. Validação de autenticação para mutações em cursos e vídeos
		const mutationMethods = ["POST", "PUT", "DELETE", "PATCH"];
		const isCursosRoute = pathname.startsWith("/api/cursos") || pathname.startsWith("/api/videos");
		if (mutationMethods.includes(method) && isCursosRoute) {
			if (!checkAdminAuth(request, env)) {
				return errorResponse("Não autorizado: Chave de acesso ('X-Access-Key') inválida ou ausente.", 401);
			}
		}

		try {
			// ==========================================
			// ROTAS DE TRABALHOS & ALUNOS (PORTFÓLIO)
			// ==========================================

			// GET /api/trabalhos/alunos -> Lista todos os alunos cadastrados
			if (method === "GET" && pathname === "/api/trabalhos/alunos") {
				const alunosQuery = await db
					.prepare(
						`SELECT a.id, a.nome, a.avatar_url, a.created_at,
						        (a.pin = '1234' OR a.pin IS NULL OR a.pin = '') as primeiro_acesso,
						        COUNT(t.id) as total_trabalhos
						 FROM alunos a
						 LEFT JOIN trabalhos t ON t.aluno_id = a.id
						 GROUP BY a.id
						 ORDER BY a.nome ASC`
					)
					.all<AlunoRow & { total_trabalhos: number; primeiro_acesso: number }>();

				const alunos = alunosQuery.results || [];

				const modulosQuery = await db
					.prepare("SELECT DISTINCT aluno_id, modulo FROM trabalhos WHERE modulo IS NOT NULL AND modulo != ''")
					.all<{ aluno_id: string; modulo: string }>();

				const modulosByAluno: Record<string, string[]> = {};
				for (const item of modulosQuery.results || []) {
					if (!modulosByAluno[item.aluno_id]) {
						modulosByAluno[item.aluno_id] = [];
					}
					modulosByAluno[item.aluno_id].push(item.modulo);
				}

				const payload = alunos.map((aluno) => ({
					id: aluno.id,
					nome: aluno.nome,
					avatar_url: aluno.avatar_url || "",
					created_at: aluno.created_at,
					primeiro_acesso: Boolean(aluno.primeiro_acesso),
					total_trabalhos: Number(aluno.total_trabalhos || 0),
					modulos: modulosByAluno[aluno.id] || [],
				}));

				return jsonResponse(payload);
			}

			// POST /api/trabalhos/alunos -> Cadastro de novo perfil de aluno (Nome + PIN + Avatar opcional)
			if (method === "POST" && pathname === "/api/trabalhos/alunos") {
				const contentType = request.headers.get("content-type") || "";
				let nome = "";
				let pin = "";
				let avatar_url = "";
				let avatarFile: File | null = null;

				if (contentType.includes("multipart/form-data")) {
					const formData = await request.formData().catch(() => null);
					if (!formData) {
						return errorResponse("Corpo da requisição multipart inválido.");
					}
					nome = String(formData.get("nome") || "").trim();
					pin = String(formData.get("pin") || "").trim();
					avatar_url = String(formData.get("avatar_url") || "").trim();
					const fileEntry = formData.get("avatar_file") || formData.get("file");
					if (fileEntry instanceof File && fileEntry.size > 0) {
						avatarFile = fileEntry;
					}
				} else {
					const body = await request.json().catch(() => null);
					if (!body || typeof body !== "object") {
						return errorResponse("Corpo da requisição inválido.");
					}
					nome = String((body as any).nome || "").trim();
					pin = String((body as any).pin || "").trim();
					avatar_url = String((body as any).avatar_url || "").trim();
				}

				if (!nome) {
					return errorResponse("O campo 'nome' é obrigatório.");
				}
				const cleanNome = nome.trim();
				const cleanPin = String(pin || "").trim();
				if (!/^\d{4,6}$/.test(cleanPin)) {
					return errorResponse("O 'pin' deve ser estritamente numérico, contendo de 4 a 6 dígitos.");
				}

				// Verifica se já existe aluno com esse nome exato
				const existing = await db
					.prepare("SELECT id FROM alunos WHERE LOWER(nome) = LOWER(?)")
					.bind(cleanNome)
					.first();

				if (existing) {
					return errorResponse(`Já existe um aluno cadastrado com o nome '${cleanNome}'.`, 409);
				}

				const id = `aluno_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
				const generatedMatricula = `ALU${Date.now().toString().slice(-7)}`;
				let cleanAvatar = (avatar_url || "").trim();

				if (avatarFile) {
					const r2 = env.devsenai_trabalhos;
					if (r2) {
						const ext = "." + (avatarFile.name.split(".").pop() || "png").toLowerCase();
						const avatarKey = `avatars/${id}_${Date.now()}${ext}`;
						const mimeType = getContentType(avatarFile.name);
						await r2.put(avatarKey, await avatarFile.arrayBuffer(), {
							httpMetadata: { contentType: mimeType },
						});
						cleanAvatar = `${PUBLIC_R2_BASE}/${avatarKey}`;
					}
				}

				await db
					.prepare("INSERT INTO alunos (id, nome, matricula, pin, avatar_url) VALUES (?, ?, ?, ?, ?)")
					.bind(id, cleanNome, generatedMatricula, cleanPin, cleanAvatar)
					.run();

				return jsonResponse(
					{
						success: true,
						message: "Perfil de aluno cadastrado com sucesso!",
						aluno: {
							id,
							nome: cleanNome,
							avatar_url: cleanAvatar,
						},
					},
					201
				);
			}

			// GET /api/trabalhos/alunos/:id -> Retorna dados do aluno e seus trabalhos
			const alunoMatch = pathname.match(/^\/api\/trabalhos\/alunos\/([^\/]+)$/);
			if (method === "GET" && alunoMatch) {
				const idOrNome = decodeURIComponent(alunoMatch[1]);

				const aluno = await db
					.prepare("SELECT id, nome, avatar_url, created_at, (pin = '1234' OR pin IS NULL OR pin = '') as primeiro_acesso FROM alunos WHERE id = ? OR LOWER(nome) = LOWER(?)")
					.bind(idOrNome, idOrNome)
					.first<Omit<AlunoRow, "pin"> & { primeiro_acesso: number }>();

				if (!aluno) {
					return errorResponse("Aluno não encontrado.", 404);
				}

				const trabalhosQuery = await db
					.prepare(
						`SELECT id, aluno_id, titulo, modulo, descricao, entry_url,
						        COALESCE(tipo, 'upload') as tipo,
						        COALESCE(total_bytes, 0) as total_bytes,
						        created_at
						 FROM trabalhos
						 WHERE aluno_id = ?
						 ORDER BY created_at DESC`
					)
					.bind(aluno.id)
					.all<TrabalhoRow>();

				return jsonResponse({
					id: aluno.id,
					nome: aluno.nome,
					avatar_url: aluno.avatar_url || "",
					created_at: aluno.created_at,
					primeiro_acesso: Boolean(aluno.primeiro_acesso),
					total_trabalhos: (trabalhosQuery.results || []).length,
					trabalhos: trabalhosQuery.results || [],
				});
			}

			// PUT /api/trabalhos/alunos/:id (ou POST /api/trabalhos/alunos/:id/edit) -> Edita dados do aluno (Nome, Avatar/Foto, PIN)
			const alunoEditMatch = pathname.match(/^\/api\/trabalhos\/alunos\/([^\/]+)(\/edit)?$/);
			if ((method === "PUT" || (method === "POST" && pathname.endsWith("/edit"))) && alunoEditMatch) {
				const alunoId = decodeURIComponent(alunoEditMatch[1]);
				const contentType = request.headers.get("content-type") || "";

				let pin = "";
				let nome: string | undefined;
				let avatar_url: string | undefined;
				let novo_pin: string | undefined;
				let avatarFile: File | null = null;

				if (contentType.includes("multipart/form-data")) {
					const formData = await request.formData().catch(() => null);
					if (!formData) {
						return errorResponse("Falha ao processar formulário.");
					}
					pin = String(formData.get("pin") || "").trim();
					if (formData.has("nome")) nome = String(formData.get("nome") || "").trim();
					if (formData.has("avatar_url")) avatar_url = String(formData.get("avatar_url") || "").trim();
					if (formData.has("novo_pin")) novo_pin = String(formData.get("novo_pin") || "").trim();

					const fileEntry = formData.get("avatar_file") || formData.get("file");
					if (fileEntry instanceof File && fileEntry.size > 0) {
						avatarFile = fileEntry;
					}
				} else {
					const body = await request.json().catch(() => null);
					if (body && typeof body === "object") {
						pin = String((body as any).pin || "").trim();
						if ("nome" in body) nome = String((body as any).nome || "").trim();
						if ("avatar_url" in body) avatar_url = String((body as any).avatar_url || "").trim();
						if ("novo_pin" in body) novo_pin = String((body as any).novo_pin || "").trim();
					}
				}

				if (!pin) {
					pin = request.headers.get("X-Aluno-Pin")?.trim() || "";
				}

				if (!pin) {
					return errorResponse("O PIN secreto atual do aluno é obrigatório para autorizar a edição.", 400);
				}

				const aluno = await db
					.prepare("SELECT id, nome, matricula, pin, avatar_url FROM alunos WHERE id = ? OR LOWER(nome) = LOWER(?)")
					.bind(alunoId, alunoId)
					.first<AlunoRow>();

				if (!aluno) {
					return errorResponse("Aluno não encontrado.", 404);
				}

				const isAdmin = checkAdminAuth(request, env);
				const isOwner = aluno.pin === pin || aluno.pin === "1234" || !aluno.pin;

				if (!isAdmin && !isOwner) {
					return errorResponse("PIN incorreto para editar o perfil deste aluno.", 401);
				}

				let updatedNome = aluno.nome;
				if (nome !== undefined && nome !== "") {
					if (nome.toLowerCase() !== aluno.nome.toLowerCase()) {
						const conflict = await db
							.prepare("SELECT id FROM alunos WHERE LOWER(nome) = LOWER(?) AND id != ?")
							.bind(nome, aluno.id)
							.first();
						if (conflict) {
							return errorResponse(`Já existe outro aluno cadastrado com o nome '${nome}'.`, 409);
						}
					}
					updatedNome = nome;
				}

				let updatedAvatar = aluno.avatar_url || "";
				if (avatarFile) {
					const r2 = env.devsenai_trabalhos;
					if (!r2) {
						return errorResponse("Bucket Cloudflare R2 não configurado na Worker.", 500);
					}

					const ext = "." + (avatarFile.name.split(".").pop() || "png").toLowerCase();
					const validImgExts = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"];
					if (!validImgExts.includes(ext)) {
						return errorResponse(`Arquivo de imagem inválido (${ext}). Formatos aceitos: .png, .jpg, .jpeg, .webp, .gif, .svg`, 400);
					}

					if (avatarFile.size > 2 * 1024 * 1024) {
						return errorResponse("A imagem de avatar deve ter no máximo 2 MB.", 400);
					}

					const avatarKey = `avatars/${aluno.id}_${Date.now()}${ext}`;
					const mimeType = getContentType(avatarFile.name);
					await r2.put(avatarKey, await avatarFile.arrayBuffer(), {
						httpMetadata: { contentType: mimeType },
					});
					updatedAvatar = `${PUBLIC_R2_BASE}/${avatarKey}`;
				} else if (avatar_url !== undefined) {
					updatedAvatar = avatar_url;
				}

				let updatedPin = aluno.pin;
				if (novo_pin) {
					if (!/^\d{4,6}$/.test(novo_pin)) {
						return errorResponse("O novo PIN deve ser numérico e conter de 4 a 6 dígitos.", 400);
					}
					updatedPin = novo_pin;
				} else if (aluno.pin === "1234" || !aluno.pin) {
					updatedPin = pin;
				}

				await db
					.prepare("UPDATE alunos SET nome = ?, avatar_url = ?, pin = ? WHERE id = ?")
					.bind(updatedNome, updatedAvatar, updatedPin, aluno.id)
					.run();

				return jsonResponse({
					success: true,
					message: "Perfil do aluno atualizado com sucesso!",
					aluno: {
						id: aluno.id,
						nome: updatedNome,
						avatar_url: updatedAvatar,
						primeiro_acesso: false,
					},
				});
			}

			// DELETE /api/trabalhos/alunos/:id -> Remove perfil do aluno e seus trabalhos
			const alunoDeleteMatch = pathname.match(/^\/api\/trabalhos\/alunos\/([^\/]+)$/);
			if (method === "DELETE" && alunoDeleteMatch) {
				const alunoId = decodeURIComponent(alunoDeleteMatch[1]);
				let pin = request.headers.get("X-Aluno-Pin") || "";
				if (!pin) {
					const body = await request.json().catch(() => null);
					if (body && typeof body === "object") {
						pin = pin || String((body as any).pin || "");
					}
				}
				pin = pin.trim();

				const aluno = await db
					.prepare("SELECT id, nome, pin FROM alunos WHERE id = ? OR LOWER(nome) = LOWER(?)")
					.bind(alunoId, alunoId)
					.first<AlunoRow>();

				if (!aluno) {
					return errorResponse("Aluno não encontrado.", 404);
				}

				const isAdmin = checkAdminAuth(request, env);
				const isOwner = aluno.pin === pin || aluno.pin === "1234";

				if (!isAdmin && !isOwner) {
					return errorResponse("PIN incorreto para remover este aluno.", 401);
				}

				const r2 = env.devsenai_trabalhos;
				if (r2) {
					try {
						const prefix = `alunos/${aluno.id}/`;
						const listed = await r2.list({ prefix });
						const keysToDelete = listed.objects.map((obj) => obj.key);
						if (keysToDelete.length > 0) {
							await r2.delete(keysToDelete);
						}
					} catch (r2Err) {
						console.warn("Aviso ao limpar pasta do aluno no R2:", r2Err);
					}
				}

				await db.prepare("DELETE FROM trabalhos WHERE aluno_id = ?").bind(aluno.id).run();
				await db.prepare("DELETE FROM alunos WHERE id = ?").bind(aluno.id).run();

				return jsonResponse({
					success: true,
					message: `Aluno '${aluno.nome}' removido com sucesso.`,
				});
			}

			// POST /api/trabalhos/upload -> Upload de múltiplos arquivos para o R2 e registro no D1
			if (method === "POST" && pathname === "/api/trabalhos/upload") {
				const r2 = env.devsenai_trabalhos;
				if (!r2) {
					return errorResponse("Cloudflare R2 Bucket (devsenai_trabalhos) não configurado na Worker.", 500);
				}

				const formData = await request.formData().catch(() => null);
				if (!formData) {
					return errorResponse("Falha ao processar formulário multipart/form-data.");
				}

				const aluno_id = String(formData.get("aluno_id") || "").trim();
				const matricula = String(formData.get("matricula") || "").trim();
				const novo_nome = String(formData.get("novo_nome") || "").trim();
				const pin = String(formData.get("pin") || "").trim();
				const titulo = String(formData.get("titulo") || "").trim();
				const modulo = String(formData.get("modulo") || "").trim();
				const descricao = String(formData.get("descricao") || "").trim();

				if (!pin) {
					return errorResponse("O PIN secreto (4 a 6 dígitos) é obrigatório.", 400);
				}
				if (!/^\d{4,6}$/.test(pin)) {
					return errorResponse("O PIN deve ser numérico e ter de 4 a 6 dígitos.", 400);
				}
				if (!titulo) {
					return errorResponse("O título do trabalho é obrigatório.", 400);
				}
				if (!modulo) {
					return errorResponse("O módulo/disciplina do trabalho é obrigatório.", 400);
				}

				const authResult = await resolveAndAuthenticateStudentForWork(db, {
					aluno_id,
					matricula,
					novo_nome,
					pin,
				});
				if (authResult.error || !authResult.aluno) {
					return errorResponse(authResult.error?.message || "Erro de autenticação.", authResult.error?.status || 400);
				}
				const aluno = authResult.aluno;

				// Coleta todos os arquivos enviados
				const rawFiles = formData.getAll("files");
				const rawFilesBracket = formData.getAll("files[]");
				const allFormEntries = [...rawFiles, ...rawFilesBracket];

				if (allFormEntries.length === 0) {
					for (const [, value] of formData.entries()) {
						if (value instanceof File) {
							allFormEntries.push(value);
						}
					}
				}

				const files = allFormEntries.filter((f): f is File => f instanceof File && f.size > 0);

				if (files.length === 0) {
					return errorResponse("Nenhum arquivo válido foi enviado para publicação.", 400);
				}

				// ==========================================
				// TRAVAS DE SEGURANÇA NO UPLOAD (R2)
				// ==========================================

				// 1. Limite máximo de 5 arquivos por upload
				if (files.length > 5) {
					return errorResponse(
						`Limite excedido: é permitido enviar no máximo 5 arquivos por trabalho. Você enviou ${files.length} arquivos.`,
						400
					);
				}

				// 2. Whitelist estrita de extensões permitidas
				const ALLOWED_EXTENSIONS = [".html", ".htm", ".css", ".js", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"];
				for (const file of files) {
					const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
					if (!ALLOWED_EXTENSIONS.includes(ext)) {
						return errorResponse(
							`Extensão '${ext}' não permitida no arquivo '${file.name}'. Apenas arquivos .html, .css, .js, .png, .jpg, .jpeg, .webp, .svg e .gif são aceitos.`,
							400
						);
					}
				}

				// 3. Tamanho máximo de 2 MB por arquivo e 5 MB no total
				const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
				const MAX_TOTAL_SIZE = 5 * 1024 * 1024; // 5 MB
				let totalUploadSize = 0;

				for (const file of files) {
					if (file.size > MAX_FILE_SIZE) {
						return errorResponse(
							`O arquivo '${file.name}' possui ${(file.size / (1024 * 1024)).toFixed(2)} MB e excede o limite máximo permitido de 2 MB.`,
							400
						);
					}
					totalUploadSize += file.size;
				}

				if (totalUploadSize > MAX_TOTAL_SIZE) {
					return errorResponse(
						`O tamanho total dos arquivos enviados (${(totalUploadSize / (1024 * 1024)).toFixed(2)} MB) excede o limite máximo permitido de 5 MB por envio.`,
						400
					);
				}

				// Identificar o arquivo HTML principal (prioriza 'index.html', senão o primeiro '.html')
				let mainHtmlFile = files.find((f) => f.name.toLowerCase() === "index.html");
				if (!mainHtmlFile) {
					mainHtmlFile = files.find((f) => f.name.toLowerCase().endsWith(".html") || f.name.toLowerCase().endsWith(".htm"));
				}

				if (!mainHtmlFile) {
					return errorResponse(
						"Nenhum arquivo HTML encontrado. Envie ao menos um arquivo com extensão .html para que o trabalho possa ser visualizado.",
						400
					);
				}

				const trabalho_id = `trab_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
				const prefix = `alunos/${aluno.id}/${trabalho_id}`;

				// Upload de todos os arquivos para o R2 preservando nomes relativos
				for (const file of files) {
					const safeFileName = file.name.replace(/\\/g, "/").replace(/^\/+|\.\.\/|\.\.\\/g, "");
					const r2Key = `${prefix}/${safeFileName}`;
					const contentType = getContentType(safeFileName);
					const fileArrayBuffer = await file.arrayBuffer();

					await r2.put(r2Key, fileArrayBuffer, {
						httpMetadata: {
							contentType,
						},
					});
				}

				const safeMainHtmlName = mainHtmlFile.name.replace(/\\/g, "/").replace(/^\/+|\.\.\/|\.\.\\/g, "");
				const entry_url = `${PUBLIC_R2_BASE}/${prefix}/${safeMainHtmlName}`;

				// Salva o registro na tabela trabalhos do D1
				await db
					.prepare(
						`INSERT INTO trabalhos (id, aluno_id, titulo, modulo, descricao, entry_url, tipo, total_bytes)
						 VALUES (?, ?, ?, ?, ?, ?, 'upload', ?)`
					)
					.bind(trabalho_id, aluno.id, titulo, modulo, descricao, entry_url, totalUploadSize)
					.run();

				return jsonResponse(
					{
						success: true,
						message: "Trabalho publicado com sucesso no portfólio!",
						trabalho: {
							id: trabalho_id,
							aluno_id: aluno.id,
							titulo,
							modulo,
							descricao,
							entry_url,
							tipo: "upload",
							total_bytes: totalUploadSize,
							arquivos_enviados: files.length,
						},
					},
					201
				);
			}

			// POST /api/trabalhos/link -> Cadastro de trabalho hospedado externamente (GitHub Pages, Vercel, Netlify, etc.)
			if (method === "POST" && pathname === "/api/trabalhos/link") {
				const body = await request.json().catch(() => null);
				if (!body || typeof body !== "object") {
					return errorResponse("Corpo da requisição JSON inválido.", 400);
				}

				const aluno_id = String((body as any).aluno_id || "").trim();
				const matricula = String((body as any).matricula || "").trim();
				const novo_nome = String((body as any).novo_nome || "").trim();
				const pin = String((body as any).pin || "").trim();
				const titulo = String((body as any).titulo || "").trim();
				const modulo = String((body as any).modulo || "").trim();
				const descricao = String((body as any).descricao || "").trim();
				const rawUrl = String((body as any).url || (body as any).entry_url || "").trim();

				if (!pin) {
					return errorResponse("O PIN secreto (4 a 6 dígitos) é obrigatório.", 400);
				}
				if (!/^\d{4,6}$/.test(pin)) {
					return errorResponse("O PIN deve ser numérico e ter de 4 a 6 dígitos.", 400);
				}
				if (!titulo) {
					return errorResponse("O título do trabalho é obrigatório.", 400);
				}
				if (!modulo) {
					return errorResponse("O módulo/disciplina do trabalho é obrigatório.", 400);
				}

				const urlValidation = validateExternalHttpsUrl(rawUrl);
				if (!urlValidation.valid || !urlValidation.url) {
					return errorResponse(urlValidation.error || "URL externa inválida.", 400);
				}

				const authResult = await resolveAndAuthenticateStudentForWork(db, {
					aluno_id,
					matricula,
					novo_nome,
					pin,
				});
				if (authResult.error || !authResult.aluno) {
					return errorResponse(authResult.error?.message || "Erro de autenticação.", authResult.error?.status || 400);
				}
				const aluno = authResult.aluno;

				const trabalho_id = `trab_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

				await db
					.prepare(
						`INSERT INTO trabalhos (id, aluno_id, titulo, modulo, descricao, entry_url, tipo, total_bytes)
						 VALUES (?, ?, ?, ?, ?, ?, 'link', 0)`
					)
					.bind(trabalho_id, aluno.id, titulo, modulo, descricao, urlValidation.url)
					.run();

				return jsonResponse(
					{
						success: true,
						message: "Link de projeto publicado com sucesso no portfólio!",
						trabalho: {
							id: trabalho_id,
							aluno_id: aluno.id,
							titulo,
							modulo,
							descricao,
							entry_url: urlValidation.url,
							tipo: "link",
							total_bytes: 0,
						},
					},
					201
				);
			}

			// GET /api/trabalhos/:id/arquivos -> Lista os arquivos existentes de um trabalho no Cloudflare R2
			const trabalhoFilesMatch = pathname.match(/^\/api\/trabalhos\/([^\/]+)\/arquivos$/);
			if (method === "GET" && trabalhoFilesMatch) {
				const trabalhoId = decodeURIComponent(trabalhoFilesMatch[1]);
				const trabalho = await db
					.prepare("SELECT id, aluno_id, entry_url, titulo, modulo, COALESCE(tipo, 'upload') as tipo FROM trabalhos WHERE id = ?")
					.bind(trabalhoId)
					.first<{ id: string; aluno_id: string; entry_url: string; titulo: string; modulo: string; tipo: string }>();

				if (!trabalho) {
					return errorResponse("Trabalho não encontrado.", 404);
				}

				if (trabalho.tipo === "link") {
					return jsonResponse({
						success: true,
						trabalho_id: trabalho.id,
						tipo: "link",
						total: 0,
						arquivos: [],
					});
				}

				const r2 = env.devsenai_trabalhos;
				if (!r2) {
					return errorResponse("Bucket Cloudflare R2 não configurado na Worker.", 500);
				}

				let prefix = `alunos/${trabalho.aluno_id}/${trabalho.id}/`;
				try {
					const parsedUrl = new URL(trabalho.entry_url);
					const parts = parsedUrl.pathname.replace(/^\/+/, "").split("/");
					if (parts.length >= 3) {
						prefix = parts.slice(0, 3).join("/") + "/";
					}
				} catch {}

				const listed = await r2.list({ prefix });
				const arquivos = listed.objects.map((obj) => {
					const fileName = obj.key.substring(prefix.length);
					return {
						name: fileName,
						key: obj.key,
						size: obj.size,
						url: `${R2_PUBLIC_BASE}/${obj.key}`,
						is_entry: trabalho.entry_url.endsWith("/" + fileName) || trabalho.entry_url === `${R2_PUBLIC_BASE}/${obj.key}`,
						uploaded_at: obj.uploaded,
					};
				});

				return jsonResponse({
					success: true,
					trabalho_id: trabalho.id,
					prefix,
					total: arquivos.length,
					arquivos,
				});
			}

			// DELETE /api/trabalhos/:id/arquivos/:filename -> Deleta um arquivo específico do trabalho no R2
			const trabalhoFileDeleteMatch = pathname.match(/^\/api\/trabalhos\/([^\/]+)\/arquivos\/(.+)$/);
			if (method === "DELETE" && trabalhoFileDeleteMatch) {
				const trabalhoId = decodeURIComponent(trabalhoFileDeleteMatch[1]);
				const rawFileName = decodeURIComponent(trabalhoFileDeleteMatch[2]);

				let pin = request.headers.get("X-Aluno-Pin") || "";
				if (!pin) {
					const body = await request.json().catch(() => null);
					if (body && typeof body === "object") {
						pin = pin || String((body as any).pin || "");
					}
				}
				pin = pin.trim();

				const trabalho = await db
					.prepare(
						`SELECT t.id, t.aluno_id, t.entry_url, a.pin
						 FROM trabalhos t
						 JOIN alunos a ON a.id = t.aluno_id
						 WHERE t.id = ?`
					)
					.bind(trabalhoId)
					.first<{ id: string; aluno_id: string; entry_url: string; pin: string }>();

				if (!trabalho) {
					return errorResponse("Trabalho não encontrado.", 404);
				}

				const isAdmin = checkAdminAuth(request, env);
				const isOwner = trabalho.pin === pin || trabalho.pin === "1234";

				if (!isAdmin && !isOwner) {
					return errorResponse("PIN incorreto para remover este arquivo.", 401);
				}

				const r2 = env.devsenai_trabalhos;
				if (!r2) {
					return errorResponse("Bucket Cloudflare R2 não configurado na Worker.", 500);
				}

				let prefix = `alunos/${trabalho.aluno_id}/${trabalho.id}/`;
				try {
					const parsedUrl = new URL(trabalho.entry_url);
					const parts = parsedUrl.pathname.replace(/^\/+/, "").split("/");
					if (parts.length >= 3) {
						prefix = parts.slice(0, 3).join("/") + "/";
					}
				} catch {}

				const fileKey = `${prefix}${rawFileName}`;
				await r2.delete(fileKey);

				// Se o arquivo deletado era o entry_url, procura outro .html restante
				if (trabalho.entry_url.endsWith("/" + rawFileName)) {
					const remaining = await r2.list({ prefix });
					const nextHtml = remaining.objects.find((obj) => obj.key.toLowerCase().endsWith(".html") || obj.key.toLowerCase().endsWith(".htm"));
					if (nextHtml) {
						const newEntry = `${R2_PUBLIC_BASE}/${nextHtml.key}`;
						await db.prepare("UPDATE trabalhos SET entry_url = ? WHERE id = ?").bind(newEntry, trabalho.id).run();
					}
				}

				return jsonResponse({
					success: true,
					message: `Arquivo '${rawFileName}' removido com sucesso do Cloudflare R2!`,
				});
			}

			// PUT /api/trabalhos/:id (ou POST /api/trabalhos/:id/edit) -> Edita metadados e/ou substitui arquivos de slide no R2 ou URL externa
			const trabalhoEditMatch = pathname.match(/^\/api\/trabalhos\/([^\/]+)(\/edit)?$/);
			if ((method === "PUT" || (method === "POST" && pathname.endsWith("/edit"))) && trabalhoEditMatch) {
				const trabalhoId = decodeURIComponent(trabalhoEditMatch[1]);
				if (trabalhoId !== "upload" && trabalhoId !== "link" && trabalhoId !== "alunos") {
					const contentType = request.headers.get("content-type") || "";
					let pin = "";
					let titulo = "";
					let modulo = "";
					let descricao = "";
					let newUrlRaw = "";
					const files: File[] = [];
					let formData: FormData | null = null;

					if (contentType.includes("multipart/form-data")) {
						formData = await request.formData().catch(() => null);
						if (!formData) {
							return errorResponse("Falha ao processar formulário.");
						}
						pin = String(formData.get("pin") || "").trim();
						titulo = String(formData.get("titulo") || "").trim();
						modulo = String(formData.get("modulo") || "").trim();
						descricao = String(formData.get("descricao") || "").trim();
						newUrlRaw = String(formData.get("url") || formData.get("entry_url") || "").trim();

						const rawFiles = formData.getAll("files") as (File | string)[];
						for (const item of rawFiles) {
							if (item && typeof item === "object" && "name" in item && (item as File).size > 0) {
								files.push(item as File);
							}
						}
					} else {
						const body = await request.json().catch(() => null);
						if (body && typeof body === "object") {
							pin = String((body as any).pin || "").trim();
							titulo = String((body as any).titulo || "").trim();
							modulo = String((body as any).modulo || "").trim();
							descricao = String((body as any).descricao || "").trim();
							newUrlRaw = String((body as any).url || (body as any).entry_url || "").trim();
						}
					}

					if (!pin) {
						return errorResponse("PIN numérico do aluno é obrigatório para autorizar a edição.", 400);
					}

					const trabalho = await db
						.prepare(
							`SELECT t.id, t.aluno_id, t.entry_url, t.titulo, t.modulo, t.descricao, COALESCE(t.tipo, 'upload') as tipo, a.pin
							 FROM trabalhos t
							 JOIN alunos a ON a.id = t.aluno_id
							 WHERE t.id = ?`
						)
						.bind(trabalhoId)
						.first<{ id: string; aluno_id: string; entry_url: string; titulo: string; modulo: string; descricao: string; tipo: string; pin: string }>();

					if (!trabalho) {
						return errorResponse("Trabalho não encontrado.", 404);
					}

					const isAdmin = checkAdminAuth(request, env);
					const isOwner = trabalho.pin === pin || trabalho.pin === "1234";

					if (!isAdmin && !isOwner) {
						return errorResponse("PIN incorreto para editar este trabalho.", 401);
					}

					titulo = titulo || trabalho.titulo;
					modulo = modulo || trabalho.modulo;
					descricao = descricao !== undefined ? descricao : trabalho.descricao;

					let newEntryUrl = trabalho.entry_url;

					if (trabalho.tipo === "link" && newUrlRaw) {
						const urlValidation = validateExternalHttpsUrl(newUrlRaw);
						if (!urlValidation.valid || !urlValidation.url) {
							return errorResponse(urlValidation.error || "URL externa inválida.", 400);
						}
						newEntryUrl = urlValidation.url;
					}

					// Se novos arquivos foram fornecidos, valida e substitui no R2
					if (files.length > 0) {
						const r2 = env.devsenai_trabalhos;
						if (!r2) {
							return errorResponse("Cloudflare R2 Bucket não configurado na Worker.", 500);
						}

						if (files.length > 5) {
							return errorResponse("Limite de arquivos excedido: máximo de 5 arquivos permitidos por trabalho.", 400);
						}

						let totalUploadSize = 0;
						for (const file of files) {
							if (file.size > 2 * 1024 * 1024) {
								return errorResponse(`Arquivo '${file.name}' excede o tamanho máximo permitido de 2 MB.`, 400);
							}
							totalUploadSize += file.size;

							const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
							if (!ALLOWED_EXTENSIONS.includes(ext)) {
								return errorResponse(
									`Extensão '${ext}' do arquivo '${file.name}' não é permitida. Extensões válidas: ${ALLOWED_EXTENSIONS.join(", ")}`,
									400
								);
							}
						}

						if (totalUploadSize > 5 * 1024 * 1024) {
							return errorResponse(
								`Tamanho total do envio (${(totalUploadSize / (1024 * 1024)).toFixed(2)} MB) excede o limite máximo permitido de 5 MB.`,
								400
							);
						}

						// Modo de substituição: 'merge' (padrão - substitui apenas os enviados e mantém os outros) ou 'all' (substitui pasta inteira)
						let replaceMode = "merge";
						if (contentType.includes("multipart/form-data") && formData) {
							replaceMode = String(formData.get("replace_mode") || "merge");
						}

						let prefix = `alunos/${trabalho.aluno_id}/${trabalho.id}/`;
						try {
							const parsedUrl = new URL(trabalho.entry_url);
							const parts = parsedUrl.pathname.replace(/^\/+/, "").split("/");
							if (parts.length >= 3) {
								prefix = parts.slice(0, 3).join("/") + "/";
							}
						} catch {}

						if (replaceMode === "all") {
							const listed = await r2.list({ prefix });
							const keysToDelete = listed.objects.map((obj) => obj.key);
							if (keysToDelete.length > 0) {
								await r2.delete(keysToDelete);
							}
						} else {
							// Merge: verifica se o total de arquivos distintos não excederá 5
							const existing = await r2.list({ prefix });
							const fileNamesSet = new Set(existing.objects.map((o) => o.key.substring(prefix.length)));
							for (const f of files) {
								const safe = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
								fileNamesSet.add(safe);
							}
							if (fileNamesSet.size > 5) {
								return errorResponse(
									`O trabalho ficará com ${fileNamesSet.size} arquivos no total, excedendo o limite de 5. Remova algum arquivo existente antes de adicionar novos.`,
									400
								);
							}
						}

						// Salva novos arquivos no R2 (sobrescreve se já existir ou adiciona)
						for (const file of files) {
							const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
							const objectKey = `${prefix}${safeFileName}`;
							const mimeType = getContentType(safeFileName);

							await r2.put(objectKey, await file.arrayBuffer(), {
								httpMetadata: {
									contentType: mimeType,
								},
							});
						}

						// Identifica novo arquivo de entrada se um .html foi enviado
						const htmlFile = files.find((f) => f.name.toLowerCase().endsWith(".html") || f.name.toLowerCase().endsWith(".htm"));
						if (htmlFile) {
							const entryFileName = htmlFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
							newEntryUrl = `${R2_PUBLIC_BASE}/${prefix}${entryFileName}`;
						}
					}

					// Atualiza no D1
					await db
						.prepare(
							`UPDATE trabalhos
							 SET titulo = ?, modulo = ?, descricao = ?, entry_url = ?
							 WHERE id = ?`
						)
						.bind(titulo, modulo, descricao, newEntryUrl, trabalho.id)
						.run();

					return jsonResponse({
						success: true,
						message: "Trabalho atualizado com sucesso!",
						trabalho: {
							id: trabalho.id,
							titulo,
							modulo,
							descricao,
							entry_url: newEntryUrl,
							arquivos_substituidos: files.length > 0 ? files.length : 0,
						},
					});
				}
			}

			// DELETE /api/trabalhos/:id -> Remove trabalho e seus arquivos do R2 (Apenas com PIN)
			const trabalhoDeleteMatch = pathname.match(/^\/api\/trabalhos\/([^\/]+)$/);
			if (method === "DELETE" && trabalhoDeleteMatch) {
				const trabalhoId = decodeURIComponent(trabalhoDeleteMatch[1]);

				let pin = request.headers.get("X-Aluno-Pin") || "";
				if (!pin) {
					const body = await request.json().catch(() => null);
					if (body && typeof body === "object") {
						pin = pin || String((body as any).pin || "");
					}
				}
				pin = pin.trim();

				// Busca o trabalho e o aluno associado
				const trabalho = await db
					.prepare(
						`SELECT t.id, t.aluno_id, t.entry_url, COALESCE(t.tipo, 'upload') as tipo, a.pin
						 FROM trabalhos t
						 JOIN alunos a ON a.id = t.aluno_id
						 WHERE t.id = ?`
					)
					.bind(trabalhoId)
					.first<{ id: string; aluno_id: string; entry_url: string; tipo: string; pin: string }>();

				if (!trabalho) {
					return errorResponse("Trabalho não encontrado.", 404);
				}

				const isAdmin = checkAdminAuth(request, env);
				const isOwner = trabalho.pin === pin || trabalho.pin === "1234";

				if (!isAdmin && !isOwner) {
					return errorResponse("PIN incorreto para exclusão deste trabalho.", 401);
				}

				// Deleta objetos correspondentes no R2 apenas se for trabalho do tipo 'upload'
				if (trabalho.tipo === "upload") {
					const r2 = env.devsenai_trabalhos;
					if (r2) {
						try {
							// Remove objetos sob o prefixo padrão ou o prefixo derivado da entry_url
							let prefixFromUrl = "";
							try {
								const parsedUrl = new URL(trabalho.entry_url);
								const parts = parsedUrl.pathname.replace(/^\/+/, "").split("/");
								if (parts.length >= 3) {
									prefixFromUrl = parts.slice(0, 3).join("/") + "/";
								}
							} catch {}

							const prefixes = Array.from(new Set([
								`alunos/${trabalho.aluno_id}/${trabalho.id}/`,
								prefixFromUrl
							].filter(Boolean)));

							for (const pfx of prefixes) {
								const listed = await r2.list({ prefix: pfx });
								const keysToDelete = listed.objects.map((obj) => obj.key);
								if (keysToDelete.length > 0) {
									await r2.delete(keysToDelete);
								}
							}
						} catch (r2Err) {
							console.warn("Aviso ao limpar objetos do R2:", r2Err);
						}
					}
				}

				// Deleta o registro no D1
				await db.prepare("DELETE FROM trabalhos WHERE id = ?").bind(trabalhoId).run();

				return jsonResponse({
					success: true,
					message: trabalho.tipo === "link"
						? "Link do trabalho removido com sucesso."
						: "Trabalho e arquivos excluídos com sucesso.",
				});
			}

			// ==========================================
			// ROTAS DE CURSOS & VÍDEOS (MANTIDAS)
			// ==========================================

			// GET /api/cursos -> Retorna todos os cursos com seus vídeos ordenados
			if (method === "GET" && pathname === "/api/cursos") {
				const coursesQuery = await db
					.prepare("SELECT id, title, description, image, tags FROM cursos")
					.all<CourseRow>();

				const courses = coursesQuery.results || [];
				if (courses.length === 0) {
					return jsonResponse([]);
				}

				const videosQuery = await db
					.prepare(
						"SELECT id, course_id, youtubeId, title, description, duration, order_index FROM videos ORDER BY order_index ASC"
					)
					.all<VideoRow>();

				const videos = videosQuery.results || [];

				const videosByCourse: Record<string, VideoRow[]> = {};
				for (const video of videos) {
					if (!videosByCourse[video.course_id]) {
						videosByCourse[video.course_id] = [];
					}
					videosByCourse[video.course_id].push(video);
				}

				const payload = courses.map((course) => {
					let parsedTags: unknown[] = [];
					try {
						parsedTags = course.tags ? JSON.parse(course.tags) : [];
					} catch {
						parsedTags = [];
					}

					return {
						id: course.id,
						title: course.title,
						description: course.description || "",
						image: course.image || "",
						tags: parsedTags,
						videos: videosByCourse[course.id] || [],
					};
				});

				return jsonResponse(payload);
			}

			// GET /api/cursos/:id -> Retorna um curso específico e seus vídeos
			const courseIdMatch = pathname.match(/^\/api\/cursos\/([^\/]+)$/);
			if (method === "GET" && courseIdMatch) {
				const courseId = decodeURIComponent(courseIdMatch[1]);
				const course = await db
					.prepare("SELECT id, title, description, image, tags FROM cursos WHERE id = ?")
					.bind(courseId)
					.first<CourseRow>();

				if (!course) {
					return errorResponse("Curso não encontrado.", 404);
				}

				const videosQuery = await db
					.prepare(
						"SELECT id, course_id, youtubeId, title, description, duration, order_index FROM videos WHERE course_id = ? ORDER BY order_index ASC"
					)
					.bind(courseId)
					.all<VideoRow>();

				let parsedTags: unknown[] = [];
				try {
					parsedTags = course.tags ? JSON.parse(course.tags) : [];
				} catch {
					parsedTags = [];
				}

				return jsonResponse({
					id: course.id,
					title: course.title,
					description: course.description || "",
					image: course.image || "",
					tags: parsedTags,
					videos: videosQuery.results || [],
				});
			}

			// POST /api/cursos -> Cria ou atualiza um curso (Upsert)
			if (method === "POST" && pathname === "/api/cursos") {
				const body = await request.json().catch(() => null);
				if (!body || typeof body !== "object") {
					return errorResponse("Corpo da requisição inválido.");
				}

				const { title, description, image, tags } = body as {
					id?: string;
					title?: string;
					description?: string;
					image?: string;
					tags?: unknown;
				};

				if (!title || typeof title !== "string" || !title.trim()) {
					return errorResponse("O campo 'title' é obrigatório.");
				}

				const id = (body as { id?: string }).id?.trim() || `course_${Date.now()}`;
				const serializedTags = typeof tags === "string" ? tags : JSON.stringify(tags || []);

				await db
					.prepare(
						`INSERT INTO cursos (id, title, description, image, tags)
						 VALUES (?, ?, ?, ?, ?)
						 ON CONFLICT(id) DO UPDATE SET
						   title = excluded.title,
						   description = excluded.description,
						   image = excluded.image,
						   tags = excluded.tags`
					)
					.bind(id, title.trim(), description || "", image || "", serializedTags)
					.run();

				let parsedTags: unknown[] = [];
				try {
					parsedTags = JSON.parse(serializedTags);
				} catch {
					parsedTags = [];
				}

				return jsonResponse(
					{
						success: true,
						message: "Curso salvo com sucesso.",
						course: {
							id,
							title: title.trim(),
							description: description || "",
							image: image || "",
							tags: parsedTags,
						},
					},
					201
				);
			}

			// DELETE /api/cursos/:id -> Deleta o curso e seus vídeos em cascata
			if (method === "DELETE" && courseIdMatch) {
				const courseId = decodeURIComponent(courseIdMatch[1]);

				await db.batch([
					db.prepare("DELETE FROM videos WHERE course_id = ?").bind(courseId),
					db.prepare("DELETE FROM cursos WHERE id = ?").bind(courseId),
				]);

				return jsonResponse({
					success: true,
					message: `Curso '${courseId}' e suas respectivas aulas foram excluídos com sucesso.`,
				});
			}

			// POST /api/videos -> Cria ou atualiza uma videoaula
			if (method === "POST" && pathname === "/api/videos") {
				const body = await request.json().catch(() => null);
				if (!body || typeof body !== "object") {
					return errorResponse("Corpo da requisição inválido.");
				}

				const { course_id, youtubeId, title, description, duration, order_index } = body as {
					id?: string;
					course_id?: string;
					youtubeId?: string;
					title?: string;
					description?: string;
					duration?: string;
					order_index?: number;
				};

				if (!course_id || !course_id.trim()) {
					return errorResponse("O campo 'course_id' é obrigatório.");
				}
				if (!youtubeId || !youtubeId.trim()) {
					return errorResponse("O campo 'youtubeId' é obrigatório.");
				}
				if (!title || !title.trim()) {
					return errorResponse("O campo 'title' é obrigatório.");
				}

				const courseExists = await db
					.prepare("SELECT id FROM cursos WHERE id = ?")
					.bind(course_id)
					.first();

				if (!courseExists) {
					return errorResponse("Curso associado não foi encontrado.", 404);
				}

				const videoId = (body as { id?: string }).id?.trim() || `v_${Date.now()}`;

				let finalOrderIndex = order_index;
				if (finalOrderIndex === undefined || finalOrderIndex === null || isNaN(finalOrderIndex)) {
					const maxOrder = await db
						.prepare("SELECT COALESCE(MAX(order_index), 0) AS max_order FROM videos WHERE course_id = ?")
						.bind(course_id)
						.first<{ max_order: number }>();
					finalOrderIndex = (maxOrder?.max_order ?? 0) + 1;
				}

				await db
					.prepare(
						`INSERT INTO videos (id, course_id, youtubeId, title, description, duration, order_index)
						 VALUES (?, ?, ?, ?, ?, ?, ?)
						 ON CONFLICT(id) DO UPDATE SET
						   course_id = excluded.course_id,
						   youtubeId = excluded.youtubeId,
						   title = excluded.title,
						   description = excluded.description,
						   duration = excluded.duration,
						   order_index = excluded.order_index`
					)
					.bind(
						videoId,
						course_id.trim(),
						youtubeId.trim(),
						title.trim(),
						description || "",
						duration || "10:00 min",
						finalOrderIndex
					)
					.run();

				return jsonResponse(
					{
						success: true,
						message: "Aula salva com sucesso.",
						video: {
							id: videoId,
							course_id,
							youtubeId: youtubeId.trim(),
							title: title.trim(),
							description: description || "",
							duration: duration || "10:00 min",
							order_index: finalOrderIndex,
						},
					},
					201
				);
			}

			// DELETE /api/videos/:id -> Deleta uma aula específica
			const videoIdMatch = pathname.match(/^\/api\/videos\/([^\/]+)$/);
			if (method === "DELETE" && videoIdMatch) {
				const videoId = decodeURIComponent(videoIdMatch[1]);
				const result = await db.prepare("DELETE FROM videos WHERE id = ?").bind(videoId).run();

				return jsonResponse({
					success: true,
					message: `Aula '${videoId}' excluída com sucesso.`,
					rowsAffected: result.meta?.changes ?? 0,
				});
			}

			// Health check
			if (pathname === "/" || pathname === "/api") {
				return jsonResponse({
					message: "API RESTful DEV SENAI (Cursos + Portfólio de Trabalhos) com Cloudflare Workers, D1 e R2!",
					endpoints: [
						"GET    /api/trabalhos/alunos",
						"POST   /api/trabalhos/alunos",
						"GET    /api/trabalhos/alunos/:id",
						"PUT    /api/trabalhos/alunos/:id",
						"DELETE /api/trabalhos/alunos/:id",
						"POST   /api/trabalhos/upload",
						"POST   /api/trabalhos/link",
						"PUT    /api/trabalhos/:id",
						"DELETE /api/trabalhos/:id",
						"GET    /api/cursos",
						"GET    /api/cursos/:id",
						"POST   /api/cursos",
						"DELETE /api/cursos/:id",
						"POST   /api/videos",
						"DELETE /api/videos/:id",
					],
				});
			}

			return errorResponse(`Rota '${pathname}' com método '${method}' não encontrada.`, 404);
		} catch (error: any) {
			console.error("Erro interno no Worker:", error);
			return errorResponse(`Erro interno no servidor: ${error?.message || error}`, 500);
		}
	},
};

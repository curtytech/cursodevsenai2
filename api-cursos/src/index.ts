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
	created_at: string;
}

const PUBLIC_R2_BASE = "https://pub-ff69a66708ca48ab894fd03e1fefefa4.r2.dev";

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

			// POST /api/trabalhos/alunos -> Cadastro de novo perfil de aluno (Apenas Nome + PIN)
			if (method === "POST" && pathname === "/api/trabalhos/alunos") {
				const body = await request.json().catch(() => null);
				if (!body || typeof body !== "object") {
					return errorResponse("Corpo da requisição inválido.");
				}

				const { nome, pin, avatar_url } = body as {
					nome?: string;
					pin?: string;
					avatar_url?: string;
				};

				if (!nome || typeof nome !== "string" || !nome.trim()) {
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
				const cleanAvatar = (avatar_url || "").trim();

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
						`SELECT id, aluno_id, titulo, modulo, descricao, entry_url, created_at
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

				let aluno: AlunoRow | null = null;

				// Caso 1: Aluno existente selecionado
				if (aluno_id) {
					aluno = await db
						.prepare("SELECT id, nome, matricula, pin, avatar_url, created_at FROM alunos WHERE id = ?")
						.bind(aluno_id)
						.first<AlunoRow>();

					if (!aluno) {
						return errorResponse("Aluno selecionado não foi encontrado.", 404);
					}

					// Se o aluno ainda estava com o PIN default inicial ("1234"), grava o PIN que ele escolheu no primeiro acesso!
					if (aluno.pin === "1234" || !aluno.pin) {
						await db.prepare("UPDATE alunos SET pin = ? WHERE id = ?").bind(pin, aluno.id).run();
						aluno.pin = pin;
					} else if (aluno.pin !== pin) {
						return errorResponse("PIN incorreto para este aluno. Digite o PIN que você cadastrou.", 401);
					}
				}
				// Caso 2: Cadastrando novo aluno diretamente no upload
				else if (novo_nome) {
					const existing = await db
						.prepare("SELECT id, nome, pin FROM alunos WHERE LOWER(nome) = LOWER(?)")
						.bind(novo_nome)
						.first<AlunoRow>();

					if (existing) {
						aluno = existing;
						if (aluno.pin === "1234" || !aluno.pin) {
							await db.prepare("UPDATE alunos SET pin = ? WHERE id = ?").bind(pin, aluno.id).run();
							aluno.pin = pin;
						} else if (aluno.pin !== pin) {
							return errorResponse(`Aluno '${novo_nome}' já cadastrado. O PIN informado está incorreto.`, 401);
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
					return errorResponse("Selecione um aluno da lista ou informe um novo nome.", 400);
				}

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
						`INSERT INTO trabalhos (id, aluno_id, titulo, modulo, descricao, entry_url)
						 VALUES (?, ?, ?, ?, ?, ?)`
					)
					.bind(trabalho_id, aluno.id, titulo, modulo, descricao, entry_url)
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
							arquivos_enviados: files.length,
						},
					},
					201
				);
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
					return errorResponse("PIN incorreto para exclusão deste trabalho.", 401);
				}

				// Deleta objetos correspondentes no R2 sob o prefixo do trabalho
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

				// Deleta o registro no D1
				await db.prepare("DELETE FROM trabalhos WHERE id = ?").bind(trabalhoId).run();

				return jsonResponse({
					success: true,
					message: "Trabalho e arquivos excluídos com sucesso.",
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
						"POST   /api/trabalhos/upload",
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

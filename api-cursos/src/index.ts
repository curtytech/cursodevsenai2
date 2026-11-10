export interface Env {
	devsenai_db?: D1Database;
	DB?: D1Database;
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

// Headers padrão para suporte completo a CORS
const corsHeaders: Record<string, string> = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, X-Access-Key",
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

// Verificação de autenticação para métodos de mutação (POST, PUT, DELETE)
function checkAuth(request: Request, env: Env): boolean {
	const expectedKey = env.API_KEY;
	if (!expectedKey) {
		// Se não foi configurada chave secreta no ambiente, permite a requisição
		return true;
	}
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
			return errorResponse("Binding do banco de dados D1 (devsenai_db ou DB) não encontrado.", 500);
		}

		// 3. Validação de autenticação para rotas de mutação
		const mutationMethods = ["POST", "PUT", "DELETE", "PATCH"];
		if (mutationMethods.includes(method)) {
			if (!checkAuth(request, env)) {
				return errorResponse("Não autorizado: Chave de acesso ('X-Access-Key') inválida ou ausente.", 401);
			}
		}

		try {
			// ==========================================
			// ROTAS DE CURSOS
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

				// Agrupa os vídeos por course_id
				const videosByCourse: Record<string, VideoRow[]> = {};
				for (const video of videos) {
					if (!videosByCourse[video.course_id]) {
						videosByCourse[video.course_id] = [];
					}
					videosByCourse[video.course_id].push(video);
				}

				// Monta o payload final compatível com o formato JSON original
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

				// Executa a remoção de vídeos e do curso em lote garantindo integridade
				await db.batch([
					db.prepare("DELETE FROM videos WHERE course_id = ?").bind(courseId),
					db.prepare("DELETE FROM cursos WHERE id = ?").bind(courseId),
				]);

				return jsonResponse({
					success: true,
					message: `Curso '${courseId}' e suas respectivas aulas foram excluídos com sucesso.`,
				});
			}

			// ==========================================
			// ROTAS DE VÍDEOS
			// ==========================================

			// POST /api/videos -> Cria ou atualiza uma videoaula vinculada a um course_id
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

				// Verifica se o curso existe
				const courseExists = await db
					.prepare("SELECT id FROM cursos WHERE id = ?")
					.bind(course_id)
					.first();

				if (!courseExists) {
					return errorResponse("Curso associado não foi encontrado.", 404);
				}

				const videoId = (body as { id?: string }).id?.trim() || `v_${Date.now()}`;

				// Se order_index não for informado, busca o maior existente e adiciona 1
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

			// Rota raiz de boas-vindas / health check
			if (pathname === "/" || pathname === "/api") {
				return jsonResponse({
					message: "API RESTful de Cursos DEV SENAI com Cloudflare Workers & D1 ativa!",
					endpoints: [
						"GET    /api/cursos",
						"GET    /api/cursos/:id",
						"POST   /api/cursos",
						"DELETE /api/cursos/:id",
						"POST   /api/videos",
						"DELETE /api/videos/:id",
					],
				});
			}

			// 404 Endpoint Não Encontrado
			return errorResponse(`Rota '${pathname}' com método '${method}' não encontrada.`, 404);
		} catch (error: any) {
			console.error("Erro interno no Worker:", error);
			return errorResponse(`Erro interno no servidor: ${error?.message || error}`, 500);
		}
	},
};

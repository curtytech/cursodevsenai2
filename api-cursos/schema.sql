-- Schema D1 SQLite para o Sistema DEV SENAI (Cursos + Portfólio de Trabalhos)

-- 1. Tabela de Cursos
CREATE TABLE IF NOT EXISTS cursos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image TEXT,
    tags TEXT -- JSON stringificado: '[{"text":"HTML","color":"cyan"}]'
);

-- 2. Tabela de Vídeos vinculada a Cursos
CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    youtubeId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    duration TEXT,
    order_index INTEGER DEFAULT 0,
    FOREIGN KEY (course_id) REFERENCES cursos(id) ON DELETE CASCADE
);

-- Índices de Cursos
CREATE INDEX IF NOT EXISTS idx_videos_course_id ON videos(course_id);
CREATE INDEX IF NOT EXISTS idx_videos_order ON videos(course_id, order_index);

-- 3. Tabela de Alunos (Portfólio Multi-Tenant)
CREATE TABLE IF NOT EXISTS alunos (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    matricula TEXT UNIQUE NOT NULL,
    pin TEXT NOT NULL,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela de Trabalhos vinculada a Alunos
CREATE TABLE IF NOT EXISTS trabalhos (
    id TEXT PRIMARY KEY,
    aluno_id TEXT NOT NULL,
    titulo TEXT NOT NULL,
    modulo TEXT NOT NULL,
    descricao TEXT,
    entry_url TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'upload',
    total_bytes INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE
);

-- Índices de Trabalhos
CREATE INDEX IF NOT EXISTS idx_trabalhos_aluno_id ON trabalhos(aluno_id);

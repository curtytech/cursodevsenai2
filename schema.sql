-- Schema D1 SQLite para o Sistema de Cursos DEV SENAI
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

-- Índices de Performance
CREATE INDEX IF NOT EXISTS idx_videos_course_id ON videos(course_id);
CREATE INDEX IF NOT EXISTS idx_videos_order ON videos(course_id, order_index);

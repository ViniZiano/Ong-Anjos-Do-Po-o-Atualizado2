PRAGMA foreign_keys = ON;

-- Usuários (administradores e usuários registrados)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT,
  role TEXT DEFAULT 'user',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Pets
CREATE TABLE IF NOT EXISTS pets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  categoria TEXT,
  tipo TEXT,
  idade TEXT,
  genero TEXT,
  tamanho TEXT,
  localizacao TEXT,
  imagem TEXT,
  descricao TEXT,
  caracteristicas TEXT, -- JSON array armazenado como TEXT
  necessidades INTEGER DEFAULT 0,
  em_par INTEGER DEFAULT 0,
  multiplos INTEGER DEFAULT 0,
  urgente INTEGER DEFAULT 0,
  vacinado INTEGER DEFAULT 0,
  castrado INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT
);

-- Imagens extras (opcional)
CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pet_id INTEGER,
  url TEXT,
  primary_img INTEGER DEFAULT 0,
  FOREIGN KEY(pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

-- Adoções (solicitações / histórico)
CREATE TABLE IF NOT EXISTS adoptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pet_id INTEGER,
  user_id INTEGER,
  nome_interessado TEXT,
  email TEXT,
  telefone TEXT,
  status TEXT DEFAULT 'pending',
  notas TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(pet_id) REFERENCES pets(id) ON DELETE SET NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Mensagens do formulário de contato
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT,
  email TEXT,
  assunto TEXT,
  mensagem TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
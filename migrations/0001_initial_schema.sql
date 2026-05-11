-- Organizations (synced from Clerk)
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

-- Users (synced from Clerk)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  org_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);

-- Clients (brand identities — cadastrado na tela /clients)
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_r2_key TEXT,
  palette_json TEXT,       -- JSON: string[] of hex colors
  typography_json TEXT,    -- JSON: { primary: string, secondary: string }
  brand_tone TEXT,
  art_refs_json TEXT,      -- JSON: string[] of R2 keys
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(org_id);

-- Client shares (sharing brand identities with other orgs)
CREATE TABLE IF NOT EXISTS client_shares (
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  shared_with_org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  shared_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  PRIMARY KEY (client_id, shared_with_org_id)
);

-- Workflows (React Flow canvas state — graph_json stores nodes + edges)
CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  graph_json TEXT NOT NULL DEFAULT '{}',
  migrated_to_v4 INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_workflows_org ON workflows(org_id);
CREATE INDEX IF NOT EXISTS idx_workflows_created_by ON workflows(created_by);

-- Generated images (outputs from AI nodes)
CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workflow_id TEXT REFERENCES workflows(id) ON DELETE SET NULL,
  r2_key TEXT NOT NULL,
  pipeline TEXT,           -- 'standard' | 'controlnet-canny' | 'controlnet-depth' | etc.
  text_payload_json TEXT,  -- TextPayload as JSON (for gallery search)
  metadata_json TEXT,      -- provider response metadata
  created_at INTEGER DEFAULT (unixepoch()),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_images_org ON images(org_id);
CREATE INDEX IF NOT EXISTS idx_images_workflow ON images(workflow_id);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);

-- ControlNet structure cache metadata (actual data in KV + R2)
-- Cache miss: ~$0.005, cache hit: $0. TTL: 30 days.
CREATE TABLE IF NOT EXISTS structure_cache (
  id TEXT PRIMARY KEY,
  image_hash TEXT NOT NULL,
  control_type TEXT NOT NULL,  -- 'canny' | 'depth' | 'mlsd' | 'openpose'
  r2_key TEXT NOT NULL,
  org_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  last_used_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(image_hash, control_type)
);
CREATE INDEX IF NOT EXISTS idx_structure_hash ON structure_cache(image_hash);

-- Audit log (compliance + debugging)
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata_json TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_log(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_log(created_at);

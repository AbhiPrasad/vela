-- Scans table: stores scan jobs and results
CREATE TABLE IF NOT EXISTS scans (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  grade TEXT CHECK (grade IN ('A', 'B', 'C', 'D', 'F') OR grade IS NULL),
  total_scripts INTEGER,
  total_bytes INTEGER,
  total_main_thread_time INTEGER,
  error_message TEXT,
  result_json TEXT
);

-- Index for listing recent scans
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);

-- Index for finding scans by URL
CREATE INDEX IF NOT EXISTS idx_scans_url ON scans(url);

-- Index for finding scans by status
CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);

-- Scan scripts table: individual scripts found in a scan
CREATE TABLE IF NOT EXISTS scan_scripts (
  id TEXT PRIMARY KEY,
  scan_id TEXT NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  category TEXT,
  vendor TEXT,
  size_bytes INTEGER,
  main_thread_time_ms INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for finding scripts by scan
CREATE INDEX IF NOT EXISTS idx_scan_scripts_scan_id ON scan_scripts(scan_id);

-- Known scripts table: database of known third-party scripts
CREATE TABLE IF NOT EXISTS known_scripts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  vendor TEXT NOT NULL,
  category TEXT NOT NULL,
  url_patterns TEXT NOT NULL,
  global_variables TEXT,
  known_issues TEXT,
  alternatives TEXT,
  avg_main_thread_time INTEGER,
  community_rating REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for searching known scripts
CREATE INDEX IF NOT EXISTS idx_known_scripts_vendor ON known_scripts(vendor);
CREATE INDEX IF NOT EXISTS idx_known_scripts_category ON known_scripts(category);

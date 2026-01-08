-- Seed script with 2 test patterns for development
-- Run with: npx wrangler d1 execute vela-db --local --file=scripts/seed-patterns.sql

-- Google Analytics 4
INSERT OR REPLACE INTO known_scripts (
  id,
  name,
  vendor,
  category,
  url_patterns,
  global_variables,
  known_issues,
  alternatives,
  docs_url,
  is_active,
  created_at,
  updated_at
) VALUES (
  'google-analytics-4',
  'Google Analytics 4',
  'Google',
  'analytics',
  '["*://www.googletagmanager.com/gtag/js*", "*://www.google-analytics.com/g/collect*"]',
  '["gtag", "dataLayer"]',
  '["Sets multiple cookies", "Sends data to Google servers", "Can impact page load performance"]',
  '["Plausible", "Fathom", "Simple Analytics"]',
  'https://developers.google.com/analytics',
  1,
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- Facebook Pixel
INSERT OR REPLACE INTO known_scripts (
  id,
  name,
  vendor,
  category,
  url_patterns,
  global_variables,
  known_issues,
  alternatives,
  docs_url,
  is_active,
  created_at,
  updated_at
) VALUES (
  'facebook-pixel',
  'Facebook Pixel',
  'Meta',
  'advertising',
  '["*://connect.facebook.net/*/fbevents.js*", "*://www.facebook.com/tr*"]',
  '["fbq", "_fbq"]',
  '["Tracks users across sites", "Sets long-lived cookies", "Privacy concerns"]',
  '["Server-side tracking", "First-party analytics"]',
  'https://developers.facebook.com/docs/meta-pixel',
  1,
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

import type { Candidate, SentLog } from './followups';

export async function loadFollowups(db: D1Database) {
  const candidates = await db.prepare(`WITH license_summary AS (
    SELECT lower(trim(email)) AS email, MIN(created_at) AS created_at,
      MAX(last_login) AS last_login,
      MAX(CASE WHEN plan != 'gratuito' AND status IN ('active', 'grace') THEN 1 ELSE 0 END) AS paid
    FROM licenses GROUP BY lower(trim(email))
  ), addresses AS (
    SELECT lower(trim(email)) AS email FROM leads UNION SELECT email FROM license_summary
  )
  SELECT addresses.email, leads.source, leads.created_at AS leadCreatedAt,
    license_summary.created_at AS licenseCreatedAt, license_summary.last_login AS lastLogin,
    COALESCE(license_summary.paid, 0) AS paid
  FROM addresses LEFT JOIN leads ON lower(trim(leads.email)) = addresses.email
  LEFT JOIN license_summary ON license_summary.email = addresses.email
  ORDER BY addresses.email`).all<Candidate>();
  const log = await db.prepare('SELECT email, kind, sent_at FROM email_log').all<SentLog>();
  const unsubscribes = await db.prepare('SELECT email FROM unsubscribes').all<{ email: string }>();
  return { candidates: candidates.results, log: log.results, unsubscribed: unsubscribes.results.map(row => row.email) };
}

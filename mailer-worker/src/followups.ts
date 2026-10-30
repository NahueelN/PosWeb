export type Kind = 'installer_nudge' | 'lead_feedback' | 'setup_help' | 'trial_ending' | 'paid_inactive';
export interface Candidate {
  email: string; source: string | null; leadCreatedAt: string | null;
  licenseCreatedAt: string | null; lastLogin: string | null; paid: boolean;
}
export interface SentLog { email: string; kind: string; sent_at: string }
export interface Pick { email: string; kind: Kind; data: { n?: number; trialEnd?: string } }
const DAY = 86400000;
const normalized = (email: string) => email.trim().toLowerCase();
const utc = (value: string) => Date.parse(value.includes('T') ? value : value.replace(' ', 'T') + 'Z');

export function pickFollowups(candidates: Candidate[], sentLog: SentLog[], unsubscribed: string[], now: Date, config: { trialDays: number; maxPerRun: number }): Pick[] {
  const result: Pick[] = [];
  const excluded = new Set(unsubscribed.map(normalized));
  const seen = new Set<string>();
  for (const candidate of candidates) {
    if (result.length >= config.maxPerRun) break;
    const email = normalized(candidate.email);
    if (excluded.has(email) || seen.has(email)) continue;
    seen.add(email);
    const sent = sentLog.filter(row => normalized(row.email) === email);
    if (sent.some(row => utc(row.sent_at) > now.getTime() - 2 * DAY)) continue;
    const registered = candidate.licenseCreatedAt !== null;
    const created = registered ? candidate.licenseCreatedAt : candidate.leadCreatedAt;
    if (!created) continue;
    const age = (now.getTime() - utc(created)) / DAY;
    const lastLogin = candidate.lastLogin ? utc(candidate.lastLogin) + (candidate.lastLogin.includes('T') ? 0 : 3 * 3600000) : null;
    const choices: Pick[] = [];
    if (candidate.paid && lastLogin !== null && lastLogin < now.getTime() - 14 * DAY) choices.push({ email, kind: 'paid_inactive', data: {} });
    if (registered && !candidate.paid && age >= config.trialDays - 2 && age < config.trialDays - 1) {
      const end = utc(created) + config.trialDays * DAY;
      choices.push({ email, kind: 'trial_ending', data: { n: Math.ceil((end - now.getTime()) / DAY), trialEnd: new Date(end).toISOString() } });
    }
    if (registered && !candidate.paid && age >= 3 && age < 30 && (lastLogin === null || lastLogin < now.getTime() - 3 * DAY)) choices.push({ email, kind: 'setup_help', data: {} });
    if (!registered && candidate.source === 'installer' && age >= 10 && age < 20) choices.push({ email, kind: 'lead_feedback', data: {} });
    if (!registered && candidate.source === 'installer' && age >= 1 && age < 7) choices.push({ email, kind: 'installer_nudge', data: {} });
    const choice = choices.find(item => !sent.some(row => row.kind === item.kind));
    if (choice) result.push(choice);
  }
  return result;
}

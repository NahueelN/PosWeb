import { describe, it, expect } from 'vitest';
import { pickFollowups, type Candidate } from './followups';
import { createToken, verifyToken } from './unsubscribe';

const now = new Date('2026-11-15T12:00:00Z');
const date = (days: number) => new Date(now.getTime() - days * 86400000).toISOString();
const lead = (age: number, overrides: Partial<Candidate> = {}): Candidate => ({ email: 'a@example.com', source: 'installer', leadCreatedAt: date(age), licenseCreatedAt: null, lastLogin: null, paid: false, ...overrides });
const registered = (age: number, lastLogin: string | null = null, paid = false) => lead(age, { licenseCreatedAt: date(age), lastLogin, paid });
const pick = (candidate: Candidate, log: any[] = [], unsub: string[] = [], trialDays = 30, maxPerRun = 50) => pickFollowups([candidate], log, unsub, now, { trialDays, trialPromoDays: trialDays, trialPromoUntil: '2026-12-01', maxPerRun });
const kinds = (items: ReturnType<typeof pick>) => items.map(x => x.kind);

describe('follow-up selection', () => {
  it('uses closed installer and feedback age windows and source', () => {
    expect(kinds(pick(lead(2)))).toEqual(['installer_nudge']);
    expect(pick(lead(.5))).toEqual([]);
    expect(pick(lead(8))).toEqual([]);
    expect(kinds(pick(lead(12)))).toEqual(['lead_feedback']);
    expect(pick(lead(12, { source: 'contact' }))).toEqual([]);
    expect(kinds(pick(registered(2)))).not.toContain('installer_nudge');
    expect(kinds(pick(registered(12)))).not.toContain('lead_feedback');
  });
  it('selects setup help based on login inactivity', () => {
    expect(kinds(pick(registered(4, date(5))))).toEqual(['setup_help']);
    expect(pick(registered(4, date(1)))).toEqual([]);
    expect(kinds(pick(registered(4)))).toEqual(['setup_help']);
  });
  it('prioritizes trial ending with whole days left and excludes paid', () => {
    expect(pick(registered(5.5), [], [], 7)[0]).toMatchObject({ kind: 'trial_ending', data: { n: 2 } });
    expect(pick(registered(5.5, null, true), [], [], 7)).toEqual([]);
  });
  it('uses the signup date and exclusive UTC promo cutoff for trial length', () => {
    const config = { trialDays: 7, trialPromoDays: 30, trialPromoUntil: '2026-12-01', maxPerRun: 50 };
    const at = (created: string, current: string) => pickFollowups([lead(1, { licenseCreatedAt: created })], [], [], new Date(current), config);
    expect(at('2026-11-28 00:00:00', '2026-12-03T12:00:00Z').map(x => x.kind)).not.toContain('trial_ending');
    expect(at('2026-11-28 00:00:00', '2026-12-26T12:00:00Z')[0]).toMatchObject({ kind: 'trial_ending', data: { n: 2, trialEnd: '2026-12-28T00:00:00.000Z' } });
    expect(at('2026-12-02 00:00:00', '2026-12-07T12:00:00Z')[0]).toMatchObject({ kind: 'trial_ending', data: { n: 2, trialEnd: '2026-12-09T00:00:00.000Z' } });
    expect(at('2026-12-01 00:00:00', '2026-12-06T12:00:00Z')[0]).toMatchObject({ kind: 'trial_ending' });
  });
  it('requires paid inactivity and a login', () => {
    expect(kinds(pick(registered(20, date(20), true)))).toEqual(['paid_inactive']);
    expect(pick(registered(20, null, true))).toEqual([]);
  });
  it('converts UTC-3 login timestamps to UTC at the boundary', () => {
    expect(pick(registered(4, '2026-11-12 10:00:00'))).toEqual([]);
    expect(kinds(pick(registered(4, '2026-11-12 08:00:00')))).toEqual(['setup_help']);
  });
  it('skips sent kinds, unsubscribes and recent follow-ups', () => {
    expect(pick(lead(2), [{ email: 'a@example.com', kind: 'installer_nudge', sent_at: date(4) }])).toEqual([]);
    expect(pick(lead(2), [], ['a@example.com'])).toEqual([]);
    expect(pick(registered(5.5), [{ email: 'a@example.com', kind: 'lead_feedback', sent_at: date(1) }], [], 7)).toEqual([]);
  });
  it('caps the run', () => {
    expect(pickFollowups([lead(2), lead(2, { email: 'b@example.com' })], [], [], now, { trialDays: 30, trialPromoDays: 30, trialPromoUntil: '2026-12-01', maxPerRun: 1 })).toHaveLength(1);
  });
});

describe('unsubscribe tokens', () => {
  it('round trips normalized email and rejects invalid tokens', async () => {
    const token = await createToken('secret', ' User@Example.com ');
    expect(await verifyToken('secret', 'user@example.com', token)).toBe(true);
    expect(await verifyToken('secret', 'user@example.com', '0'.repeat(64))).toBe(false);
  });
});

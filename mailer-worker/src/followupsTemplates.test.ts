import { describe, expect, it } from 'vitest';
import { renderFollowup } from './followupsTemplates';
import type { Kind } from './followups';

describe('follow-up templates', () => {
  it.each<Kind>(['installer_nudge', 'lead_feedback', 'setup_help', 'trial_ending', 'paid_inactive'])('includes unsubscribe footer in %s', kind => {
    const result = renderFollowup({ email: 'a@example.com', kind, data: { n: 2, trialEnd: '2026-11-17T02:00:00Z' } }, 'https://download.test/?a=1&b=2', 'https://unsubscribe.test/?a=1&b=2', s => s.replace(/&/g, '&amp;'));
    expect(result.text).toContain('date de baja acá: https://unsubscribe.test/?a=1&b=2');
    expect(result.html).toContain('https://unsubscribe.test/?a=1&amp;b=2');
    if (kind === 'trial_ending') {
      expect(result.subject).toBe('Tu prueba de Vendeto termina en 2 días');
      expect(result.text).toContain('termina el 16/11');
    }
  });
});

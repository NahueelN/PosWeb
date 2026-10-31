import type { Pick } from './followups';

const WHATSAPP_URL = 'https://wa.me/5491138663629';
const PRICING_URL = 'https://www.vendeto.com.ar/#precios';
type Part = { text: string; url?: string; label?: string };
type Content = { subject: string; parts: Part[] };

function installerNudge(url: string): Content {
  return { subject: '¿Pudiste instalar Vendeto?', parts: [{ text: 'Hola, hace unos días pediste el instalador de Vendeto. ¿Pudiste instalarlo?' }, { text: 'Si todavía no, acá lo tenés de nuevo:', label: 'Descargar Vendeto', url }, { text: 'Abrí el enlace desde una PC con Windows, ejecutá el instalador y creá tu cuenta con tu email.' }, { text: '¿Te trabaste en algún paso? Escribinos por WhatsApp y te ayudamos:', label: 'Escribinos por WhatsApp', url: WHATSAPP_URL }] };
}
function leadFeedback(url: string): Content {
  return { subject: '¿Llegaste a probar Vendeto?', parts: [{ text: 'Hola, hace un tiempo pediste Vendeto y queríamos saber cómo te fue.' }, { text: 'Si no lo pudiste probar, ¿nos contás qué te frenó? Respondé este mail con una línea, lo leemos nosotros.' }, { text: 'Y si querés probarlo ahora, acá está el instalador:', label: 'Descargar Vendeto', url }] };
}
function setupHelp(): Content {
  return { subject: '¿Te ayudamos a configurar Vendeto?', parts: [{ text: 'Hola, ya tenés tu cuenta de Vendeto.' }, { text: 'Si querés, te ayudamos a dejarlo listo: cargar tus productos, abrir la caja y hacer tu primera venta.' }, { text: 'Escribinos por WhatsApp y lo vemos juntos en unos minutos:', label: 'Escribinos por WhatsApp', url: WHATSAPP_URL }] };
}
function trialEnding(pick: Pick): Content {
  const date = new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: '2-digit' }).format(new Date(pick.data.trialEnd!));
  return { subject: `Tu prueba de Vendeto termina en ${pick.data.n} días`, parts: [{ text: `Hola, tu prueba gratuita de Vendeto termina el ${date}.` }, { text: 'Para seguir usándolo sin cortes, elegí tu plan:', label: 'Ver planes', url: PRICING_URL }, { text: 'Si tenés dudas sobre qué plan te conviene, respondé este mail o escribinos por WhatsApp.' }] };
}
function paidInactive(): Content {
  return { subject: '¿Todo bien con Vendeto?', parts: [{ text: 'Hola, notamos que hace un tiempo no entrás a Vendeto. ¿Tuviste algún problema?' }, { text: 'Respondé este mail o escribinos por WhatsApp y lo resolvemos:', label: 'Escribinos por WhatsApp', url: WHATSAPP_URL }] };
}

export function renderFollowup(pick: Pick, installerUrl: string, unsubscribeUrl: string, escapeHtml: (value: string) => string) {
  const content = {
    installer_nudge: () => installerNudge(installerUrl),
    lead_feedback: () => leadFeedback(installerUrl),
    setup_help: setupHelp,
    trial_ending: () => trialEnding(pick),
    paid_inactive: paidInactive,
  }[pick.kind]();
  const { subject, parts } = content;
  const footer = 'Recibís este mail porque pediste Vendeto en vendeto.com.ar. Si no querés recibir más estos mails, date de baja acá:';
  const text = parts.map(p => p.text + (p.url ? ` ${p.label}: ${p.url}` : '')).join('\n\n') + `\n\n${footer} ${unsubscribeUrl}`;
  const html = '<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">' + `<h2 style="color:#2563eb">${escapeHtml(subject)}</h2>` + parts.map(p => `<p style="color:#334155">${escapeHtml(p.text)}${p.url ? ` <a href="${escapeHtml(p.url)}" style="background:#2563eb;color:#fff;text-decoration:none;font-weight:600;padding:14px 26px;border-radius:12px;display:inline-block">${escapeHtml(p.label!)}</a>` : ''}</p>`).join('') + `<p style="color:#64748b;font-size:0.85rem">${escapeHtml(footer)} <a href="${escapeHtml(unsubscribeUrl)}">${escapeHtml(unsubscribeUrl)}</a></p></div>`;
  return { subject, html, text };
}

// Config: change WORKER_URL to your deployed Cloudflare Worker URL
const WORKER_URL = 'https://posweb-licensing.chiacchio-eze01.workers.dev';

let selectedPlan = '';

function openEmailModal(plan) {
  selectedPlan = plan;
  document.getElementById('emailModal').classList.remove('hidden');
  document.getElementById('emailInput').value = '';
  document.getElementById('errorMsg').classList.add('hidden');
  document.getElementById('loader').classList.add('hidden');
  document.getElementById('emailInput').focus();
}

function closeEmailModal() {
  document.getElementById('emailModal').classList.add('hidden');
}

async function startCheckout() {
  const email = document.getElementById('emailInput').value.trim();
  if (!email) {
    showError('Ingresá tu email');
    return;
  }

  if (!email.includes('@') || !email.includes('.')) {
    showError('Ingresá un email válido');
    return;
  }

  const btn = document.getElementById('checkoutBtn');
  const loader = document.getElementById('loader');
  btn.disabled = true;
  loader.classList.remove('hidden');
  hideError();

  try {
    const response = await fetch(`${WORKER_URL}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: selectedPlan, email }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Error al crear el pago');
    }

    if (data.checkout_url) {
      window.location.href = data.checkout_url;
    } else {
      throw new Error('No se recibió URL de pago');
    }
  } catch (e) {
    showError(e.message || 'Error de conexión');
  } finally {
    btn.disabled = false;
    loader.classList.add('hidden');
  }
}

function showError(msg) {
  const el = document.getElementById('errorMsg');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError() {
  document.getElementById('errorMsg').classList.add('hidden');
}

document.getElementById('emailInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') startCheckout();
});

const STORAGE_KEY = 'blackjack_bankroll_v1';
const STORAGE_HISTORY = 'blackjack_tx_history_v1';

function readHistory() { try { return JSON.parse(localStorage.getItem(STORAGE_HISTORY) || '[]'); } catch { return []; } }
function writeHistory(items) { try { localStorage.setItem(STORAGE_HISTORY, JSON.stringify(items)); } catch {} }
function addHistory(type, amount) { const items = readHistory(); items.unshift({ id: Date.now(), type, amount, ts: new Date().toISOString() }); writeHistory(items); }

export function initBalance() {
  const amountEl = document.getElementById('balance-amount');
  if (!amountEl) return;
  async function refreshBalance() {
    try {
      const r = await fetch('http://localhost:4000/wallet/balance', { credentials: 'include' });
      const { balance } = await r.json();
      amountEl.textContent = String(balance);
    } catch {}
  }
  refreshBalance();
  const input = document.getElementById('balance-value');
  const hist = document.getElementById('balance-history');
  function renderHist() {
    const items = readHistory();
    hist.innerHTML = items.map(it => `<li>[${new Date(it.ts).toLocaleString()}] ${it.type === 'deposit' ? '+' : '-'}${it.amount}</li>`).join('');
  }
  const deposit = document.getElementById('deposit-btn');
  const withdraw = document.getElementById('withdraw-btn');
  if (deposit) deposit.addEventListener('click', async () => {
    const val = Math.max(1, Math.floor(Number(input.value) || 0));
    await fetch('http://localhost:4000/wallet/deposit', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: val }) });
    await refreshBalance(); addHistory('deposit', val); renderHist();
  });
  if (withdraw) withdraw.addEventListener('click', async () => {
    const val = Math.max(1, Math.floor(Number(input.value) || 0));
    await fetch('http://localhost:4000/wallet/withdraw', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: val }) });
    await refreshBalance(); addHistory('withdraw', val); renderHist();
  });
  renderHist();
}

export function initTopup() {
  const cards = document.querySelectorAll('.topup__card');
  if (!cards.length) return;
  const balanceEl = document.getElementById('topup-balance');
  async function refresh() {
    try { const r = await fetch('http://localhost:4000/wallet/balance', { credentials: 'include' }); const { balance } = await r.json(); balanceEl.textContent = String(balance); } catch {}
  }
  cards.forEach((c) => {
    const id = c.getAttribute('data-id');
    const btn = c.querySelector('button');
    if (btn) btn.addEventListener('click', async () => {
      await fetch('http://localhost:4000/wallet/topup', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ packageId: id }) });
      await refresh();
      alert('Nạp thành công');
    });
  });
  refresh();
}


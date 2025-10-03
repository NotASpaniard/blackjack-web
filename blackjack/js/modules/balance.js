const STORAGE_KEY = 'blackjack_bankroll_v1';
const STORAGE_HISTORY = 'blackjack_tx_history_v1';

function readHistory() { try { return JSON.parse(localStorage.getItem(STORAGE_HISTORY) || '[]'); } catch { return []; } }
function writeHistory(items) { try { localStorage.setItem(STORAGE_HISTORY, JSON.stringify(items)); } catch {} }
function addHistory(type, amount) { const items = readHistory(); items.unshift({ id: Date.now(), type, amount, ts: new Date().toISOString() }); writeHistory(items); }

export function initBalance() {
  const amountEl = document.getElementById('balance-amount');
  if (!amountEl) return;
  let bankroll = 0; try { bankroll = Math.max(0, Number(localStorage.getItem(STORAGE_KEY) || '0')); } catch {}
  amountEl.textContent = String(bankroll);
  const input = document.getElementById('balance-value');
  const hist = document.getElementById('balance-history');
  function renderHist() {
    const items = readHistory();
    hist.innerHTML = items.map(it => `<li>[${new Date(it.ts).toLocaleString()}] ${it.type === 'deposit' ? '+' : '-'}${it.amount}</li>`).join('');
  }
  const deposit = document.getElementById('deposit-btn');
  const withdraw = document.getElementById('withdraw-btn');
  if (deposit) deposit.addEventListener('click', () => {
    const val = Math.max(1, Math.floor(Number(input.value) || 0));
    bankroll += val; localStorage.setItem(STORAGE_KEY, String(bankroll));
    amountEl.textContent = String(bankroll);
    addHistory('deposit', val); renderHist();
  });
  if (withdraw) withdraw.addEventListener('click', () => {
    const val = Math.max(1, Math.floor(Number(input.value) || 0));
    bankroll = Math.max(0, bankroll - val); localStorage.setItem(STORAGE_KEY, String(bankroll));
    amountEl.textContent = String(bankroll);
    addHistory('withdraw', val); renderHist();
  });
  renderHist();
}



const STORAGE_TICKETS = 'blackjack_tickets_v1';

function readTickets() { try { return JSON.parse(localStorage.getItem(STORAGE_TICKETS) || '[]'); } catch { return []; } }
function writeTickets(items) { try { localStorage.setItem(STORAGE_TICKETS, JSON.stringify(items)); } catch {} }

export function initContact() {
  const form = document.getElementById('ticket-form');
  if (!form) return;
  const subject = document.getElementById('ticket-subject');
  const content = document.getElementById('ticket-content');
  const list = document.getElementById('ticket-history');
  function renderTickets() { const items = readTickets(); list.innerHTML = items.map(it => `<li>[${new Date(it.ts).toLocaleString()}] ${it.subject}</li>`).join(''); }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const s = subject.value.trim(); const c = content.value.trim(); if (!s || !c) return;
    const items = readTickets(); items.unshift({ id: Date.now(), subject: s, content: c, ts: new Date().toISOString() }); writeTickets(items);
    subject.value = ''; content.value = ''; renderTickets();
  });
  renderTickets();
}



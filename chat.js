(() => {
  'use strict';
  const form = document.querySelector('#chat-form');
  const input = document.querySelector('#campo-pergunta');
  const messages = document.querySelector('#chat-mensagens');
  const sendButton = document.querySelector('#chat-enviar');
  const history = [];
  const MAX_HISTORY = 10;
  const escapeHtml = (value) => value.replace(/[&<>'"]/g, (character) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[character]);
  const safeUrl = (url) => /^(https?:\/\/|mailto:)/i.test(url) ? url : '';
  function renderInline(value) {
    return escapeHtml(value).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\[([^\]]+)\]\(([^\s)]+)\)/g, (_, label, url) => {
      const href = safeUrl(url); return href ? `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>` : label;
    });
  }
  function renderMarkdown(value) {
    const fragments = value.split(/```([\s\S]*?)```/g);
    return fragments.map((fragment, index) => index % 2 ? `<pre><button class="chat-copy" type="button">Copiar</button><code>${escapeHtml(fragment.trim())}</code></pre>` : fragment.split(/\n{2,}/).map((paragraph) => `<p>${renderInline(paragraph).replace(/\n/g, '<br>')}</p>`).join('')).join('');
  }
  function scrollToLatest() { messages.scrollTop = messages.scrollHeight; }
  async function readJsonResponse(response) {
    const rawBody = await response.text();
    if (!rawBody.trim()) return {};
    try { return JSON.parse(rawBody); }
    catch { throw new Error('O servidor enviou uma resposta inválida. Verifique se o backend está em execução.'); }
  }
  function addMessage(role, text, { typing = false } = {}) {
    const article = document.createElement('article');
    article.className = `chat-message chat-message--${role}${typing ? ' chat-typing' : ''}`;
    article.innerHTML = `<span class="chat-avatar" aria-hidden="true">${role === 'assistant' ? 'IA' : 'Você'}</span><div class="chat-content">${typing ? 'Digitando…' : renderMarkdown(text)}</div>`;
    messages.append(article); scrollToLatest(); return article;
  }
  async function sendMessage(event) {
    event.preventDefault();
    const message = input.value.trim();
    if (!message || message.length > 2000) return;
    addMessage('user', message); history.push({ role: 'user', content: message }); input.value = ''; sendButton.disabled = true; input.disabled = true;
    const typing = addMessage('assistant', '', { typing: true });
    try {
      const response = await fetch('/chat', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ message, history:history.slice(-MAX_HISTORY) }) });
      const payload = await readJsonResponse(response);
      if (!response.ok) throw new Error(payload.error || 'O chat está indisponível no momento. Verifique o servidor.');
      typing.remove(); addMessage('assistant', payload.message); history.push({ role: 'assistant', content: payload.message });
      if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
    } catch (error) { typing.remove(); addMessage('assistant', error.message); }
    finally { sendButton.disabled = false; input.disabled = false; input.focus(); }
  }
  form?.addEventListener('submit', sendMessage);
  input?.addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); } });
  messages?.addEventListener('click', async (event) => {
    const button = event.target.closest('.chat-copy'); if (!button) return;
    const code = button.parentElement.querySelector('code').textContent;
    try { await navigator.clipboard.writeText(code); button.textContent = 'Copiado'; setTimeout(() => { button.textContent = 'Copiar'; }, 1500); } catch { button.textContent = 'Erro'; }
  });
  addMessage('assistant', 'Olá! Sou a assistente virtual da psicanalista. Posso responder dúvidas gerais sobre psicanálise e sobre o atendimento. Como posso ajudar?');
})();

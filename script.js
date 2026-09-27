(() => {
  'use strict';
  const photo = document.querySelector('#round-photo');
  const start = document.querySelector('#photo-start');
  const end = document.querySelector('#photo-end');
  const animationDistance = 500;
  let startPosition = { top: 0, left: 0, size: 220 };
  let endPosition = { top: 0, left: 0, size: 52 };
  let scheduled = false;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const interpolate = (from, to, progress) => from + (to - from) * progress;
  function updatePhoto() {
    scheduled = false;
    const progress = clamp(window.scrollY / animationDistance, 0, 1);
    const naturalTop = startPosition.top - window.scrollY;
    const top = interpolate(naturalTop, endPosition.top, progress);
    const left = interpolate(startPosition.left, endPosition.left, progress);
    const size = interpolate(startPosition.size, endPosition.size, progress);
    Object.assign(photo.style, { top: `${top}px`, left: `${left}px`, width: `${size}px`, height: `${size}px`, opacity: '1' });
  }
  function schedulePhotoUpdate() { if (!scheduled) { scheduled = true; requestAnimationFrame(updatePhoto); } }
  function measurePhoto() {
    if (!photo || !start || !end) return;
    const startRect = start.getBoundingClientRect();
    const endRect = end.getBoundingClientRect();
    startPosition = { top: startRect.top + window.scrollY, left: startRect.left + window.scrollX, size: startRect.width };
    endPosition = { top: endRect.top, left: endRect.left, size: endRect.width };
    updatePhoto();
  }
  async function submitContact(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const status = document.querySelector('#status-envio');
    const submitButton = form.querySelector('button[type="submit"]');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    submitButton.disabled = true;
    status.textContent = 'Enviando mensagem…';
    try {
      const response = await fetch('/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Não foi possível enviar a mensagem.');
      status.textContent = body.message;
      form.reset();
    } catch (error) { status.textContent = error.message; }
    finally { submitButton.disabled = false; }
  }
  document.querySelectorAll('[data-scroll-target]').forEach((button) => button.addEventListener('click', () => document.getElementById(button.dataset.scrollTarget)?.scrollIntoView({ behavior: 'smooth' })));
  document.querySelector('#form-contato')?.addEventListener('submit', submitContact);
  window.addEventListener('scroll', schedulePhotoUpdate, { passive: true });
  window.addEventListener('resize', measurePhoto);
  window.addEventListener('load', measurePhoto, { once: true });
  photo?.addEventListener('load', measurePhoto, { once: true });
  requestAnimationFrame(measurePhoto);
  photo?.decode?.().catch(() => {}).finally(measurePhoto);
})();

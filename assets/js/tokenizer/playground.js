// Keep the controller small: the vocabulary is loaded only by the lazy worker.
import { examples } from './examples.mjs';

document.querySelectorAll('[data-tokenizer]').forEach((root) => {
  const input = root.querySelector('textarea');
  const output = root.querySelector('[data-tokens]');
  const status = root.querySelector('[data-status]');
  let worker;
  let timer;
  let busy = false;
  let active = false;
  let composing = false;
  let revision = 0;
  let lastText = null;
  let pending = null;

  function fail() {
    clearTimeout(timer);
    worker?.terminate();
    worker = null;
    busy = false;
    pending = null;
    lastText = null;
    output.replaceChildren();
    status.textContent = 'Could not load the tokenizer. Edit the text or choose an example to retry.';
    output.removeAttribute('aria-busy');
  }

  function dispatch() {
    if (busy || !pending) return;
    try {
      if (!worker) {
        status.textContent = 'Loading tokenizer…';
        worker = new Worker(root.dataset.worker);
        worker.onerror = fail;
        worker.onmessageerror = fail;
        worker.onmessage = ({ data }) => {
          busy = false;
          if (data.revision === revision) {
            output.removeAttribute('aria-busy');
            if (data.error) {
              output.replaceChildren();
              status.textContent = data.error;
            } else {
              const fragment = document.createDocumentFragment();
              for (const token of data.tokens) {
                const chip = document.createElement('li');
                chip.className = 'tokenizer__token';
                const text = document.createElement('bdi');
                text.dir = 'auto';
                text.textContent = token.text;
                if (token.partial) text.title = 'Incomplete UTF-8: exact bytes of this token';
                const id = document.createElement('span');
                id.className = 'tokenizer__id';
                id.textContent = `ID ${token.id}`;
                chip.append(text, id);
                fragment.append(chip);
              }
              output.replaceChildren(fragment);
              status.textContent = `${data.count.toLocaleString()} ${data.count === 1 ? 'token' : 'tokens'}` +
                (data.count > data.tokens.length ? ` · Showing the first ${data.tokens.length.toLocaleString()} tokens.` : '');
            }
          }
          dispatch();
        };
      }
      busy = true;
      worker.postMessage(pending);
      pending = null;
    } catch {
      fail();
    }
  }

  function update(immediate = false) {
    if (composing || input.value === lastText) return;
    lastText = input.value;
    revision += 1;
    clearTimeout(timer);
    pending = null;
    if (!input.value) {
      output.replaceChildren();
      output.removeAttribute('aria-busy');
      status.textContent = '0 tokens · Type or choose an example to begin.';
      return;
    }
    output.setAttribute('aria-busy', 'true');
    status.textContent = 'Tokenizing…';
    const request = { revision, text: input.value };
    timer = setTimeout(() => {
      pending = request;
      dispatch();
    }, immediate ? 0 : 120);
  }

  function activate() {
    if (active) return;
    active = true;
    update(true);
  }
  input.addEventListener('compositionstart', () => {
    composing = true;
    // Pause queued work and invalidate in-flight replies until the IME commits.
    clearTimeout(timer);
    pending = null;
    lastText = null;
    revision += 1;
  });
  input.addEventListener('compositionend', () => { composing = false; update(); });
  input.addEventListener('input', () => { activate(); update(); });
  root.addEventListener('focusin', activate);
  root.querySelectorAll('[data-example]').forEach((button) => {
    button.addEventListener('click', () => {
      input.value = examples[button.dataset.example];
      activate();
      update(true);
    });
  });
  root.querySelector('[data-clear]').addEventListener('click', () => {
    input.value = '';
    update(true);
    input.focus();
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        activate();
        observer.disconnect();
      }
    }, { rootMargin: '150px' });
    observer.observe(root);
  } else {
    activate();
  }
});

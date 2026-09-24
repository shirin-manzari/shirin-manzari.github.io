import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { tokenize, tokenDetails, visibleText, DISPLAY_LIMIT } from '../assets/js/tokenizer/model.mjs';
import { examples } from '../assets/js/tokenizer/examples.mjs';
import library from '../assets/vendor/gpt-tokenizer/o200k_base.js';

const page = readFileSync('public/blog/tokens-not-words/index.html', 'utf8');
const workerPath = page.match(/data-worker=["']?([^"'\s>]+)/)?.[1];
const controllerPath = page.match(/src=["']?(\/js\/tokenizer\.[^"'\s>]+)/)?.[1];

for (const [name, input] of Object.entries({
  ...examples, whitespace: '  \t\n\r\n ', empty: '',
  unicode: '\uFEFFé e\u0301 می‌توان 🦄 👩🏽‍💻 \u0000 \u202E',
  special: '<|endoftext|> <|fim_prefix|>', html: '<img src=x onerror=alert(1)>',
})) {
  test(`${name}: IDs and raw bytes agree with the actual o200k_base library`, () => {
    const ids = library.encode(input, { disallowedSpecial: new Set() });
    const result = tokenize(input);
    assert.deepEqual(result.tokens.map((token) => token.id), ids);
    assert.equal(result.count, ids.length);
    const bytes = ids.flatMap((id) => {
      const raw = library.bytePairEncodingCoreProcessor.tryDecodeToken(id);
      return Array.from(typeof raw === 'string' ? new TextEncoder().encode(raw) : raw);
    });
    assert.equal(new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(Uint8Array.from(bytes)), input);
  });
}

test('incomplete UTF-8 tokens show lossless hex bytes, never replacement characters', () => {
  const tokens = tokenize('🦄').tokens;
  assert.ok(tokens.some((token) => token.partial));
  for (const token of tokens.filter((token) => token.partial)) {
    assert.match(token.text, /^(\\x[0-9A-F]{2})+$/);
    assert.ok(!token.text.includes('�'));
  }
  assert.equal(tokenDetails(library.encode('�')[0]).partial, false);
});

test('whitespace and invisible controls are explicit', () => {
  assert.equal(visibleText(' \n\t\r\u200c\u00a0'), '␠↵\n⇥␍\\u{200C}\\u{A0}');
});

test('large input retains full count with bounded rendering; oversized input is rejected', () => {
  const input = 'hello! '.repeat(2000);
  const result = tokenize(input);
  assert.equal(result.count, library.encode(input).length);
  assert.equal(result.tokens.length, DISPLAY_LIMIT);
  assert.throws(() => tokenize('x'.repeat(20001)), /20,000/);
});

test('production HTML renders the shortcode and loads assets only on the target post', () => {
  const html = readFileSync('public/blog/tokens-not-words/index.html', 'utf8');
  assert.match(html, /data-tokenizer/);
  assert.match(html, /aria-live=\"?polite/);
  assert.match(html, /data-worker=/);
  assert.match(html, /tokenizer\.min\./);
  assert.ok(!html.includes('{{<'));
  for (const page of ['public/index.html', 'public/blog/index.html']) {
    assert.ok(!readFileSync(page, 'utf8').includes('/js/tokenizer.'));
  }
  assert.ok(workerPath);
  let reply;
  const self = { postMessage: (message) => { reply = message; } };
  runInNewContext(readFileSync(`public${workerPath}`, 'utf8'), { self, TextEncoder, TextDecoder });
  self.onmessage({ data: { revision: 7, text: examples.persian } });
  assert.equal(reply.revision, 7);
  assert.equal(reply.count, tokenize(examples.persian).count);
  self.onmessage({ data: { revision: 8, text: '' } });
  assert.equal(reply.count, 0);
  assert.ok(existsSync('public/.nojekyll'));
  const home = readFileSync('public/index.html', 'utf8');
  assert.ok(home.includes('Personal blog of Shirin Manzari'));
  assert.ok(home.includes('/css/site.min'));
});

// Exercise the built controller with deterministic timers and delayed worker
// replies. This checks scheduling without adding a browser/runtime dependency.
function playground() {
  function element() {
    return {
      value: '', textContent: '', children: [], dataset: {}, listeners: {},
      addEventListener(type, callback) { this.listeners[type] = callback; },
      emit(type) { this.listeners[type]?.(); },
      setAttribute() {}, removeAttribute() {}, focus() {},
      append(...children) { this.children.push(...children); },
      replaceChildren(...children) { this.children = children; },
    };
  }
  const input = element();
  input.value = examples.english;
  const output = element();
  const status = element();
  const clear = element();
  const root = element();
  const controls = { textarea: input, '[data-tokens]': output, '[data-status]': status, '[data-clear]': clear };
  root.querySelector = (selector) => controls[selector];
  root.querySelectorAll = () => [];
  const timers = new Map();
  const workers = [];
  let nextTimer = 0;
  class Worker {
    constructor() { this.requests = []; workers.push(this); }
    postMessage(request) { this.requests.push(request); }
    terminate() { this.terminated = true; }
    reply(index = this.requests.length - 1) {
      const { revision, text } = this.requests[index];
      this.onmessage({ data: { revision, ...tokenize(text) } });
    }
  }
  assert.ok(controllerPath);
  runInNewContext(readFileSync(`public${controllerPath}`, 'utf8'), {
    document: {
      querySelectorAll: () => [root],
      createElement: element, createDocumentFragment: element,
    },
    window: {}, Worker,
    setTimeout: (callback) => { timers.set(++nextTimer, callback); return nextTimer; },
    clearTimeout: (id) => timers.delete(id),
  });
  return {
    input, output, status, clear, workers,
    type(value) { input.value = value; input.emit('input'); },
    flush() {
      const callbacks = [...timers.values()];
      timers.clear();
      callbacks.forEach((callback) => callback());
    },
  };
}

test('rapid edits keep one request in flight and ignore stale replies, including after clear', () => {
  const ui = playground();
  ui.flush();
  const worker = ui.workers[0];
  ui.type('old edit');
  ui.flush();
  ui.type(examples.persian);
  ui.flush();
  assert.equal(worker.requests.length, 1);
  worker.reply(0);
  assert.equal(ui.output.children.length, 0);
  assert.equal(worker.requests.length, 2);
  assert.equal(worker.requests[1].text, examples.persian);
  ui.clear.emit('click');
  worker.reply(1);
  assert.match(ui.status.textContent, /^0 tokens/);
  assert.equal(ui.output.children.length, 0);
});

test('IME composition cancels queued work and rejects replies for pre-composition text', () => {
  const ui = playground();
  ui.flush();
  const worker = ui.workers[0];
  ui.type('before composition');
  ui.input.emit('compositionstart');
  ui.type(examples.persian);
  ui.flush();
  worker.reply();
  assert.equal(worker.requests.length, 1);
  assert.equal(ui.output.children.length, 0);
  ui.input.emit('compositionend');
  ui.flush();
  assert.equal(worker.requests.length, 2);
  worker.reply();
  assert.match(ui.status.textContent, /^\d+ tokens$/);
});

test('worker failure cancels pending timers and permits retry on the next edit', () => {
  const ui = playground();
  ui.flush();
  ui.type('pending edit');
  ui.workers[0].onerror();
  ui.flush();
  assert.equal(ui.workers.length, 1);
  assert.equal(ui.workers[0].terminated, true);
  assert.match(ui.status.textContent, /retry/);
  ui.type('retry edit');
  ui.flush();
  assert.equal(ui.workers.length, 2);
  ui.workers[1].reply();
  assert.match(ui.status.textContent, /^\d+ tokens$/);
});

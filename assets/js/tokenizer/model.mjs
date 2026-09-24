import tokenizer from '../../vendor/gpt-tokenizer/o200k_base.js';

const utf8 = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
const whitespaceMarkers = { ' ': '␠', '\n': '↵\n', '\t': '⇥', '\r': '␍' };
export const DISPLAY_LIMIT = 2000;
export const INPUT_LIMIT = 20000;

export function visibleText(text) {
  return text.replace(/[\p{Cc}\p{Cf}\p{Zs}\p{Zl}\p{Zp}]/gu,
    (character) => whitespaceMarkers[character] ??
      `\\u{${character.codePointAt(0).toString(16).toUpperCase()}}`);
}

export function tokenDetails(id) {
  // Pinned gpt-tokenizer 4.0.0 internal API: preserves byte fragments which
  // decode([id]) would replace with U+FFFD. Covered by round-trip tests.
  const raw = tokenizer.bytePairEncodingCoreProcessor.tryDecodeToken(id);
  if (raw === undefined) throw new Error(`Unknown token ${id}`);
  // The library already decodes complete strings; only byte fragments need a decoder.
  if (typeof raw === 'string') return { id, text: visibleText(raw), partial: false };
  try {
    return { id, text: visibleText(utf8.decode(raw)), partial: false };
  } catch {
    return {
      id,
      text: Array.from(raw, (byte) => `\\x${byte.toString(16).padStart(2, '0').toUpperCase()}`).join(''),
      partial: true,
    };
  }
}

export function tokenize(text) {
  if (text.length > INPUT_LIMIT) throw new Error('Please use at most 20,000 characters.');
  // Literal special-token strings are ordinary reader input, not instructions.
  const ids = tokenizer.encode(text, { disallowedSpecial: new Set() });
  return { count: ids.length, tokens: ids.slice(0, DISPLAY_LIMIT).map(tokenDetails) };
}

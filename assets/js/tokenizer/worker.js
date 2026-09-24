import { tokenize } from './model.mjs';

self.onmessage = ({ data: { revision, text } }) => {
  try {
    self.postMessage({ revision, ...tokenize(text) });
  } catch (error) {
    self.postMessage({ revision, error: error.message });
  }
};

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// jsdom 16 (react-scripts 5) doesn't implement Web Crypto API.
// Polyfill with Node's crypto.randomFillSync so generateToken() works in tests.
// Production code runs in the browser where window.crypto is always available.
const nodeCrypto = require('crypto');
Object.defineProperty(global, 'crypto', {
  value: { getRandomValues: (arr) => nodeCrypto.randomFillSync(arr) },
  configurable: true,
});

import { expect } from 'chai';
import { html } from './index.js';

describe('index.js', () => {
  describe('html', () => {
    it('does NOT remove carriage returns', () => {
      const value = `abc\r`;
      /* prettier-ignore */
      const result = html`${value}`;
      expect(result).to.equal(value);
    });

    it('does NOT remove newlines', () => {
      const value = `abc\n`;
      /* prettier-ignore */
      const result = html`${value}`;
      expect(result).to.equal(value);
    });
  });
});

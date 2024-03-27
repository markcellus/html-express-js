import { expect } from 'chai';
import { html } from './index.js';

describe('index.js', () => {
  describe('html', () => {
    it('removes carriage returns', () => {
      const value = 'abc';
      /* prettier-ignore */
      const result = html`${value}\r`;
      expect(result).to.equal(value);
    });

    it('removes newlines', () => {
      const value = 'abc';
      /* prettier-ignore */
      const result = html`${value}\n`;
      expect(result).to.equal(value);
    });
  });
});

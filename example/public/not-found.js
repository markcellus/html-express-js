import { html } from '../../src/index.js';

export const view = (data, state) => html`
  <!DOCTYPE html>
  <html lang="en">
    <head>
      ${state.includes.head}
      <title>404</title>
    </head>

    <body>
      Not found!
    </body>
  </html>
`;

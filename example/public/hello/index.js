import { html } from '../../../src/index.js';

export const view = (data, state) => html`
  <!doctype html>
  <html lang="en">
    <head>
      ${state.includes.head}
      <title>Hello!</title>
    </head>

    <body>
      <h1>Hello, ${data.name}!</h1>

      <p>Click <a href="/">here</a> to go back to the dashboard.</p>
    </body>
  </html>
`;

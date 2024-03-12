import { html } from '../../src/index.js';

export const view = (data, state) => html`
  <!doctype html>
  <html lang="en">
    <head>
      ${state.includes.head}
      <title>Dashboard</title>
    </head>

    <body>
      <h1>This is the dashboard!</h1>

      <p>
        This file is served by the <code>staticIndexHandler</code> in app.js
      </p>

      <p>Click <a href="/hello">here</a> to go hello route.</p>
    </body>
  </html>
`;

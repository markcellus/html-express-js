import { html } from 'lit-html';

export const view = (data, state) => html`
  <!DOCTYPE html>
  <html lang="en">
    <head>
      ${state.includes.head}
      <title>Dashboard</title>
    </head>

    <body>
      <h1>This is the dashboard!</h1>

      <p>Click <a href="/hello">here</a> to go hello route.</p>
    </body>
  </html>
`;

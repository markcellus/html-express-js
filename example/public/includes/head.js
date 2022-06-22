import { html } from '../../../src/index.js';

export const view = (/*data, state*/) => html`
  <meta charset="utf-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=0"
  />

  <link rel="stylesheet" href="/main.css" />

  <!-- For HMR! -->
  <script src="/reload/reload.js"></script>
`;

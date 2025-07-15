import { html, fixture, expect } from '@open-wc/testing';

import './compat-2021.js';

describe('Compat2021', () => {
  it('renders the summary', async () => {
    const el = await fixture(html`<compat-2021></compat-2021>`);
    expect(el.shadowRoot.querySelector('compat-2021-summary')).to.exist;
  });
});

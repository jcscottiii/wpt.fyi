import { html, fixture, expect } from '@open-wc/testing';

import './wpt-404.js';

describe('WPT404', () => {
  it('renders a message', async () => {
    const el = await fixture(html`<wpt-404></wpt-404>`);
    expect(el.shadowRoot.querySelector('h1').textContent).to.contain('Sorry, we couldn\'t find that page');
  });
});

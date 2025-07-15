import { html, fixture, expect } from '@open-wc/testing';

import './wpt-results.js';

describe('WPTResults', () => {
  it('renders a table', async () => {
    const el = await fixture(html`<wpt-results></wpt-results>`);
    expect(el.shadowRoot.querySelector('table')).to.exist;
  });
});

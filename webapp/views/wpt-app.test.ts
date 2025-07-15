import { html, fixture, expect } from '@open-wc/testing';

import './wpt-app.js';

describe('WPTApp', () => {
  it('renders the header', async () => {
    const el = await fixture(html`<wpt-app></wpt-app>`);
    expect(el.shadowRoot.querySelector('wpt-header')).to.exist;
  });
});

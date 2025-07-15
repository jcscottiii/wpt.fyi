import { html, fixture, expect } from '@open-wc/testing';

import './info-banner.js';

describe('InfoBanner', () => {
  it('renders a banner', async () => {
    const el = await fixture(html`<info-banner></info-banner>`);
    expect(el.shadowRoot.querySelector('.banner')).to.exist;
  });
});

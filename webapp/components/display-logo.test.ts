import { html, fixture, expect } from '@open-wc/testing';

import './display-logo.js';

describe('DisplayLogo', () => {
  it('renders an image', async () => {
    const el = await fixture(html`<display-logo></display-logo>`);
    expect(el.shadowRoot.querySelector('img')).to.exist;
  });
});

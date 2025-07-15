import { html, fixture, expect } from '@open-wc/testing';

import './browser-picker.js';

describe('BrowserPicker', () => {
  it('renders a dropdown', async () => {
    const el = await fixture(html`<browser-picker></browser-picker>`);
    expect(el.shadowRoot.querySelector('paper-dropdown-menu')).to.exist;
  });
});

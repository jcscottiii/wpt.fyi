import { html, fixture, expect } from '@open-wc/testing';

import './channel-picker.js';

describe('ChannelPicker', () => {
  it('renders a dropdown', async () => {
    const el = await fixture(html`<channel-picker></channel-picker>`);
    expect(el.shadowRoot.querySelector('paper-dropdown-menu')).to.exist;
  });
});

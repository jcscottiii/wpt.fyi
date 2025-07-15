import { html, fixture, expect } from '@open-wc/testing';

import './interop-dashboard.js';

describe('InteropDashboard', () => {
  it('renders the summary', async () => {
    const el = await fixture(html`<interop-dashboard></interop-dashboard>`);
    expect(el.shadowRoot.querySelector('interop-summary')).to.exist;
  });
});

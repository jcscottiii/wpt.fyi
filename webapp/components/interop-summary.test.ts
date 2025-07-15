import { html, fixture, expect } from '@open-wc/testing';

import './interop-summary.js';

describe('InteropSummary', () => {
  it('renders the summary numbers', async () => {
    const el = await fixture(html`<interop-summary></interop-summary>`);
    expect(el.shadowRoot.querySelector('#summaryNumberRow')).to.exist;
  });
});

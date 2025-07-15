import { html, fixture, expect } from '@open-wc/testing';

import './interop-feature-chart.js';

describe('InteropFeatureChart', () => {
  it('renders a chart', async () => {
    const el = await fixture(html`<interop-feature-chart></interop-feature-chart>`);
    expect(el.shadowRoot.querySelector('#failuresChart')).to.exist;
  });
});

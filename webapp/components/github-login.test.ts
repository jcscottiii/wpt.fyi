import { html, fixture, expect } from '@open-wc/testing';

import './github-login.js';

describe('GitHubLogin', () => {
  it('renders a login button', async () => {
    const el = await fixture(html`<github-login></github-login>`);
    expect(el.shadowRoot.querySelector('paper-button')).to.exist;
  });
});

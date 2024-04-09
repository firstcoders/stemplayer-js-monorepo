import { html } from 'lit';
import { fixture, expect } from '@open-wc/testing';

import '../soundws-loader.js';

describe('SoundwsLoader', () => {
  it('renders', async () => {
    const el = await fixture(html`<soundws-loader></soundws-loader>`);

    expect(el.shadowRoot.firstElementChild.classList[0] === 'loader');
  });

  it('passes the a11y audit', async () => {
    const el = await fixture(html`<soundws-loader></soundws-loader>`);

    await expect(el).shadowDom.to.be.accessible();
  });
});

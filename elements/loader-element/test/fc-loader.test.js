import { html } from 'lit';
import { fixture, expect } from '@open-wc/testing';

import '../fc-loader.js';

describe('FcLoader', () => {
  it('renders', async () => {
    const el = await fixture(html`<fc-loader></fc-loader>`);

    expect(el.shadowRoot.firstElementChild.classList[0] === 'loader');
  });

  it('passes the a11y audit', async () => {
    const el = await fixture(html`<fc-loader></fc-loader>`);

    await expect(el).shadowDom.to.be.accessible();
  });
});

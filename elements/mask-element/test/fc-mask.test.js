import { html } from 'lit';
import { fixture, expect } from '@open-wc/testing';

import '../fc-mask.js';

describe('FcMask', () => {
  it('renders a mask element', async () => {
    const el = await fixture(html`<fc-mask></fc-mask>`);

    expect(getComputedStyle(el).position).to.equal('absolute');
  });

  it('renders content in the mask', async () => {
    const el = await fixture(html`<fc-mask><span>Nice!</span></fc-mask>`);

    expect(
      el.shadowRoot.firstElementChild.assignedNodes()[0].innerHTML,
    ).to.equal('Nice!');
  });

  it('passes the a11y audit', async () => {
    const el = await fixture(html`<fc-mask></fc-mask>`);

    await expect(el).shadowDom.to.be.accessible();
  });
});

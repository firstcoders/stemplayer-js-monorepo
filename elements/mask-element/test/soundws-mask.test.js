import { html } from 'lit';
import { fixture, expect } from '@open-wc/testing';

import '../soundws-mask.js';

describe('SoundwsMask', () => {
  it('renders a mask element', async () => {
    const el = await fixture(html`<soundws-mask></soundws-mask>`);

    expect(getComputedStyle(el.shadowRoot.firstElementChild).position).to.equal(
      'absolute',
    );
  });

  it('renders content in the mask', async () => {
    const el = await fixture(
      html`<soundws-mask><span>Nice!</span></soundws-mask>`,
    );

    expect(
      el.shadowRoot.firstElementChild.firstElementChild.assignedNodes()[0]
        .innerHTML,
    ).to.equal('Nice!');
  });

  it('passes the a11y audit', async () => {
    const el = await fixture(html`<soundws-mask></soundws-mask>`);

    await expect(el).shadowDom.to.be.accessible();
  });
});

import { html } from 'lit';
import { fixture, expect } from '@open-wc/testing';

import '../fc-player-button.js';

describe('FcPlayerButton', () => {
  it('renders an icon', async () => {
    const el = await fixture(
      html`<fc-player-button type="play"></fc-player-button>`,
    );

    expect(!!el.shadowRoot.querySelector('svg')).to.equal(true);
  });

  describe('when no label attribute is given', () => {
    it('renders #aria-label with the type name', async () => {
      const el = await fixture(
        html`<fc-player-button type="play"></fc-player-button>`,
      );

      expect(
        el.shadowRoot.firstElementChild.getAttribute('aria-label'),
      ).to.equal('play');
    });
  });

  describe('when a label attribute is given', () => {
    it('renders #aria-label with the label name', async () => {
      const el = await fixture(
        html`<fc-player-button
          type="play"
          label="somethingelse"
        ></fc-player-button>`,
      );

      expect(
        el.shadowRoot.firstElementChild.getAttribute('aria-label'),
      ).to.equal('somethingelse');
    });
  });

  it('passes the a11y audit', async () => {
    const el = await fixture(
      html`<fc-player-button type="play"></fc-player-button>`,
    );

    await expect(el).shadowDom.to.be.accessible();
  });
});

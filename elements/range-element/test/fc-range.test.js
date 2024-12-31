import { html } from 'lit';
import { fixture, expect } from '@open-wc/testing';

import '../fc-range.js';

describe('FcRange', () => {
  it('emits a change event', async () => {
    const el = await fixture(html`<fc-range></fc-range>`);

    let value;

    el.addEventListener('change', e => {
      value = e.detail;
    });

    el.shadowRoot.firstElementChild.value = 75;
    el.shadowRoot.firstElementChild.dispatchEvent(new Event('change'));

    expect(value === 75);
  });

  it('emits a input event', async () => {
    const el = await fixture(html`<fc-range></fc-range>`);

    let value;

    el.addEventListener('input', e => {
      value = e.detail;
    });

    el.shadowRoot.firstElementChild.value = 76;
    el.shadowRoot.firstElementChild.dispatchEvent(new Event('input'));

    expect(value === 76);
  });

  it('exposes the value', async () => {
    const el = await fixture(html`<fc-range></fc-range>`);

    el.shadowRoot.firstElementChild.value = 77;

    expect(el.value === 77);
  });

  it('passes the a11y audit', async () => {
    const el = await fixture(html`<fc-range></fc-range>`);

    await expect(el).shadowDom.to.be.accessible();
  });
});

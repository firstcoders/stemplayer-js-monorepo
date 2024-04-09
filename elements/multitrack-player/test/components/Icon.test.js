import { html } from 'lit';
import { fixture, expect } from '@open-wc/testing';
import { defineCustomElements, IconComponent } from '../../src/component/Icon';

defineCustomElements();

describe('IconComponent', () => {
  it('intantiates', async () => {
    const el = await fixture(html`<soundws-icon></soundws-icon>`);
    expect(el instanceof IconComponent).to.equal(true);
  });
});

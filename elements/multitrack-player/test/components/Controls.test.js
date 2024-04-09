import { html } from 'lit';
import { fixture, expect } from '@open-wc/testing';
import { defineCustomElements, ControlComponent } from '../../src/component/Controls';

defineCustomElements();

describe('ControlComponent', () => {
  it('intantiates', async () => {
    const el = await fixture(html`<soundws-stem-player-controls></soundws-stem-player-controls>`);
    expect(el instanceof ControlComponent).to.equal(true);
  });
});

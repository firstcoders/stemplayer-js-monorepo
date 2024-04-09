import { html } from 'lit';
import { fixture, expect } from '@open-wc/testing';

import '../mixthat-playlist.js';

describe('MixthatPlaylist', () => {
  it('passes the a11y audit', async () => {
    const el = await fixture(html`<mixthat-playlist></mixthat-playlist>`);

    await expect(el).shadowDom.to.be.accessible();
  });
});

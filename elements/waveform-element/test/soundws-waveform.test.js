import { html } from 'lit';
import { fixture, expect } from '@open-wc/testing';

import '../soundws-waveform.js';

describe('SoundwsWaveform', () => {
  it('loads the peaks when the .src changes', async () => {
    const el = await fixture(
      html`<soundws-waveform
        src="demo/assets/waveforms/106 BELL_05.3.json"
      ></soundws-waveform>`,
    );

    await new Promise(done => {
      el.addEventListener('load', () => {
        done();
      });
    });

    expect(el.peaks.data.length).to.equal(2934);
  });

  it('redraws peaks change', async () => {
    const el = await fixture(
      html`<soundws-waveform
        src="demo/assets/waveforms/106 BELL_05.3.json"
      ></soundws-waveform>`,
    );

    let emitted = 0;

    el.addEventListener('draw', () => {
      emitted += 1;
    });

    await new Promise(done => {
      setTimeout(done, 100);
    });

    el.peaks = { data: [] };

    expect(emitted > 1);
  });

  it('redraws when the .scaleY changes', async () => {
    const el = await fixture(
      html`<soundws-waveform
        src="demo/assets/waveforms/106 BELL_05.3.json"
      ></soundws-waveform>`,
    );

    let emitted = 0;

    el.addEventListener('draw', () => {
      emitted += 1;
    });

    el.scaleY = 0.1;
    await new Promise(done => {
      setTimeout(done, 100);
    });

    expect(emitted).to.equal(1);
  });

  it('updates the progress indicator when .progress changes', async () => {
    const el = await fixture(
      html`<soundws-waveform
        src="demo/assets/waveforms/106 BELL_05.3.json"
      ></soundws-waveform>`,
    );

    await new Promise(done => {
      setTimeout(done, 100);
    });

    el.progress = 0.9;
  });

  // it('emits a load event when the peaks are loaded', async () => {});

  // it('emits a waveform:draw event when the wave is drawn', async () => {});

  // it('exposes an .adjustedPeaks property which takes into account the .scaleY modifier', async () => {});

  it('passes the a11y audit', async () => {
    const el = await fixture(html`<soundws-waveform></soundws-waveform>`);

    await expect(el).shadowDom.to.be.accessible();
  });
});

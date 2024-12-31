import { html, LitElement, css } from 'lit';
import createDrawer from './lib/createDrawer.js';
import onResize from './lib/on-resize.js';
import Peaks from './lib/Peaks.js';

/**
 * A simple waveform element that can render a waveform based on a data structure
 * produced (or compatible) by BBC audiowaveform json response.
 *
 * @see https://github.com/bbc/audiowaveform
 *
 * @cssprop [--soundws-waveform-min-height="25px"]
 */
export class SoundwsWaveform extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
        overflow: hidden;
        height: 100%;
        width: 100%;
        max-width: 100%;
      }

      .container {
        height: 100%;
        min-height: var(--soundws-waveform-min-height, 25px);
      }
    `;
  }

  static properties = {
    src: { type: String },
    waveColor: { type: String },
    barGap: { type: Number },
    barWidth: { type: Number },
    scaleY: { type: Number },
    pixelRatio: { type: Number },
    peaks: { type: Object },

    /**
     * Padding reduces the maximum waveform height to create a padding effect
     */
    padding: { type: Number },
  };

  constructor() {
    super();
    this.waveColor = 'white';
    this.barGap = 2;
    this.barWidth = 2;
    this.pixelRatio = 2;
    this.padding = 0.1;

    this.addEventListener('click', e => {
      this.dispatchEvent(
        new CustomEvent('waveform:seek', {
          bubbles: true,
          composed: true,
          detail: Math.round((e.offsetX / e.target.clientWidth) * 100) / 100,
        }),
      );
    });
  }

  destroy() {
    this.#destroyDrawer();
  }

  connectedCallback() {
    super.connectedCallback();

    setTimeout(() => {
      this.onResizeCallback = onResize(
        this.shadowRoot.firstElementChild,
        () => {
          this.drawPeaks();
        },
      );
    }, 0);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.onResizeCallback?.un();
  }

  updated(changedProperties) {
    changedProperties.forEach((oldValue, propName) => {
      if (propName === 'src') {
        if (this.src && this.src !== oldValue) this.#loadPeaks();
      }
      if (propName === 'scaleY' || propName === 'peaks') {
        this.drawPeaks();
      }
      if (
        ['waveColor', 'barGap', 'barWidth', 'pixelRatio'].indexOf(propName) !==
        -1
      ) {
        // updating any of these properties requires a new drawer
        this.#destroyDrawer();
        this.drawPeaks();
      }
    });
  }

  render() {
    return html`<div class="container"></div>`;
  }

  /**
   * Loads the waveform from src
   * @private
   * @returns {Promise}
   */
  async #loadPeaks() {
    try {
      // cancel any previous requests
      if (this.loadHandle) this.loadHandle.cancel();

      const abortController = new AbortController();

      const promise = fetch(this.src, {
        signal: abortController.signal,
      });

      // store reference to cancel
      this.loadHandle = {
        promise,
        cancel: () => abortController.abort(),
      };

      const r = await promise;

      if (!r.ok) {
        const error = new Error('Waveform Fetch failed');
        error.name = 'WaveformFetchError';
        error.response = r;
        throw error;
      }

      const peaks = new Peaks(await r.json());
      this.peaks = peaks;

      this.dispatchEvent(new Event('load'));
    } catch (err) {
      this.dispatchEvent(new ErrorEvent('error', err));
    } finally {
      this.loadHandle = undefined;
    }
  }

  /**
   * Creates the waveform drawer
   * @private
   */
  async createDrawer() {
    if (this.drawer) throw new Error('Unable to create multiple drawers');

    const container = this.shadowRoot.querySelector('.container');

    this.drawer = createDrawer({
      container,
      params: {
        barGap: this.barGap || 2,
        barWidth: this.barWidth > 0 ? this.barWidth : undefined,
        height: container.clientHeight,
        normalize: false,
        pixelRatio: this.pixelRatio || 2,
        waveColor: this.waveColor,
        cursorWidth: 1,
        dragSelection: false,
      },
    });

    this.drawer.init();

    // the drawer needs to stabilise rendering first. We deduce if it has by checking the width
    await new Promise(done => {
      let x = 0;
      const i = setInterval(() => {
        if (x > 10 || this.drawer.width > 0) {
          clearInterval(i);
          done();
          x += 1;
        }
      }, 100);
    });
  }

  /**
   * @private
   */
  #destroyDrawer() {
    this.drawer?.destroy();
    this.drawer = null;
  }

  /**
   * (re)-draw the waveform
   */
  drawPeaks() {
    if (!this.peaks) return;

    if (this.drawPeaksAnimFrame) cancelAnimationFrame(this.drawPeaksAnimFrame);

    if (this.clientWidth === 0) return;

    // set the width of the element
    const defaultPixelsPerSecond = this.clientWidth / this.peaks.duration;
    this.style.width = `calc(var(--soundws-waveform-pixels-per-second, ${defaultPixelsPerSecond}) * ${this.peaks.duration}px)`;

    if (!this.drawer) this.createDrawer();

    this.drawPeaksAnimFrame = requestAnimationFrame(() => {
      const { scaleY } = this;
      const peaks = this.peaks.data.map(
        e => e * (scaleY !== undefined ? scaleY : 1) * (1 - this.padding),
      );

      this.drawer.drawPeaks(peaks);

      // non bubbling event
      this.dispatchEvent(new Event('draw'));

      // composed event, bubbles past shadow doms
      this.dispatchEvent(
        new CustomEvent('waveform:draw', {
          bubbles: true,
          composed: true,
          detail: this,
        }),
      );
    });
  }

  get adjustedPeaks() {
    const { scaleY, peaks } = this;

    if (peaks) {
      return new Peaks({
        ...peaks,
        data: peaks.data.map(e => e * (scaleY !== undefined ? scaleY : 1)),
        normalize: false,
      });
    }

    return undefined;
  }
}

import { html, LitElement, css } from 'lit';
import createDrawer from '../lib/createDrawer';
import defineCustomElement from '../lib/define-custom-element';
import onResize from '../lib/on-resize';

export class WaveformElement extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
        height: 100%;
        background-size: calc(var(--waveformduration) * var(--pixels-per-second)) 100%;
        background-position-x: calc(-1 * var(--offset, 0) * var(--pixels-per-second));
      }
      .container {
        height: 100%;
        visibility: hidden;
        width: calc(var(--waveformduration) * var(--pixels-per-second));
      }
    `;
  }

  static properties = {
    waveform: { type: String },
    duration: { type: Number },
    offset: { type: Number },
  };

  destroy() {
    this.drawer?.destroy();
    this.onResizeCallback?.un();
  }

  connectedCallback() {
    super.connectedCallback();
    setTimeout(() => {
      if (this.waveform && !this.peaks) this.loadPeaks();

      this.onResizeCallback = onResize(this.shadowRoot.firstElementChild, () => {
        this.drawPeaks();
      });
    }, 0);
  }

  disconnectedCallback() {
    this.onResizeCallback?.un();
  }

  updated(changedProperties) {
    changedProperties.forEach((oldValue, propName) => {
      if (propName === 'duration') {
        this.style.setProperty('--duration', this.duration);
      }
      if (propName === 'offset') {
        this.style.setProperty('--offset', this.offset);
      }
    });
  }

  render() {
    return html`<div class="container"></div>`;
  }

  set waveform(waveform) {
    this._waveform = waveform;
    this.loadPeaks();
  }

  get waveform() {
    return this._waveform;
  }

  /**
   * Loads the waveform from src
   * @private
   * @returns {Promise}
   */
  loadPeaks() {
    return fetch(this.waveform)
      .then((r) => {
        if (!r.ok) {
          const error = new Error('Waveform Fetch failed');
          error.name = 'WaveformFetchError';
          error.response = r;
          throw error;
        }
        return r;
      })
      .then((res) => res.json())
      .then((res) => {
        this.peaks = res;
        this.drawPeaks();

        this.dispatchEvent(
          new CustomEvent('waveform-load', {
            detail: res,
            bubbles: true,
            composed: true,
          })
        );
      })
      .catch((err) => {
        // dispatch error event on element (doesnt bubble)
        this.dispatchEvent(new ErrorEvent('error', err));

        // dispatch bubbling event so that the player-component can respond to it
        this.dispatchEvent(
          new CustomEvent('waveform-loading-error', { detail: err, bubbles: true, composed: true })
        );
      });
  }

  set peaks(peaks) {
    this._peaks = peaks;

    const waveduration = (peaks.samples_per_pixel * peaks.length) / peaks.sample_rate;
    this.style.setProperty('--waveformduration', waveduration);

    this.duration = this.duration || waveduration;

    setTimeout(() => {
      this.drawPeaks();
    }, 0);
  }

  get peaks() {
    return this._peaks;
  }

  get end() {
    return this.start + this.duration;
  }

  get pixelsPerSecond() {
    return this.clientWidth / this.duration;
  }

  /**
   * Creates the waveform drawer
   * @private
   */
  createDrawer() {
    if (this.drawer) throw new Error('Unable to create multiple drawers');

    const container = this.shadowRoot.querySelector('.container');

    this.drawer = createDrawer({
      container,
      params: {
        barGap: 1,
        barWidth: 1,
        height: container.clientHeight,
        normalize: true,
        pixelRatio: 3,
        waveColor: 'white',
        cursorWidth: 0,
        dragSelection: false,
        // responsive: true,
      },
    });

    this.drawer.init();
  }

  /**
   * (re)-draw the waveform
   */
  drawPeaks() {
    if (this.drawPeaksAnimFrame) cancelAnimationFrame(this.drawPeaksAnimFrame);

    if (this.clientWidth === 0) return;

    if (!this.drawer) this.createDrawer();

    this.drawPeaksAnimFrame = requestAnimationFrame(() => {
      this.drawer.drawPeaks(this.peaks.data);

      setTimeout(() => {
        this.style.setProperty(
          'background-image',
          `url(${this.drawer.canvases[0].wave.toDataURL('image/jpg')})`
        );
      }, 100);
    });
  }
}

export const defineCustomElements = () => {
  defineCustomElement('soundws-waveform', WaveformElement);
};

import { html, LitElement, css } from 'lit';
import createDrawer from './lib/createDrawer.js';
import ResizeCoordinator from './lib/ResizeCoordinator.js';
import StyleUpdateBatcher from './lib/StyleUpdateBatcher.js';
import Peaks from './lib/Peaks.js';
import debounce from './lib/debounce.js';

/**
 * A simple waveform element that can render a waveform based on a data structure
 * produced (or compatible) by BBC audiowaveform json response.
 *
 * @see https://github.com/bbc/audiowaveform
 *
 * @cssprop [--fc-waveform-min-height="25px"]
 *
 * @prop {string} waveColor - The color of the waveform
 * @prop {string} progressColor - The color of the progress overlay
 * @prop {number} progress - The progress value between 0 and 1
 */
export class FcWaveform extends LitElement {
  #isUpdatingWidth = false;

  #isDrawing = false;

  #debouncedDrawPeaks;

  #adjustedPeaks = null;

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
        min-height: var(--fc-waveform-min-height, 25px);
      }
    `;
  }

  static properties = {
    src: { type: String },
    waveColor: { type: String },
    progressColor: { type: String },
    barGap: { type: Number },
    barWidth: { type: Number },
    scaleY: { type: Number },
    pixelRatio: { type: Number },
    peaks: { type: Object },
    progress: { type: Number },

    /**
     * Padding reduces the maximum waveform height to create a padding effect
     */
    padding: { type: Number },
  };

  constructor() {
    super();
    this.waveColor = 'white';
    this.progressColor = 'rgba(255, 255, 255, 0.5)';
    this.barGap = 2;
    this.barWidth = 2;
    this.pixelRatio = 2;
    this.padding = 0.1;
    this.progress = 0;

    // Debounce drawPeaks to prevent excessive redraws during rapid changes
    this.#debouncedDrawPeaks = debounce(() => this.#performDraw(), 16); // ~60fps

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
      this.onResizeCallback = ResizeCoordinator.observe(
        this.shadowRoot.firstElementChild,
        () => {
          // Use debounced version to prevent excessive redraws during resize
          this.#debouncedDrawPeaks();
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
      if (
        propName === 'scaleY' ||
        propName === 'peaks' ||
        propName === 'padding'
      ) {
        // Recalculate adjusted peaks when any dependency changes
        this.#calculateAdjustedPeaks();

        if (propName === 'peaks') {
          this.#updateWidth();
        }
        this.drawPeaks();
      }
      if (propName === 'progress') {
        this.#updateProgress();
      }
      if (
        [
          'waveColor',
          'progressColor',
          'barGap',
          'barWidth',
          'pixelRatio',
        ].indexOf(propName) !== -1
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
        progressColor: this.progressColor,
        cursorWidth: 1,
        dragSelection: false,
      },
    });

    this.drawer.init();

    // Wait for next frame to ensure drawer is mounted in DOM
    await new Promise(resolve => {
      requestAnimationFrame(resolve);
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
   * Calculates and caches the adjusted peaks based on scaleY and padding
   * @private
   */
  #calculateAdjustedPeaks() {
    if (!this.peaks) {
      this.#adjustedPeaks = null;
      return;
    }

    const { scaleY } = this;
    this.#adjustedPeaks = this.peaks.data.map(
      e => e * (scaleY !== undefined ? scaleY : 1) * (1 - this.padding),
    );
  }

  /**
   * Updates the width of the element based on peaks duration and pixels per second
   * @private
   */
  #updateWidth() {
    if (!this.peaks || this.clientWidth === 0) return;

    // Prevent resize loops
    if (this.#isUpdatingWidth) return;

    const defaultPixelsPerSecond = this.clientWidth / this.peaks.duration;
    const newWidth = `calc(var(--fc-waveform-pixels-per-second, ${defaultPixelsPerSecond}) * ${this.peaks.duration}px)`;

    // Only update if width has actually changed
    if (this.style.width !== newWidth) {
      this.#isUpdatingWidth = true;

      // Batch style update to prevent layout thrashing with multiple waveforms
      StyleUpdateBatcher.queueUpdate(this, { width: newWidth });

      // Reset flag after a short delay to allow resize to settle
      setTimeout(() => {
        this.#isUpdatingWidth = false;
      }, 50);
    }
  }

  /**
   * Updates the progress using the canvas-based progress system
   * @private
   */
  #updateProgress() {
    if (!this.drawer || this.progress === undefined) return;

    // Normalize progress to 0-1 range
    const normalizedProgress = Math.max(0, Math.min(1, this.progress));

    // Use the drawer's built-in progress method for efficient canvas rendering
    this.drawer.progress(normalizedProgress);
  }

  /**
   * (re)-draw the waveform (schedules a debounced draw)
   */
  drawPeaks() {
    if (!this.peaks) return;
    if (this.clientWidth === 0) return;

    // Schedule a debounced draw
    this.#debouncedDrawPeaks();
  }

  /**
   * Performs the actual drawing operation
   * @private
   */
  async #performDraw() {
    if (!this.peaks || this.clientWidth === 0) return;

    // Prevent concurrent draws
    if (this.#isDrawing) return;

    this.#isDrawing = true;

    try {
      // Ensure drawer is created and ready
      if (!this.drawer) {
        await this.createDrawer();
      }

      // Skip if drawer still not ready
      if (!this.drawer) {
        this.#isDrawing = false;
        return;
      }

      // Use cached adjusted peaks
      if (!this.#adjustedPeaks) {
        this.#isDrawing = false;
        return;
      }

      // Use requestAnimationFrame for optimal rendering
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          this.drawer.drawPeaks(this.#adjustedPeaks);

          // Update progress after drawing peaks
          this.#updateProgress();

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

          resolve();
        });
      });
    } finally {
      this.#isDrawing = false;
    }
  }

  get adjustedPeaks() {
    if (this.#adjustedPeaks && this.peaks) {
      return new Peaks({
        ...this.peaks,
        data: this.#adjustedPeaks,
        normalize: false,
      });
    }

    return undefined;
  }
}

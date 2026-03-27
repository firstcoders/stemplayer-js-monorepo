import { html, css, LitElement } from 'lit';
import gridStyles from './styles/grid.js';
import flexStyles from './styles/flex.js';
import bgStyles from './styles/backgrounds.js';
import utilityStyle from './styles/utilities.js';

/**
 * A component to render a single stem
 */
export class Row extends LitElement {
  static get styles() {
    return [
      gridStyles,
      flexStyles,
      bgStyles,
      utilityStyle,
      css`
        :host {
          display: block;
          position: relative;
          line-height: var(--stemplayer-js-row-height, 4.5rem);
          height: var(--stemplayer-js-row-height, 4.5rem);
          user-select: none;
        }

        .wControls {
          width: var(--stemplayer-js-row-controls-width);
        }

        .wEnd {
          min-width: var(--stemplayer-js-row-end-width);
        }

        .bgControls {
          background-color: var(
            --stemplayer-js-row-controls-background-color,
            black
          );
        }

        .bgEnd {
          background-color: var(
            --stemplayer-js-row-end-background-color,
            black
          );
        }
      `,
    ];
  }

  static get properties() {
    return {
      displayMode: { type: String },
    };
  }

  /**
   * Cached nonFlexWidth value. Updated via ResizeObserver
   * @private
   */
  #cachedNonFlexWidth = undefined;

  /**
   * ResizeObserver to track changes in non-flex column widths
   * @private
   */
  #resizeObserver = null;

  connectedCallback() {
    super.connectedCallback();

    // Set up resize observer to track when non-flex columns change width
    if (!this.#resizeObserver) {
      this.#resizeObserver = new ResizeObserver(() => {
        this.#updateNonFlexWidth();
      });
    }

    // Start observing the element
    this.#resizeObserver.observe(this);

    // Initial calculation
    setTimeout(() => {
      this.#updateNonFlexWidth();
    }, 0);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    if (this.#resizeObserver) {
      this.#resizeObserver.disconnect();
    }
  }

  render() {
    return this.displayMode === 'sm'
      ? this.#getSmallScreenTpl()
      : this.#getLargeScreenTpl();
  }

  /**
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  #getSmallScreenTpl() {
    return html`<div class="dFlex h100 overflowHidden"><slot></slot></div>`;
  }

  /**
   * @private
   */
  // eslint-disable-next-line class-methods-use-this
  #getLargeScreenTpl() {
    return html`<div class="dFlex h100">
      <div class="wControls stickLeft bgControls z999">
        <slot name="controls"></slot>
      </div>
      <div class="flex1">
        <slot name="flex"></slot>
      </div>
      <div class="wEnd stickRight bgEnd z99 dFlex">
        <slot name="end"></slot>
      </div>
    </div>`;
  }

  /**
   * Updates the cached nonFlexWidth by querying the DOM.
   * Called on resize to invalidate and recalculate.
   * @private
   */
  #updateNonFlexWidth() {
    try {
      const controlsWidth =
        this.shadowRoot.querySelector('div.wControls')?.clientWidth;
      const endWidth = this.shadowRoot.querySelector('div.wEnd')?.clientWidth;

      if (controlsWidth !== undefined && endWidth !== undefined) {
        const newWidth = controlsWidth + endWidth;

        // Only dispatch event if the width actually changed
        if (newWidth !== this.#cachedNonFlexWidth) {
          this.#cachedNonFlexWidth = newWidth;

          // Dispatch event so parent can respond to layout changes
          this.dispatchEvent(
            new CustomEvent('nonflexwidth-change', {
              detail: { nonFlexWidth: newWidth },
              bubbles: true,
              composed: true,
            }),
          );
        }
      }
    } catch (err) {
      // Silently fail if elements not yet rendered
    }
  }

  /**
   * Returns the combined width of the non fluid (flex) containers
   * Cached value that updates on resize
   */
  get nonFlexWidth() {
    return this.#cachedNonFlexWidth;
  }
}

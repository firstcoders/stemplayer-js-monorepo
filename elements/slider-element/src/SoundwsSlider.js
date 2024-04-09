import { html, css, LitElement } from 'lit';

/**
 * A range-type element
 *
 * @slot - The default slot
 * @cssprop [--soundws-slider-handle-border-right-color="rgb(1, 164, 179)"]
 */
export class SoundwsSlider extends LitElement {
  static get styles() {
    return [
      css`
        :host {
          display: block;
          height: 100%;
          flex: 1;
          text-align: center;
          position: relative;
        }

        .handle {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          border-right: 0.188rem solid
            var(--soundws-slider-handle-border-right-color, rgb(1, 164, 179));
          transition: width 0.2s ease-in-out;
          box-sizing: border-box;
          width: var(--x-handle-width, 100%);
        }

        .animate-enter .handle {
          width: 0!imporant;
        }

        .noPointerEvents {
          pointer-events: none;
        }

        .w100 {
          width: 100%;
        }

        .h100 {
          height: 100%;
        }

        .truncate {
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }

        .alignMiddle {
          display: flex;
          align-items: center;
        }
      `,
    ];
  }

  static get properties() {
    return {
      value: { type: Number },
      label: { type: Text },
      min: { type: Number },
      max: { type: Number },
      drawDelay: { type: Number },
    };
  }

  constructor() {
    super();
    this.min = 0;
    this.max = 100;
    this.value = 0;
    this.drawDelay = 500;
  }

  firstUpdated() {
    this.style.setProperty('--x-handle-width', '0%');

    setTimeout(() => {
      this.style.setProperty('--x-handle-width', `${this.value}%`);
    }, this.drawDelay);
  }

  updated(changedProperties) {
    changedProperties.forEach((oldValue, propName) => {
      // if oldValue is undefined, that means we're doing the first initialisation
      // in which case it is handled by firstUpdated (so that we can do some animation)
      if (
        propName === 'value' &&
        oldValue !== undefined &&
        this.value !== oldValue
      ) {
        this.style.setProperty('--x-handle-width', `${this.value}%`);
      }
    });
  }

  render() {
    // Not needed, since the element is only displayed on mobile
    // eslint-disable-next-line lit-a11y/click-events-have-key-events
    return html`<div
      role="slider"
      tabindex="0"
      aria-label=${this.label}
      aria-valuemax=${this.max}
      aria-valuemin=${this.min}
      aria-valuenow=${this.value}
      class="w100 h100 hoverBgAccent focusBgAccent alignMiddle"
      @click=${this.#handleClick}
    >
      <span class="w100 truncate noPointerEvents"><slot></slot></span>
      <div class="handle noPointerEvents"></div>
    </div>`;
  }

  #handleClick(e) {
    e.stopPropagation();
    this.value = Math.floor((e.offsetX / e.target.offsetWidth) * 100);
    this.dispatchEvent(new CustomEvent('change', { detail: this.value }));
  }
}

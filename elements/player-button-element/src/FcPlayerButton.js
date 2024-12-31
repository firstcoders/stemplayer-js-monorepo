import { html, css, LitElement } from 'lit';
import * as icons from './assets/icons.js';

/**
 * FcPlayerButton
 *
 * Renders a button with a player svg icon
 *
 * @customElement
 * @litElement
 * @extends LitElement
 * @cssprop [--fc-player-button-color="black"]
 * @cssprop [--fc-player-button-focus-background-color="rgb(1, 164, 179)"]
 */
export class FcPlayerButton extends LitElement {
  static get styles() {
    return [
      css`
        :host {
          display: block;
          height: 100%;
        }

        button {
          background-color: transparent;
          border: none;
          height: 100%;
          width: 100%;
          opacity: 0.8;
          overflow: hidden;
          padding: 0;
          transition: opacity 0.2s ease-in;
          white-space: nowrap;
        }

        button:focus {
          background-color: var(
            --fc-player-button-focus-background-color,
            rgb(1, 164, 179)
          );
          outline: none;
        }

        button:hover:not([disabled]) {
          opacity: 1;
        }

        button:disabled {
          opacity: 0.5;
        }

        svg {
          fill: var(--fc-player-button-color, black);
        }
      `,
    ];
  }

  static get properties() {
    return {
      type: { type: String },
      label: { type: String },
      disabled: { type: Boolean },
    };
  }

  render() {
    return html`<button
      ?disabled=${this.disabled}
      type="button"
      aria-label=${this.label || this.type}
    >
      <span aria-hidden="true">${icons[this.type]}</span>
    </button>`;
  }
}

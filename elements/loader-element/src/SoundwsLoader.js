import { html, css, LitElement } from 'lit';

/**
 * A loader element.
 *
 * @cssprop [--soundws-loader-size="2rem"]
 */
export class SoundwsLoader extends LitElement {
  static get styles() {
    return [
      css`
        .loader {
          width: var(--soundws-loader-size, 2rem);
          height: var(--soundws-loader-size, 2rem);
        }

        .loader,
        .loader:after {
          border-radius: 50%;
        }

        .loader {
          border: 0.5em solid rgba(255, 255, 255, 0.2);
          border-left: 0.5em solid #ffffff;
          animation: load8 1.1s infinite linear;
        }

        @-webkit-keyframes load8 {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes load8 {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `,
    ];
  }

  render() {
    return html`<div class="loader"></div>`;
  }
}

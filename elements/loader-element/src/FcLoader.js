import { html, css, LitElement } from 'lit';

/**
 * A loader element.
 *
 * @cssprop [--fc-loader-size="2rem"]
 */
export class FcLoader extends LitElement {
  static get styles() {
    return [
      css`
        .loader {
          width: var(--fc-loader-size, 2rem);
          height: var(--fc-loader-size, 2rem);
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
    return html`<div
      class="loader"
      role="status"
      aria-label="Loading"
      aria-live="polite"
      aria-busy="true"
    ></div>`;
  }
}

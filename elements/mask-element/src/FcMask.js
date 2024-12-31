import { html, css, LitElement } from 'lit';

/**
 * A mask that displays content
 *
 * @slot - The default slot
 * @cssprop [--fc-mask-background-color="rgba(0, 0, 0, 0.5)"]
 */
export class FcMask extends LitElement {
  static styles = css`
    :host {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: var(--fc-mask-background-color, rgba(0, 0, 0, 0.5));
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
    }
  `;

  render() {
    return html`<slot></slot>`;
  }
}

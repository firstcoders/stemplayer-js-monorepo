import { html, css, LitElement } from 'lit';

/**
 * A mask that displays content
 *
 * @slot - The default slot
 * @cssprop [--soundws-mask-background-color="rgba(0, 0, 0, 0.5)"]
 */
export class SoundwsMask extends LitElement {
  static styles = css`
    .mask {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: var(
        --soundws-mask-background-color,
        rgba(0, 0, 0, 0.5)
      );
      z-index: 99;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `;

  render() {
    return html`<div class="mask">
      <slot></slot>
    </div>`;
  }
}

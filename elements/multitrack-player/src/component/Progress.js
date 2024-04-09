import { LitElement, css, html } from 'lit';
import defineCustomElement from '../lib/define-custom-element';

export class ProgressElement extends LitElement {
  static styles = css`
    .overlay {
      position: absolute;
      height: 100%;
      top: 0;
      z-index: 99;
      background-color: cyan;
      mix-blend-mode: darken;
      width: var(--progress-left);
    }

    .cursor {
      left: var(--progress-left);
      position: absolute;
      height: 100%;
      top: 0;
      z-index: 99;
      width: 1px;
      background-color: #aaa;
    }
  `;

  static properties = {
    progress: { type: Number },
  };

  updated() {
    this.style.setProperty('--progress-left', `${Math.floor(this.progress)}px`);
  }

  render() {
    return html`<div class="overlay"></div>
      <div class="cursor"></div>`;
  }

  get width() {
    return `${Math.floor(this.progress)}px`;
  }
}

export const defineCustomElements = () => {
  defineCustomElement('soundws-progress', ProgressElement);
};

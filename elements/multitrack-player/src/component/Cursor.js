import { css, LitElement } from 'lit';
import defineCustomElement from '../lib/define-custom-element';

export class CursorElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100px;
      border-right: 1px solid red;
      z-index: 999;
      position: absolute;
      height: 100%;
      left: -1px;
      top: 0px;
      pointer-events: none;
      background-color: cyan;
      border-right: 1px solid white;
      mix-blend-mode: multiply;
      opacity: 0.5;
    }
  `;
}

export const defineCustomElements = () => {
  defineCustomElement('soundws-cursor', CursorElement);
};

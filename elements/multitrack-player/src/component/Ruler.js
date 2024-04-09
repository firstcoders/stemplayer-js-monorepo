import { html, css, LitElement } from 'lit';
import defineCustomElement from '../lib/define-custom-element';
import formatSeconds from '../lib/format-seconds';

export class RulerComponent extends LitElement {
  static styles = css`
    :host {
      display: block;
      height: 25px;

      background-color: #000000;
      background-image: linear-gradient(
          90deg,
          rgba(73, 73, 73, 0.5) 0,
          rgba(73, 73, 73, 0.5) 2%,
          transparent 2%
        ),
        linear-gradient(180deg, #000000 50%, transparent 50%),
        linear-gradient(
          90deg,
          transparent 50%,
          rgba(73, 73, 73, 0.5) 50%,
          rgba(73, 73, 73, 0.5) 52%,
          transparent 52%
        ),
        linear-gradient(180deg, #000000 70%, transparent 70%),
        linear-gradient(
          90deg,
          transparent 10%,
          rgba(255, 255, 255, 0.4) 10%,
          rgba(255, 255, 255, 0.4) 12%,
          transparent 12%,

          transparent 20%,
          rgba(255, 255, 255, 0.4) 20%,
          rgba(255, 255, 255, 0.4) 22%,
          transparent 22%,

          transparent 30%,
          rgba(255, 255, 255, 0.4) 30%,
          rgba(255, 255, 255, 0.4) 32%,
          transparent 32%,

          transparent 40%,
          rgba(255, 255, 255, 0.4) 40%,
          rgba(255, 255, 255, 0.4) 42%,
          transparent 42%,

          transparent 60%,
          rgba(255, 255, 255, 0.4) 60%,
          rgba(255, 255, 255, 0.4) 62%,
          transparent 62%,

          transparent 70%,
          rgba(255, 255, 255, 0.4) 70%,
          rgba(255, 255, 255, 0.4) 72%,
          transparent 72%,

          transparent 80%,
          rgba(255, 255, 255, 0.4) 80%,
          rgba(255, 255, 255, 0.4) 82%,
          transparent 82%,

          transparent 90%,
          rgba(255, 255, 255, 0.4) 90%,
          rgba(255, 255, 255, 0.4) 92%,
          transparent 92%
        );
      background-size: 50px 20px;
      background-repeat: repeat-x;
      min-height: 20px;

      /* only needed for labels */
      white-space: nowrap;
      font-size: 0;
      margin: 0;
      padding: 0;
    }
    label {
      font-size: 9px;
      padding-top: 2px;
      display: inline-block;
      width: var(--label-width);
      text-indent: 3px;
    }
  `;

  static properties = {
    pixelsPerSecond: { type: Number },
    labelWidth: { type: String },
  };

  constructor() {
    super();
    this.labels = Array.from(Array(100).keys());
  }

  render() {
    return html`<div style="--label-width:${this.labelWidth}">
      ${this.labels.map(
        (i) => html`<label>${formatSeconds((this.pixelsPerSecond < 100 ? 20 : 1) * i)}</label>`
      )}
    </div>`;
  }

  set pixelsPerSecond(v) {
    const oldValue = this.labelWidth;
    this._pixelsPerSecond = v;
    this.requestUpdate('labelWidth', oldValue);
  }

  get pixelsPerSecond() {
    return this._pixelsPerSecond;
  }

  get labelWidth() {
    return `${this.scale * this.pixelsPerSecond}px;`;
  }

  get scale() {
    if (this.pixelsPerSecond < 100) return 20;
    return 1;
  }
}

export const defineCustomElements = () => {
  defineCustomElement('soundws-ruler', RulerComponent);
};

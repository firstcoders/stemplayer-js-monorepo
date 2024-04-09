import { html, css, LitElement } from 'lit';

export class MixthatPlaylist extends LitElement {
  static styles = css`
    :host {
      display: block;
      background-color: var(--mixthat-playlist-background-color, #333);
      color: var(--mixthat-playlist-color, white);
    }
  `;

  constructor() {
    super();

    this.addEventListener('click', e => this.#handleClick(e));
  }

  render() {
    return html`<slot></slot>`;
  }

  #handleClick(e) {
    this.shadowRoot
      .querySelector('slot')
      .assignedNodes()
      .forEach(el => {
        if (el.tagName === 'MIXTHAT-PLAYLIST-TRACK') {
          if (el !== e.target) {
            // eslint-disable-next-line no-param-reassign
            el.isActive = false;
          } else {
            e.target.isActive = !e.target.isActive;
          }
        }
      });
  }

  // #onSlotChange(e) {
  //   e.target.assignedNodes().forEach(el => {

  //   });
  // }
}

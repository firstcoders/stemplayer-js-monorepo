import { html, LitElement, css } from 'lit';
import defineCustomElement from '../lib/define-custom-element';
import { AudioComponent } from './Audio';

export class DragDropTrack extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
        position: relative;
      }
      .container {
      }
    `;
  }

  connectedCallback() {
    super.connectedCallback();

    setTimeout(() => {
      this.addEventListener('dragover', this.onDragover);
      this.addEventListener('dragend', this.onDragend);
      this.addEventListener('dragstart', this.onDragstart);
      this.addEventListener('dragenter', this.onDragEnter);
      this.addEventListener('dragleave', this.onDragLeave);
      this.addEventListener('drop', this.onDrop);
    }, 0);
  }

  render() {
    return html`<div class="wrapper">
      <slot class="slot" @slotchange=${this.onSlotChange}></slot>
    </div>`;
  }

  onSlotChange() {
    this.children.forEach((child) => {
      // TODO remove listener on remove
      child.setAttribute('draggable', true);
      child.addEventListener('dragstart', this.onChildDragstart);
    });
  }

  onDragstart(e) {
    e.target.style.setProperty('opacity', '0.5');

    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    e.dataTransfer.setDragImage(img, 0, 0);

    // since one can only drag one item at a time, setting a unique attribute to allow retrieving
    // the element in dragover|dragenter|etc (in which dataTransfer cannot be retrieved for reasons of security)
    e.target.setAttribute('data-drag-source', 'true');

    // drag offset contains information on where in the element was clicked relative to left so that the ghost can be rendered in the correct position
    e.target.setAttribute(
      'data-drag-offset',
      e.clientX - e.target.start * e.target.pixelsPerSecond
    );
  }

  onDragover(e) {
    e.preventDefault();

    const dragOffset = this.draggedElement.getAttribute('data-drag-offset');

    const { ghostElement } = this;

    if (ghostElement)
      ghostElement.start =
        Math.floor((e.clientX - dragOffset) / ghostElement.pixelsPerSecond / 1) * 1; // last bit is unecessary but keep it in case we want to reduce the precision of the snap-to-grid effect
  }

  onDragend(e) {
    e.target.style.setProperty('opacity', '1');
    this.removeGhostElement();
    this.resetDrag();
    this.resetPointerEventsOfChildren();
  }

  onDragLeave(e) {
    e.preventDefault();

    this.children.forEach((child) => {
      child.style.removeProperty('pointer-events');
    });
  }

  onDragEnter(e) {
    e.preventDefault();

    this.resetPointerEventsOfChildren();

    const { ghostElement } = this;
    if (!ghostElement) {
      const el = this.createGhostElement(this.draggedElement);
      this.getRootNode().host.appendChild(el);
    } else {
      this.getRootNode().host.appendChild(this.ghostElement);
    }
  }

  onDrop(e) {
    e.preventDefault();

    const dragOffset = this.draggedElement.getAttribute('data-drag-offset');
    const { ghostElement, draggedElement } = this;
    const start = Math.floor((e.clientX - dragOffset) / ghostElement.pixelsPerSecond / 1) * 1; // last bit is unecessary but keep it in case we want to reduce the precision of the snap-to-grid effect

    draggedElement.start = start;

    this.getRootNode().host.appendChild(draggedElement);
  }

  createGhostElement(from) {
    const el = new AudioComponent();
    el.duration = from.duration;
    el.peaks = from.peaks;
    el.setAttribute('data-drag-ghost', true);
    el.style.setProperty('z-index', 99999);
    return el;
  }

  removeGhostElement() {
    this.ghostElement?.remove();
  }

  resetDrag() {
    const el = this.draggedElement;
    el.removeAttribute('data-drag-source');
    el.removeAttribute('data-drag-offset');
  }

  /**
   * Ensure dragging over other audio does not cause a dragleave event
   */
  resetPointerEventsOfChildren() {
    this.children.forEach((child) => {
      child.style.removeProperty('pointer-events');
    });
  }

  get draggedElement() {
    return document.querySelector('soundws-audio[data-drag-source]');
  }

  get ghostElement() {
    return document.querySelector('soundws-audio[data-drag-ghost]');
  }

  /**
   * Get the audo components
   *
   * @returns {Array}
   */
  get children() {
    const slot = this.shadowRoot?.querySelector('slot');
    return slot ? slot.assignedElements({ flatten: true }) : [];
  }
}

export const defineCustomElements = () => {
  defineCustomElement('soundws-dragdroptrack', DragDropTrack);
};

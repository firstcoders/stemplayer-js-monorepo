/**
 * Copyright (C) 2019-2023 First Coders LTD
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
/* eslint-disable no-param-reassign  */
import { LitElement, html, css } from 'lit';
import debounce from 'lodash.debounce';
import { defineCustomElements as defineStemComponent, StemComponent } from './Stem';
import { defineCustomElements as defineRulerComponent } from './Ruler';
import { defineCustomElements as defineCursorComponent } from './Cursor';
import { defineCustomElements as defineProgressComponent } from './Progress';
// import { AudioComponent } from './audio-component';
import defineCustomElement from '../lib/define-custom-element';
import Peaks from '../lib/peaks';
import onResize from '../lib/on-resize';

const responsiveBreakpoints = {
  xs: '600',
  sm: '800',
};

export class StemsListComponent extends LitElement {
  /**
   * Counter for how many stems are in a loading state
   * @private
   */
  nLoading = 0;

  constructor() {
    super();

    // default values
    this.displayMode = 'lg';

    this.pixelsPerSecond = 10;

    this.currentTime = 0;

    this.debouncedGeneratePeaks = debounce(() => this.generatePeaks(), 200);

    this.debouncedRecalculatePixelsPerSecond = debounce(
      (e) => this.recalculatePixelsPerSecond(e),
      250
    );

    this.debouncedRecalculateDisplayMode = debounce((e) => this.recalculateDisplayMode(e), 250);

    this.addEventListener('stem-loading-start', this.onStemLoadingStart);
    this.addEventListener('stem-loading-end', this.onStemLoadingEnd);
    this.addEventListener('peaks', this.onPeaks);
    this.addEventListener('solo', this.onSolo);
    this.addEventListener('unsolo', this.onUnSolo);
  }

  static get styles() {
    return css`
      :host {
        --stemlist-padding-left: 300px;
        --trackset-delta-width: 300px;

        display: block;
        max-height: var(--sws-stemsplayer-max-height);
        overflow: auto;
      }
      .pl-w-controls {
        padding-left: var(--stemlist-padding-left);
      }
      .wrapper {
        position: relative;
        overflow: hidden;
        display: block;
      }
    `;
  }

  static get properties() {
    return {
      stems: { type: Array, hasChanged: () => true },
      waveOptions: { type: Object },
      controller: { type: Object },
      duration: { type: Number, attribute: false },
      displayMode: { type: String },
      currentTime: { type: Number },
      pixelsPerSecond: { type: Number },
      ruler: { type: Boolean },
      zoom: { type: Number },
      cursorLeft: { type: Number },
      /**
       * whether to allow edit mode
       */
      editable: { type: Boolean },
    };
  }

  connectedCallback() {
    super.connectedCallback();
    this.style.setProperty('--sws-stemsplayer-max-height', `${this.getAttribute('maxHeight')}px`);

    // the total duration has changed... tell the stem controllers what it is so they can render correctly
    this.eDuration = this.controller?.on('duration', () => {
      this.style.setProperty('--duration', this.controller.duration);
      this.duration = this.controller.duration;
      this.debouncedRecalculatePixelsPerSecond();
    });

    this.eTimeupdate = this.controller.on('timeupdate', ({ t }) => {
      this.currentTime = t;
    });

    this.eSeek = this.controller.on('seek', ({ t }) => {
      this.currentTime = t;
    });

    setTimeout(() => {
      this.boundingRect = this.getBoundingClientRect();

      this.onResizeCallback = onResize(this.shadowRoot.firstElementChild, () => {
        this.boundingRect = this.getBoundingClientRect();
        this.debouncedRecalculateDisplayMode();
        this.debouncedRecalculatePixelsPerSecond();
      });

      this.addEventListener('scroll', (e) => {
        const { target } = e;

        if (this.scrollTimeout) cancelAnimationFrame(this.scrollTimeout);

        this.scrollTimeout = requestAnimationFrame(() => {
          this.style.setProperty('--sws-stemsplayer-scrollleft', `${target.scrollLeft}px`);
          this.scrollTimeout = null;
        }, 50);

        // hide cursor while scrolling
        this.cursorLeft = -1;
      });

      this.addEventListener('mousemove', this.recalculateCursorLeft);

      this.addEventListener('click', this.onClick);
    }, 100);
  }

  disconnectedCallback() {
    // remove event listeners
    this.eDuration?.un();
    this.eTimeupdate?.un();
    this.eSeek?.un();
    this.onResizeCallback?.un();
    this.onResizeCallback = null;

    super.disconnectedCallback();
  }

  render() {
    return html`<div>
      ${this.displayMode === 'lg' ? this.getLargeScreenTpl() : this.getSmallScreenTpl()}
    </div>`;
  }

  getLargeScreenTpl() {
    return html`
      <div
        class="wrapper"
        style="min-width:100%; width:calc(var(--trackset-delta-width, 0px) + var(--duration) * var(--pixels-per-second))"
      >
        ${this.ruler
          ? html`<soundws-ruler
              class="pl-w-controls"
              pixelsPerSecond=${this.pixelsPerSecond}
            ></soundws-ruler>`
          : ''}
        <soundws-cursor style="width:${`${this.cursorLeft}px`}"></soundws-cursor>
        <soundws-progress
          progress="${300 + this.pixelsPerSecond * this.currentTime}"
          style="pointer-events:none"
        ></soundws-progress
        ><slot @slotchange=${this._onSlotChange}></slot>
      </div>
    `;
  }

  getSmallScreenTpl() {
    return html`<div style="max-width:100%"><slot @slotchange=${this._onSlotChange}></slot></div>`;
  }

  // https://stackoverflow.com/questions/55172223/lit-element-how-to-efficiently-share-a-property-from-parent-to-child-custom-ele
  _onSlotChange() {
    this.requestUpdate();
  }

  updated(changedProperties) {
    // The controller is shared between stems, so when adding a stem component to the list, we need to inject the controller
    this.stemComponents?.forEach((stem) => {
      changedProperties.forEach((oldValue, propName) => {
        if (propName === 'controller') stem.controller = this.controller;
        if (propName === 'editable') stem.editable = this.editable;
        if (propName === 'zoom') this.debouncedRecalculatePixelsPerSecond();
      });
    });
  }

  get state() {
    return this.stemComponents.map((stemComponent) => ({
      id: stemComponent.id,
      src: stemComponent.src,
      waveform: stemComponent.waveform,
      volume: stemComponent.volume,
      muted: stemComponent.muted,
      solo: stemComponent.solo,
    }));
  }

  /**
   * Calculates the "combined" peaks
   *
   * @private
   */
  generatePeaks() {
    const peaks = Peaks.combine(...this.stemComponents.map((node) => node.peaks));

    this.dispatchEvent(
      new CustomEvent('peaks', {
        detail: { peaks: peaks.values, target: this },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Get the stem componenents
   *
   * @returns {Array}
   */
  get stemComponents() {
    const slot = this.shadowRoot?.querySelector('slot');
    return slot
      ? slot.assignedElements({ flatten: true }).filter((e) => e instanceof StemComponent)
      : [];
  }

  /**
   * @private
   * @param {Event} e
   */
  onStemLoadingStart(e) {
    e.stopPropagation();

    if (this.nLoading === 0)
      this.dispatchEvent(new Event('loading-start', { bubbles: true, composed: true }));

    this.nLoading += 1;
  }

  /**
   * @private
   * @param {Event} e
   */
  onStemLoadingEnd(e) {
    e.stopPropagation();

    this.nLoading -= 1;

    if (this.nLoading === 0)
      this.dispatchEvent(new Event('loading-end', { bubbles: true, composed: true }));
  }

  /**
   * Listen to peaks events emitting from the stems
   * @private
   * @param {Event} e
   */
  onPeaks(e) {
    if (e.target instanceof StemComponent) {
      e.stopPropagation();
      this.debouncedGeneratePeaks();
    }
  }

  /**
   * @private
   * @param {Event} e
   */
  onSolo(e) {
    e.stopPropagation();

    this.stemComponents?.forEach((stemComponent) => {
      if (e.detail === stemComponent) {
        stemComponent.solo = 1;
      } else {
        stemComponent.solo = -1;
      }
    });
  }

  /**
   * @private
   * @param {Event} e
   */
  onUnSolo(e) {
    e.stopPropagation();

    this.stemComponents?.forEach((stemComponent) => {
      stemComponent.solo = undefined;
    });
  }

  recalculateDisplayMode() {
    const { xs, sm } = responsiveBreakpoints;
    let size = 'lg';

    if (this.clientWidth < sm) size = 'sm';
    if (this.clientWidth < xs) size = 'xs';

    this.displayMode = size;

    this.stemComponents?.forEach((stem) => {
      stem.displayMode = size;
    });
  }

  recalculatePixelsPerSecond() {
    const oldValue = this.pixelsPerSecond;
    this.pixelsPerSecond = ((this.clientWidth - 300) / this.duration) * this.zoom;

    // store in css variable for use by nested components
    this.style.setProperty('--pixels-per-second', `${this.pixelsPerSecond}px`);

    this.requestUpdate('pixelsPerSecond', oldValue);
  }

  recalculateCursorLeft(e) {
    this.cursorLeft = e.clientX - this.boundingRect.left + this.scrollLeft;
  }

  onClick(e) {
    // when in edit mode and clicking an audio component.. do not seek so that we can select
    // if (e.target instanceof AudioComponent && this.editable) return;

    const rect = this.getBoundingClientRect();
    const nPixels = e.clientX - rect.left + this.scrollLeft;
    const currentTime = (nPixels - 300) / this.pixelsPerSecond; // 300 is padding due to controls
    if (currentTime > 0) this.controller.currentTime = currentTime;
  }
}

export const defineCustomElements = () => {
  defineCustomElement('soundws-stems-list', StemsListComponent);
  defineStemComponent();
  defineRulerComponent();
  defineProgressComponent();
  defineCursorComponent();
};

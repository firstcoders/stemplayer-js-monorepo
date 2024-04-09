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
import { AudioComponent, defineCustomElements as defineaudioComponent } from './Audio';
import { defineCustomElements as defineResponsiveVolumecomponent } from './ResponsiveVolume';
import { defineCustomElements as defineDragDropTrackcomponent } from './DragDropTrack';
import gridStyles from '../styles/grid';
import rowStyles from '../styles/row';
import flexStyles from '../styles/flex';
import spacingStyles from '../styles/spacing';
import typographyStyles from '../styles/typography';
import bgStyles from '../styles/backgrounds';
import rangeInputStyles from '../styles/range-input';
import utilitiesStyles from '../styles/utilities';
import defineCustomElement from '../lib/define-custom-element';

/**
 * A component to render a single stem
 *
 * @cssprop [--sws-stemsplayer-stem-bg-color=black]
 * @cssprop [--sws-stemsplayer-stem-color=rgb(220, 220, 220)]
 * @cssprop [--sws-stemsplayer-stem-wave-color=#AAA]
 * @cssprop [--sws-stemsplayer-stem-wave-progress-color=rgb(0, 206, 224)]
 * @cssprop [--sws-stemsplayer-stem-wave-pixel-ratio=2]
 */
export class StemComponent extends LitElement {
  static get styles() {
    return [
      gridStyles,
      rowStyles,
      flexStyles,
      spacingStyles,
      typographyStyles,
      bgStyles,
      rangeInputStyles,
      utilitiesStyles,

      // NOTE: children of this component (such as btnIcon component) use the main css var --sws-stemsplayer-color
      // in order to be able to override color on a stemcomponent level, we re-initialise this global css var (--sws-stemsplayer-color)
      // with the component level css var (--sws-stemsplayer-stem-color)
      css`
        :host {
          --sws-stemsplayer-color: var(--sws-stemsplayer-stem-color, rgb(220, 220, 220));
          --sws-stemsplayer-bg-color: var(--sws-stemsplayer-stem-bg-color, black);

          display: block;
          color: var(--sws-stemsplayer-color);
          background-color: var(--sws-stemsplayer-bg-color);
        }

        .controlPanel {
          width: var(--stemlist-padding-left);
          left: var(--sws-stemsplayer-scrollleft, 0px);
          z-index: 999;
          padding-left: 3000px;
          margin-left: -3000px;
          transition: left 0.05s ease-in-out;
          background-color: var(--sws-stemsplayer-stem-bg-color);
        }

        .audio-container {
          min-width: calc(100% - var(--stemlist-padding-left));
          margin-left: var(--stemlist-padding-left);
          background-color: var(--sws-stemsplayer-stem-track-bg-color, black);
          position: relative;
        }
      `,
    ];
  }

  static get properties() {
    return {
      label: { type: String },
      solo: { type: Boolean },
      muted: { type: Boolean },
      controller: { type: Object },
      displayMode: { type: String },
      volume: { type: Number },
      // allows padding the number of peaks - this will cause automatic padding of zeroes so that we can accurately display waveforms of stems of different lengths
      // padPeaks: { type: Number },
      duration: { type: Number },
      scrollLeft: { type: Number },

      /**
       * The text color of the component
       */
      color: { attribute: 'color' },

      /**
       * The background color of the component
       */
      backgroundColor: { attribute: 'background-color' },

      /**
       * The fill color of the waveform after the cursor.
       */
      waveColor: { attribute: 'wave-color', type: String },

      /**
       * The fill color of the part of the waveform behind the cursor. When progressColor and waveColor are the same the progress wave is not rendered at all.
       */
      waveProgressColor: { attribute: 'wave-progress-color', type: String },

      /**
       * The fill color of the part of the waveform behind the cursor. When progressColor and waveColor are the same the progress wave is not rendered at all.
       */
      wavePixelRatio: { attribute: 'wave-pixel-ratio', type: Number },

      /**
       * whether to allow edit mode
       */
      editable: { type: Boolean },
    };
  }

  constructor() {
    super();
    this._volume = 1;
    this.addEventListener('waveform-load', this.onWaveformLoad);

    // this is also handled by the player-component - but the stem element should also emit an error event
    // this.addEventListener('waveform-loading-error', ({ detail }) =>
    //   this.dispatchEvent(new ErrorEvent('error', detail))
    // );

    // this.addEventListener('stem-loading-end', () => {
    //   this.duration = this.HLS.duration;
    // });
  }

  connectedCallback() {
    super.connectedCallback();

    // default values
    this.displayMode = 'lg';

    if (this.color) this.style.setProperty('--sws-stemsplayer-stem-color', this.color);
    if (this.backgroundColor)
      this.style.setProperty('--sws-stemsplayer-stem-bg-color', this.backgroundColor);

    // EXPERIMENTAL. These properties are used by javascript when instantiating the waveform drawer. This has the possibility of being unreliable.
    // get some stuff that is not styled by css from css vars anyway (for nice theming)
    // NOTE: we add a delay to allow the browser to sort itself out.
    setTimeout(() => {
      const computedStyle = getComputedStyle(this);

      if (!this.waveColor)
        this.waveColor =
          computedStyle.getPropertyValue('--sws-stemsplayer-stem-wave-color') ||
          computedStyle.getPropertyValue('--sws-stemsplayer-wave-color') ||
          '#AAA';

      if (!this.waveProgressColor)
        this.waveProgressColor =
          computedStyle.getPropertyValue('--sws-stemsplayer-stem-wave-progress-color') ||
          computedStyle.getPropertyValue('--sws-stemsplayer-wave-progress-color') ||
          'rgb(0, 206, 224)';

      if (!this.wavePixelRatio)
        this.wavePixelRatio =
          computedStyle.getPropertyValue('--sws-stemsplayer-stem-wave-pixel-ratio') ||
          computedStyle.getPropertyValue('--sws-stemsplayer-wave-pixel-ratio') ||
          2;

      if (this.solo === true) this.handleSolo();
    }, 100);
  }

  disconnectedCallback() {
    // remove event listeners
    this.eTimeupdate?.un();
    this.eEnd?.un();
    this.eSeek?.un();

    super.disconnectedCallback();
  }

  updated(changedProperties) {
    changedProperties.forEach((oldValue, propName) => {
      this.audioComponents?.forEach((audio) => {
        if (['volume', 'muted', 'solo'].indexOf(propName) !== -1) audio.volume = this.volume;
        if (propName === 'controller') audio.controller = this.controller;
      });
    });
  }

  render() {
    return html`<div class="row">
      ${this.displayMode === 'lg' ? this.getLargeScreenTpl() : this.getSmallScreenTpl()}
    </div>`;
  }

  /**
   * @private
   */
  getSmallScreenTpl() {
    return html`<div class="dFlex flexRow showSm">
      <div class="w2 flexNoShrink">
        ${this.solo === 1
          ? html`<soundws-btn-icon
              @click=${this.handleUnSolo}
              title="Disable solo"
              icon="unsolo"
              class="bgAccent"
            ></soundws-btn-icon>`
          : html`<soundws-btn-icon
              @click=${this.handleSolo}
              title="Solo"
              icon="solo"
            ></soundws-btn-icon>`}
      </div>
      <div class="w2 flexNoShrink">
        ${this.muted || this.volume === 0
          ? html`<soundws-btn-icon
              @click=${this.handleUnmute}
              title="Unmute"
              icon="unmute"
            ></soundws-btn-icon>`
          : html`<soundws-btn-icon
              @click=${this.handleMute}
              title="Mute"
              icon="mute"
            ></soundws-btn-icon>`}
      </div>
      <soundws-responsive-volume
        .label=${this.label}
        .volume=${this.volume * 100}
        class="flex1"
        @change=${(e) => this.handleVolume(e.detail / 100)}
      ></soundws-responsive-volume>
      <!-- for calculating combined peaks which should still be emited in events -->
      <!-- <soundws-audio
        .src=${this.waveform}
        .scaleY=${this.volume}
        .audioDuration=${this.duration}
        .renderedDuration=${this.renderedDuration}
        @draw=${this.handlePeaks}
        hidden="true"
      ></soundws-audio> -->
    </div>`;
  }

  /**
   * @private
   */
  getLargeScreenTpl() {
    return html`<div class="dFlex flexRow h100">
      <div class="dFlex flexRow absolute controlPanel">
        <div class="w2 flexNoShrink">
          ${this.solo === 1
            ? html`<soundws-btn-icon
                @click=${this.handleUnSolo}
                title="Disable solo"
                icon="unsolo"
                class="bgAccent"
              ></soundws-btn-icon>`
            : html`<soundws-btn-icon
                @click=${this.handleSolo}
                title="Solo"
                icon="solo"
              ></soundws-btn-icon>`}
        </div>

        <div class="w5 hoverMenuAnchor flexNoShrink">
          <div class="p3 dFlex flexAlignStretch">
            <div class="w2 flexNoShrink">
              ${this.muted || this.volume === 0
                ? html`<soundws-btn-icon
                    @click=${this.handleUnmute}
                    title="Unmute"
                    icon="unmute"
                  ></soundws-btn-icon>`
                : html`<soundws-btn-icon
                    @click=${this.handleMute}
                    title="Mute"
                    icon="mute"
                  ></soundws-btn-icon>`}
            </div>
            <input
              class="focusBgAccent"
              @change=${(e) => this.handleVolume(e.target.value / 100)}
              type="range"
              min="0"
              max="100"
              .value=${this.volume * 100}
              step="1"
            />
          </div>
        </div>
        <div class="w6 p2 alignRight truncate noPointerEvents textCenter">
          <span class="truncate textSm">${this.label}</span>
        </div>
      </div>
      ${this.editable
        ? html`<soundws-dragdroptrack class="audio-container">
            <slot @slotchange=${this._onSlotChange}></slot>
          </soundws-dragdroptrack>`
        : html`<div class="audio-container">
            <slot @slotchange=${this._onSlotChange}></slot>
          </div>`}
    </div>`;
  }

  _onSlotChange() {
    this.requestUpdate();

    // ensure audio/waveform elements are positioned
    this.audioComponents.forEach((el) => {
      el.style.setProperty('position', 'absolute');
      el.style.setProperty('width', 'calc(var(--duration) * var(--pixels-per-second))');
      el.style.setProperty('left', `calc(var(--start) * var(--pixels-per-second))`);

      // ensure when moving audioElements to this element, the correct audio is set
      el.volume = this.volume;
      el.muted = this.muted;
    });
  }

  /**
   * @private
   */
  handleMute() {
    this.muted = true;
  }

  /**
   * @private
   */
  handleUnmute() {
    this.muted = false;
  }

  /**
   * @private
   */
  handleSolo() {
    this.dispatchEvent(new CustomEvent('solo', { detail: this, bubbles: true }));
  }

  /**
   * @private
   */
  handleUnSolo() {
    this.dispatchEvent(new CustomEvent('unsolo', { detail: this, bubbles: true }));
  }

  /**
   * @private
   */
  handlePeaks(e) {
    this.dispatchEvent(new CustomEvent('peaks', { detail: e, bubbles: true }));
  }

  /**
   * @private
   */
  handleVolume(v) {
    this.volume = v;
  }

  /**
   * Set the volume
   */
  set volume(v) {
    const oldValue = this._volume;

    this._volume = v;

    if (v > 0) {
      // When changing the volume to > 0, unmute
      this.muted = false;

      // when changing the volume on a track that is muted due to solo, un-solo-mute it
      if (this.solo === -1) this.solo = undefined;
    }

    this.requestUpdate('volume', oldValue);
  }

  /**
   * Get the current volume, while taking into consideration the values for `muted` and `solo`.
   */
  get volume() {
    if (this.muted || this.solo === -1) return 0;

    return this._volume;
  }

  /**
   * @returns {Array} - An array of peaks modified by volume
   */
  get peaks() {
    return this.audioComponent?.peaks || [];
  }

  /**
   * Get the stem componenents
   *
   * @returns {Array}
   */
  get audioComponents() {
    const slot = this.shadowRoot?.querySelector('slot');
    return slot
      ? slot.assignedElements({ flatten: true }).filter((e) => e instanceof AudioComponent)
      : [];
  }

  /**
   * The waveform data contains info regarding the duration. We can use this to adjust the start position of subsequent audio elements
   * @param {Object} e
   */
  onWaveformLoad(e) {
    const index = this.audioComponents.findIndex((el) => el === e.target);
    const next = this.audioComponents[index + 1];

    if (next && !next.start) {
      next.start = this.audioComponents[index].end;
      // next.style.setProperty('--start', next.start);
    }
  }
}

export const defineCustomElements = () => {
  defineCustomElement('soundws-stem', StemComponent);
  defineaudioComponent();
  defineResponsiveVolumecomponent();
  defineDragDropTrackcomponent();
};

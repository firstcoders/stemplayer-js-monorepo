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
import { HLS } from '@soundws/hls-web-audio';
import { WaveformElement } from './Waveform';
import defineCustomElement from '../lib/define-custom-element';

export class AudioComponent extends WaveformElement {
  static get properties() {
    return {
      ...WaveformElement.properties,
      audio: { type: String },
      waveform: { type: String },
      start: { type: Number },
      volume: { type: Number },
      controller: { type: Object },
    };
  }

  constructor() {
    super();
    this.start = 0;
  }

  /**
   * Removing should not destroy the audio as editing will often fire this. Destroy manually.
   */
  destroy() {
    WaveformElement.prototype.destroy.call(this);
    this.HLS?.destroy();
  }

  updated(changedProperties) {
    WaveformElement.prototype.updated.call(this, changedProperties);

    changedProperties.forEach((oldValue, propName) => {
      if (propName === 'start') {
        if (this.HLS) this.HLS.start = this.start;
        this.style.setProperty('--start', this.start); // determines where to render
      }
      if (propName === 'volume') if (this.HLS) this.HLS.volume = this.volume;
      if (propName === 'duration') {
        if (this.HLS) this.HLS.duration = this.duration;
      }
    });

    this.attemptToLoad();
  }

  /**
   * The loading of the actual HLS track can happen when both the src is set, and the controller.
   * So we attempt to load the HLS track when certain things happen:
   * - the src is updated
   * - the controller is updated
   * The controller is updated as soon as the stemcomponent is placed in the parent stemslist component.
   * We cannot simply do constructor injection, or set the property manual, since we also want to be able
   * to instantiate this component via html, in which case the controller needs to be retrieved from the parent.
   *
   * @private
   */
  attemptToLoad() {
    if (!this.HLS && this.controller && this.audio) {
      this.HLS = new HLS({
        controller: this.controller,
        volume: this.volume,
        start: this.start,
        duration: this.duration,
      });

      this.loadAudio();
    }
  }

  async loadAudio() {
    this.dispatchEvent(new Event('stem-loading-start', { bubbles: true, composed: true }));

    try {
      await this.HLS.load(this.audio).promise;

      this.dispatchEvent(new Event('stem-loading-end', { bubbles: true, composed: true }));
    } catch (err) {
      // dispatch error event on element (doesnt bubble)
      this.dispatchEvent(new ErrorEvent('error', err));

      // dispatch bubbling event so that the player-component can respond to it
      this.dispatchEvent(
        new CustomEvent('stem-loading-error', { detail: err, bubbles: true, composed: true })
      );
    }
  }
}

export const defineCustomElements = () => {
  defineCustomElement('soundws-audio', AudioComponent);
};

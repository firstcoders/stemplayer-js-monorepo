/* eslint-disable camelcase */
export default class Peaks {
  constructor({
    data,
    sample_rate,
    samples_per_pixel,
    length,
    duration,
    threshold = 0.1,
  }) {
    this.data = data.map(x => (x < threshold ? 0 : x));

    // if we get a structure consistent withBBC audiowaveform, deduce duration
    // otherwise use duration if provided
    if ((samples_per_pixel && samples_per_pixel, length)) {
      this.duration = (samples_per_pixel * length) / sample_rate;
    } else if (duration) {
      this.duration = duration;
    }
  }

  /**
   * Combines multiple Peaks into one
   * @param  {...any} peakss
   * @returns
   */
  static combine(...peakss) {
    const arrays = peakss.map(p => p.data);

    const n = arrays.reduce((max, xs) => Math.max(max, xs.length), 0);
    const result = Array.from({ length: n });

    const data = result.map((_, i) =>
      arrays
        .map(xs => xs[i] || 0)
        .reduce((sum, x) => {
          const f = Math.sqrt(x * x);
          const g = Math.sqrt(sum * sum);

          return f > g ? x : sum;
        }, 0),
    );

    // for the moment, we assume all peaks have the same scale, same duration, same samples per second
    // TODO implement resampling
    return new Peaks({ ...peakss[0], data });
  }

  get peaksPerSecond() {
    return this.data.length / this.duration;
  }

  /**
   * Modifies the duration, but either adding null data to the peaks, or truncating data.
   *
   * @param {Number} duration
   * @returns {Peaks} modified peaks
   */
  setDuration(duration) {
    if (this.duration < duration) {
      const nPeaksRequired = this.peaksPerSecond * duration;
      const nPeaksToAdd = nPeaksRequired - this.data.length;

      return new Peaks({
        duration,
        data: [
          ...this.data,
          ...(nPeaksToAdd > 0
            ? new Array(Math.floor(nPeaksToAdd)).fill(0)
            : []),
        ],
      });
    }

    if (this.duration > duration) {
      const peaksRequired = this.peaksPerSecond * duration;

      return new Peaks({
        duration,
        data: this.data.slice(0, peaksRequired),
      });
    }

    return this;
  }
}

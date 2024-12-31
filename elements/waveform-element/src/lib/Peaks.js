import norm from './normalize.js';

/* eslint-disable camelcase */
export default class Peaks {
  constructor({
    data,
    sample_rate,
    samples_per_pixel,
    length,
    threshold = 0.05,
    normalize = true,
  }) {
    this.data = data;
    this.sample_rate = sample_rate;
    this.samples_per_pixel = samples_per_pixel;
    this.length = length;

    if (normalize) {
      this.data = norm(this.data)
        .map(x => x * 2 - 1) // we need values between -1 and 1
        .map(e => Math.round(e * 100, 2) / 100)
        .map(x => (x < threshold ? 0 : x));
    }

    // if we get a structure consistent withBBC audiowaveform, deduce duration
    // otherwise use duration if provided
    if ((samples_per_pixel && samples_per_pixel, length)) {
      this.duration = (samples_per_pixel * length) / sample_rate;
    }
  }

  /**
   * Combines multiple Peaks into one
   * @param  {...any} peaks
   * @returns
   */
  static combine(...peaks) {
    const arrays = peaks.map(p => p.data);

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
    const combined = new Peaks({ ...peaks[0], data, normalize: false });

    return combined;
  }

  get peaksPerSecond() {
    return this.duration ? this.data.length / this.duration : undefined;
  }
}

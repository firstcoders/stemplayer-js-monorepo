import { expect } from '@open-wc/testing';
import Peaks from '../../src/lib/Peaks.js';
import peaks1Data from '../fixtures/peaks1.js';
import peaks2Data from '../fixtures/peaks2.js';

describe('Peaks', () => {
  it('deduces duration', () => {
    const peaks1 = new Peaks(peaks1Data);
    expect(peaks1.duration).to.equal(73.35);

    const peaks2 = new Peaks(peaks2Data);
    expect(peaks2.duration).to.equal(152.65);
  });

  it('deduces peaksPerSecond', () => {
    const peaks1 = new Peaks(peaks1Data);
    expect(peaks1.peaksPerSecond).to.equal(40);

    const peaks2 = new Peaks(peaks2Data);
    expect(peaks2.peaksPerSecond).to.equal(40);
  });

  // it('downsamples peaks', () => {
  //   const peaks = new Peaks(peaks1Data);
  //   expect(peaks.duration).to.equal(73.35);

  //   const downsampled = peaks.resample(peaks2Data);
  //   expect(downsampled.duration).to.equal(73.35);
  //   expect(downsampled.sample_rate).to.equal(peaks2Data.sample_rate);
  //   expect(downsampled.samples_per_pixel).to.equal(
  //     peaks2Data.samples_per_pixel
  //   );
  // });

  // it('upsamples peaks', () => {
  //   const peaks = new Peaks(peaks2Data);
  //   expect(peaks.duration).to.equal(152.65);

  //   const resampled = peaks.resample(peaks1Data);
  //   expect(resampled.duration).to.equal(152.65);
  //   expect(resampled.sample_rate).to.equal(peaks1Data.sample_rate);
  //   expect(resampled.samples_per_pixel).to.equal(peaks1Data.samples_per_pixel);
  // });

  // it('combines multiple peaks', () => {
  //   const peaks1 = new Peaks(peaks1Data);
  //   const peaks2 = new Peaks(peaks2Data);

  //   const combinedPeaks = Peaks.fromArray([peaks1, peaks2]);
  //   expect(combinedPeaks.duration).to.equal(152.65);
  // });
});

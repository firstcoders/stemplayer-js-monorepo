import SegmentLoader from './SegmentLoader.js';

export default class SegmentBuffer {
  #arrayBuffer;
  #audioBuffer;
  #loader;

  constructor(src, fetchOptions = {}) {
    this.src = src;
    this.fetchOptions = fetchOptions;
    this.fetchFailed = false;
    this.loading = false;
    this.loadHandle = null;
  }

  load() {
    if (this.fetchFailed) return { promise: Promise.reject(new Error('Fetch failed')) };
    if (this.loading && this.loadHandle) return this.loadHandle;

    this.#loader = new SegmentLoader();
    this.loading = true;

    const promise = this.#loader
      .load(this.src, this.fetchOptions)
      .then((arrayBuffer) => {
        this.#arrayBuffer = arrayBuffer;
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          this.fetchFailed = true;
        }
        throw err;
      })
      .finally(() => {
        this.loading = false;
        this.loadHandle = undefined;
        this.#loader = null;
      });

    this.loadHandle = {
      promise,
      cancel: () => this.cancel(),
    };

    return this.loadHandle;
  }

  cancel() {
    if (this.#loader) this.#loader.cancel();
    this.loadHandle = null;
  }

  getAudioBuffer(ac) {
    if (this.#audioBuffer) return Promise.resolve(this.#audioBuffer);
    if (!this.#arrayBuffer)
      return Promise.reject(new Error('Cannot connect. No audio data in buffer.'));

    // Tier 2 Cache allocation
    return ac.decodeAudioData(this.#arrayBuffer.slice(0)).then((audioBuffer) => {
      this.#audioBuffer = audioBuffer;
      return this.#audioBuffer;
    });
  }

  unload() {
    this.#audioBuffer = undefined;
    // We intentionally keep the arrayBuffer to prevent re-fetching over the network
    // if the user seeks backwards.
  }

  get isLoaded() {
    return !!this.#audioBuffer || !!this.#arrayBuffer;
  }
}

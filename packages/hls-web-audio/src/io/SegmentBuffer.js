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

  async getAudioBuffer(ac) {
    if (this.#audioBuffer) return this.#audioBuffer;
    if (!this.#arrayBuffer) throw new Error('Cannot connect. No audio data in buffer.');

    this.#audioBuffer = await ac.decodeAudioData(this.#arrayBuffer);
    this.#arrayBuffer = null;
    return this.#audioBuffer;
  }

  unload() {
    this.#audioBuffer = undefined;
    this.#arrayBuffer = undefined;
  }

  get isLoaded() {
    return !!this.#audioBuffer || !!this.#arrayBuffer;
  }
}

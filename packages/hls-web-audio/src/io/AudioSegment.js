import SegmentLoader from './SegmentLoader.js';

class AudioSegment {
  #sourceNode;
  #arrayBuffer;
  #audioBuffer;
  #loader;

  constructor({ src, duration, fetchOptions = {} }) {
    this.src = src;
    this.duration = duration;
    this.fetchOptions = fetchOptions;
  }

  destroy() {
    this.cancel();
    if (this.isReady) this.disconnect();
    this.unloadCache();
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

  async connect({ destination, ac, start, offset, stop }) {
    if (this.#sourceNode) throw new Error('Cannot connect a segment twice');

    if (!this.#audioBuffer) {
      if (!this.#arrayBuffer) throw new Error('Cannot connect. No audio data in buffer.');
      this.#audioBuffer = await ac.decodeAudioData(this.#arrayBuffer);
    }

    this.#arrayBuffer = null;
    this.duration = this.#audioBuffer.duration;

    this.#sourceNode = ac.createBufferSource();
    this.#sourceNode.buffer = this.#audioBuffer;
    this.#sourceNode.connect(destination);

    this.#sourceNode.onended = () => setTimeout(() => this.disconnect(), 0);

    this.#sourceNode.start(start, offset);
    this.#sourceNode.stop(stop);
  }

  disconnect() {
    const sourceNode = this.#sourceNode;
    if (sourceNode) {
      sourceNode.disconnect();
      sourceNode.stop();
      sourceNode.onended = () => {};
      try {
        sourceNode.buffer = null;
      } catch (ex) {
        // Ignored
      }
      this.#sourceNode = null;
    }
  }

  unloadCache() {
    this.#audioBuffer = undefined;
    this.#arrayBuffer = undefined;
  }

  get isReady() {
    return !!this.#sourceNode;
  }

  cancel() {
    if (this.#loader) this.#loader.cancel();
    this.loadHandle = null;
  }

  get end() {
    return this.start !== undefined ? this.start + this.duration : undefined;
  }

  get isLoaded() {
    return !!this.#audioBuffer || !!this.#arrayBuffer;
  }
}

export default AudioSegment;

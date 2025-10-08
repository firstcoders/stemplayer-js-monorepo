import Controller from './controller.js';
import Segment from './segment.js';
import Stack from './stack.js';
import parseM3u8 from './lib/parseM3u8.js';

class HLS {
  /**
   * Internal pointer for optimising scheduling
   * @var {Number}
   */
  #scheduleNotBefore;

  /**
   * Timeout handle for preloading next segment
   * @var {Number|null}
   */
  #preloadTimeout = null;

  /**
   * Currently scheduled segment
   * @var {Segment|null}
   */
  #currentScheduledSegment = null;

  /**
   * Timeout handle for monitoring if next segment is ready
   * @var {Number|null}
   */
  #readinessTimeout = null;

  /**
   * Preload margin in milliseconds (how much before segment end to preload next)
   * @var {Number}
   */
  #preloadMarginMs = 2000; // 2 seconds

  /**
   * @param {Object} param - The params
   * @param {Object} param.controller - The controller
   * @param {Object} param.volume - The initial volume
   * @param {Object} param.fetchOptions - Options to use when fetching the hls/m3u8
   */
  constructor({
    controller,
    volume = 1,
    fetch = null,
    fetchOptions = {},
    start = 0,
    duration = undefined,
  } = {}) {
    // optionally set or create controller
    this.controller = controller || new Controller();

    // register this hls track with the controller
    this.controller.observe(this);

    // respond to playback start to trigger initial scheduling
    this.eStart = this.controller.on('start', () => this.onStart());

    // respond to seek
    this.eSeek = this.controller.on('seek', () => this.onSeek());

    // ensure when the duration changes (e.g. because of offset + play duration), we disconnect any scheduled nodes
    // this is because the parameters of those segments may have changed (such as stop time, loop etc)
    this.ePlayDuration = this.controller.on('playDuration', () => this.#reset());

    this.eOffset = this.controller.on('offset', () => this.#reset());

    // create a gainnode for volume
    this.gainNode = this.controller.ac.createGain();

    // connect this to the destination (normally master gain node)
    this.gainNode.connect(this.controller.gainNode);

    // initialise the volume
    this.volume = volume;

    // The stack contains the stack of segments
    this.stack = new Stack({ start });

    // allows adding to headers for a request
    this.fetchOptions = fetchOptions;

    // allow injecting fetch
    this.fetch = fetch;

    // offset the start time
    this.start = start;

    // duration override
    this.duration = duration;
  }

  set start(start) {
    this.stack.start = parseFloat(start);
    this.controller?.notify('start', this);
  }

  get start() {
    return this.stack.start;
  }

  #reset() {
    this.stack.disconnectAll();
    this.#scheduleNotBefore = undefined;
    this.#clearPreloadTimeout();
    this.#clearReadinessTimeout();
    this.#currentScheduledSegment = null;

    // Immediately reschedule the current segment after reset
    this.#rescheduleCurrentSegment();
  }

  /**
   * Clear any pending preload timeout
   * @private
   */
  #clearPreloadTimeout() {
    if (this.#preloadTimeout) {
      clearTimeout(this.#preloadTimeout);
      this.#preloadTimeout = null;
    }
  }

  /**
   * Clear any pending readiness timeout
   * @private
   */
  #clearReadinessTimeout() {
    if (this.#readinessTimeout) {
      clearTimeout(this.#readinessTimeout);
      this.#readinessTimeout = null;
    }
  }

  /**
   * Reschedule the current segment after a reset
   * @private
   */
  async #rescheduleCurrentSegment() {
    const timeframe = this.controller.currentTimeframe;
    const currentSegment = this.stack.getAt(timeframe.currentTime);

    if (currentSegment && !currentSegment.isReady && !currentSegment.$inTransit) {
      // Force scheduling of the current segment
      await this.runSchedulePass(true);
    }
  }

  /**
   * Schedule preloading of the next segment
   * @param {Segment} currentSegment - The currently playing segment
   * @private
   */
  #schedulePreload(currentSegment) {
    this.#clearPreloadTimeout();
    this.#clearReadinessTimeout();

    // Calculate timing for preload and readiness check
    const { currentTime } = this.controller.currentTimeframe;
    const remainingTime = currentSegment.end - currentTime;

    // Ensure we have positive remaining time
    if (remainingTime <= 0) {
      // Try immediate preload if no time remaining
      setTimeout(() => this.#preloadNext(currentSegment), 0);
      return;
    }

    const preloadTimeMs = Math.max(0, remainingTime * 1000 - this.#preloadMarginMs);
    const readinessCheckMs = Math.max(0, remainingTime * 1000);

    // Schedule preloading
    this.#preloadTimeout = setTimeout(() => {
      // Recalculate timing when timeout fires to ensure accuracy
      const timeframe = this.controller.currentTimeframe;
      const currentRemainingTime = currentSegment.end - timeframe.currentTime;

      if (currentRemainingTime > 0) {
        this.#preloadNext(currentSegment);
      }
    }, preloadTimeMs);

    // Schedule readiness check at segment end
    this.#readinessTimeout = setTimeout(() => {
      this.#checkNextSegmentReadiness(currentSegment);
    }, readinessCheckMs);
  }

  /**
   * Preload and schedule the next segment
   * @param {Segment} currentSegment - The currently playing segment
   * @private
   */
  async #preloadNext(currentSegment) {
    // Find the node by the segment object itself (more reliable than start time lookup)
    const currentNode = this.stack.getNodeByElement(currentSegment);
    const nextSegment = currentNode?.next?.element;

    if (!nextSegment) {
      return;
    }

    if (nextSegment.isReady) {
      // Continue the preload chain even if segment is already ready
      this.#schedulePreload(nextSegment);
      return;
    }

    if (nextSegment.$inTransit) {
      return;
    }

    try {
      nextSegment.$inTransit = true;
      this.controller.notify('loading-start', this);

      if (!nextSegment.isLoaded) {
        await nextSegment.load().promise;
      }

      // Schedule the next segment to start at the right time
      const timeframe = this.controller.currentTimeframe;
      const start = timeframe.calculateRealStart(nextSegment);
      const offset = timeframe.calculateOffset(nextSegment);
      const stop = timeframe.adjustedEnd;

      await nextSegment.connect({
        ac: this.controller.ac,
        destination: this.gainNode,
        start,
        offset,
        stop,
      });

      this.#currentScheduledSegment = nextSegment;
      this.stack.recalculateStartTimes();

      // Continue the preload chain for the segment after this one
      this.#schedulePreload(nextSegment);
    } catch (err) {
      if (err.name !== 'AbortError') {
        this.controller?.notify('error', err);
      }
    } finally {
      this.stack?.ack(nextSegment);
      this.controller?.notify('loading-end', this);
    }
  }

  /**
   * Check if the next segment is ready at the end of current segment
   * If not ready, trigger buffering
   * @param {Segment} currentSegment - The segment that just ended
   * @private
   */
  #checkNextSegmentReadiness(currentSegment) {
    // Find the node by the segment object itself
    const currentNode = this.stack.getNodeByElement(currentSegment);
    const nextSegment = currentNode?.next?.element;

    if (!nextSegment) {
      return;
    }

    if (nextSegment.isReady) {
      return;
    }

    if (nextSegment.$inTransit) {
      return;
    }

    // Next segment is not ready and not loading, need to trigger buffering
    this.controller.notify('loading-start', this);

    // Try to load and schedule the next segment immediately
    this.#loadNextSegmentUrgently(nextSegment);
  }

  /**
   * Urgently load and schedule a segment when buffering is needed
   * @param {Segment} segment - The segment to load urgently
   * @private
   */
  async #loadNextSegmentUrgently(segment) {
    if (segment.$inTransit) {
      return; // Already being loaded
    }

    try {
      segment.$inTransit = true;

      if (!segment.isLoaded) {
        await segment.load().promise;
      }

      const timeframe = this.controller.currentTimeframe;
      const start = timeframe.calculateRealStart(segment);
      const offset = timeframe.calculateOffset(segment);
      const stop = timeframe.adjustedEnd;

      await segment.connect({
        ac: this.controller.ac,
        destination: this.gainNode,
        start,
        offset,
        stop,
      });

      this.#currentScheduledSegment = segment;
      this.stack.recalculateStartTimes();

      // IMPORTANT: Only continue preload chain if there's enough time remaining
      // This prevents the infinite recursion during buffering
      const remainingTime = segment.end - timeframe.currentTime;

      // Only if more than 1 second remaining
      if (remainingTime > 1) {
        this.#schedulePreload(segment);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        this.controller?.notify('error', err);
      }
    } finally {
      this.stack?.ack(segment);
      this.controller?.notify('loading-end', this);
    }
  }

  destroy() {
    // cancel loading
    this.cancel();

    // clear any pending timeouts
    this.#clearPreloadTimeout();
    this.#clearReadinessTimeout();

    // unregister from the controller
    this.controller.unobserve(this);
    this.controller = null;

    // remove event listeners
    this.eStart.un();
    this.eOffset.un();
    this.ePlayDuration.un();
    this.eSeek.un();

    // destroy the stack
    this.stack.destroy();
    this.stack = null;
  }

  /**
   * Loads the source m3u8 file
   *
   * @param {String} src
   * @returns Object
   */
  load(src) {
    this.src = src;

    const abortController = new AbortController();

    const promise = new Promise((resolve, reject) => {
      (this.fetch || fetch)(src, {
        signal: abortController.signal,
        ...this.fetchOptions,
        headers: {
          Accept: 'application/x-mpegURL, application/vnd.apple.mpegurl',
          ...this.fetchOptions?.headers,
        },
      })
        .then((r) => {
          if (!r.ok) {
            const error = new Error('HLS Fetch failed');
            error.name = 'HLSLoadError';
            error.response = r;
            throw error;
          }
          return r;
        })
        .then((r) => r.text())
        .then((r) => parseM3u8(r, src))
        .then((r) => {
          this.buildSegments(r);
          this.controller?.notify('init', this);
          resolve(r);
        })
        .catch((error) => {
          // dont consider AbortError an error (todo, reconsider?)
          if (error.name === 'AbortError') {
            resolve();
          }

          this.controller?.notify('error', error);
          reject(error);
        });
    });

    this.loadHandle = {
      promise,
      cancel: () => abortController.abort(),
    };

    return this.loadHandle;
  }

  /**
   * Populates the hls track from a text m3u8 manifest
   * @param {String} manifest - The m3u8 manifest
   * @param {String} src - The m3u8 location
   */
  loadFromM3u8(manifest, src) {
    const sources = parseM3u8(manifest, src);
    this.buildSegments(sources);
  }

  /**
   * @private
   * @param {Array} sources - An array containing the segment data
   */
  buildSegments(sources) {
    this.stack?.push(
      ...sources.map((source) => new Segment({ ...source, fetchOptions: this.fetchOptions })),
    );
  }

  set duration(duration) {
    this.stack.duration = duration;
    this.controller?.notify('duration', this);
  }

  /**
   * Gets the playback duration
   *
   * @returns Int
   */
  get duration() {
    return this.stack.duration;
  }

  /**
   * Gets the playback duration
   *
   * @returns Int
   */
  get totalDuration() {
    return this.stack.totalDuration;
  }

  /**
   * Gets end time of the sample
   *
   * @returns Int
   */
  get end() {
    return this.stack.duration + this.stack.start;
  }

  /**
   * Handles a controller's "start" event - triggers initial scheduling when playback begins
   *
   * @private
   */
  onStart() {
    this.runSchedulePass(true);
  }

  /**
   * Handles a controller's "seek" event
   *
   * @private
   */
  async onSeek() {
    // Clear any pending preload timeouts
    this.#clearPreloadTimeout();
    this.#clearReadinessTimeout();

    // first disconnect everything
    this.stack.disconnectAll();

    // then run a schedule pass in order to immediately schedule the newly required segments
    this.runSchedulePass(true);
  }

  /**
   * Schedules segments when needed - only called for:
   * - Initial setup when playback starts (onStart)
   * - Seeking (onSeek)
   * - Parameter changes (offset/playDuration via #reset)
   * The timeout-based preloading system handles ongoing scheduling automatically
   */
  async runSchedulePass(force) {
    const timeframe = this.controller.currentTimeframe;

    if (force) this.#scheduleNotBefore = undefined;

    // If we have a scheduled segment and timeouts are managing preloading,
    // only schedule if we don't have a current segment or if forced
    const currentSegment = this.stack.getAt(timeframe.currentTime);

    if (!force && currentSegment && currentSegment === this.#currentScheduledSegment) {
      return; // Let timeout-based preloading handle it
    }

    if (timeframe.currentTime < this.#scheduleNotBefore) {
      return;
    }

    // schedule segments that are needed now
    await this.scheduleAt(timeframe);
  }

  async scheduleAt(timeframe) {
    const { gainNode: destination, controller } = this;

    // get the next segment
    const segment = this.stack.consume(timeframe);

    // if we dont get one, there's nothing to do at this time
    if (!segment) return;

    try {
      // notify to the controller that loading has started
      this.controller.notify('loading-start', this);

      // load the segment
      if (!segment.isLoaded) await segment.load().promise;

      const start = timeframe.calculateRealStart(segment);
      const offset = timeframe.calculateOffset(segment);
      const stop = timeframe.adjustedEnd;

      // connect it to the audio
      // @todo reverse api to controller.connect(segment) or this.connect(segment)
      await segment.connect({ ac: controller.ac, destination, start, offset, stop });

      // keep a pointer so we know we dont need to run schedule again prior to a certain currentTime
      this.#scheduleNotBefore = segment.end - segment.duration / 2;

      this.stack?.recalculateStartTimes();

      // Schedule preload for the next segment using timeout-based system
      this.#schedulePreload(segment);
      this.#currentScheduledSegment = segment;
    } catch (err) {
      if (err.name !== 'AbortError') {
        this.controller?.notify('error', err);
      }
    } finally {
      // release the segment
      this.stack?.ack(segment);

      // notify to the controller that this segment is ready
      this.controller?.notify('loading-end', this);
    }
  }

  get volume() {
    return this.gainNode.gain.value;
  }

  /**
   * @param {Int} volume - The volume
   */
  set volume(volume) {
    this.gainNode.gain.value = volume;
  }

  /**
   * Cancel the loading of the hls playlist
   */
  cancel() {
    if (this.loadHandle) this.loadHandle.cancel();
  }

  /**
   * Whether the track can play the current semgent based on currentTime
   */
  get canPlay() {
    const current = this.stack.getAt(this.controller.currentTime);
    return current?.isReady;
  }

  /**
   * Whether the track should and can play (depends on whether there is a current segment)
   */
  get shouldAndCanPlay() {
    const current = this.stack.getAt(this.controller.currentTime);
    return !current || current?.isReady;
  }

  /**
   * Set the preload margin in milliseconds
   * @param {number} marginMs - Milliseconds before segment end to preload next
   */
  set preloadMargin(marginMs) {
    this.#preloadMarginMs = marginMs;
  }

  /**
   * Get the preload margin in milliseconds
   * @returns {number}
   */
  get preloadMargin() {
    return this.#preloadMarginMs;
  }
}

export default HLS;

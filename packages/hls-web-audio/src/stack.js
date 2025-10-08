import StackNode from './StackNode.js';

export default class {
  /**
   * @property {StackNode|null} head - The first node in the linked list
   * @private
   */
  #head = null;

  /**
   * @property {StackNode|null} tail - The last node in the linked list
   * @private
   */
  #tail = null;

  /**
   * @property {Number} length - The number of elements in the stack
   * @private
   */
  #length = 0;

  /**
   * @property {Number} startPointer - an internal pointer pointing to where the start of the next element is
   */
  startPointer;

  /**
   * @property {Number} initialStartTime - the initial start time, if not 0
   */
  initialStartTime;

  /**
   * @property {Number} nextMarginSeconds - a margin, in seconds, that controls a rolling window that checks whether a segment is nearly next
   */
  nextMarginSeconds;

  /**
   * @property {Number|undefined} - a duration set externally rather than derived from loaded audio
   */
  #duration;

  constructor({ start = 0, nextMarginSeconds = 5 } = {}) {
    this.initialStartTime = start;
    this.startPointer = start;
    this.nextMarginSeconds = nextMarginSeconds;
  }

  /**
   * Destructor
   */
  destroy() {
    // destroy all elements
    let current = this.#head;
    while (current) {
      current.element.destroy();
      current = current.next;
    }

    // clear references
    this.#head = null;
    this.#tail = null;
    this.#length = 0;
  }

  /**
   * Add elements to the stack
   *
   * @param  {...any} element
   */
  push(...element) {
    element.forEach((s) => {
      // initialise start time of element
      s.start = this.startPointer;

      // create new node
      const node = new StackNode(s);

      // add to linked list
      if (!this.#head) {
        this.#head = node;
        this.#tail = node;
      } else {
        this.#tail.next = node;
        node.prev = this.#tail;
        this.#tail = node;
      }

      this.#length += 1;

      // increment start pointer
      this.startPointer += s.duration;
    });
  }

  /**
   * Get the node at a given time
   * @param {Number} t - the time
   * @returns {StackNode|null}
   * @private
   */
  #getNodeAt(t) {
    let current = this.#head;
    while (current) {
      const { element } = current;
      if (t >= element.start && t <= element.end) {
        return current;
      }
      current = current.next;
    }
    return null;
  }

  /**
   * Try to get the next element that is not ready
   * @returns {Object|undefined}
   */
  consume(timeframe) {
    const currentNode = this.#getNodeAt(timeframe.currentTime);
    const current = currentNode?.element;
    const next = currentNode?.next?.element;

    const getNextElement = () => {
      if (current && !current.$inTransit && !current.isReady) {
        return current;
      }

      // do not schedule next unless current is ready
      if (!current?.isReady) return undefined;

      // ensure the next is in the play window (<timeframe.end)
      if (next && next.start < timeframe.end && !next.$inTransit && !next.isReady) {
        return next;
      }

      return undefined;
    };

    const element = getNextElement();

    if (element) {
      // store a signpost that we're currently $inTransit the element
      // so that it wont be loaded again by the next timeupdate event, while it is still being prepared
      element.$inTransit = true;
    }

    return element;
  }

  /**
   * Ack an element, freeing it up for future consumption
   *
   * @param {Object} element
   */
  ack(element) {
    element.$inTransit = false;
  }

  /**
   * The default duration as defined by the audio segments
   */
  get audioDuration() {
    return this.startPointer;
  }

  /**
   * Get the total duration
   *
   * @returns {Number|undefined}
   */
  get duration() {
    return this.#duration || this.audioDuration;
  }

  /**
   * Manually set the duration
   *
   * @param {Number} duration - the duration
   */
  set duration(duration) {
    this.#duration = duration;
  }

  /**
   * @returns {Object} The first element
   */
  get first() {
    return this.#head?.element;
  }

  /**
   * Handles a controller's "seek" event
   */
  disconnectAll() {
    // disconnect all elements. A new set will need to be resheduled
    let current = this.#head;
    while (current) {
      const { element } = current;
      // cancel any loading in progress
      element.cancel();

      // disconnect any connected audio nodes
      if (element.isReady) element.disconnect();

      // ensure element is again available for consumption
      this.ack(element);

      current = current.next;
    }
  }

  /**
   * Get the length of the stack
   */
  get length() {
    return this.#length;
  }

  /**
   * Get the index of the current element
   * @param {Number} t - the time
   * @returns
   */
  getIndexAt(t) {
    let current = this.#head;
    let index = 0;
    while (current) {
      const { element } = current;
      if (t >= element.start && t <= element.end) {
        return index;
      }
      current = current.next;
      index += 1;
    }
    return -1;
  }

  /**
   * Get the current element
   * @param {Number} t - the time
   * @returns
   */
  getAt(t) {
    return this.#getNodeAt(t)?.element;
  }

  /**
   * Get the node at a given time (public version for internal use)
   * @param {Number} t - the time
   * @returns {StackNode|null}
   */
  getNodeAt(t) {
    return this.#getNodeAt(t);
  }

  /**
   * Find a node by the segment object itself
   * @param {Segment} segment - the segment to find
   * @returns {StackNode|null}
   */
  getNodeByElement(segment) {
    let current = this.#head;
    while (current) {
      if (current.element === segment) {
        return current;
      }
      current = current.next;
    }
    return null;
  }

  /**
   * Recalculates the start times, taking into account any later adjustments from learning the real durations
   * of a segment after decoding the audio data.
   */
  recalculateStartTimes() {
    this.startPointer = this.initialStartTime;

    let current = this.#head;
    let prevElement = null;

    while (current) {
      const { element } = current;
      const start = prevElement?.end || this.startPointer;

      // initialise start time of element
      element.start = start;

      // increment start pointer
      this.startPointer += element.duration;

      prevElement = element;
      current = current.next;
    }
  }

  /**
   * @deprecated
   */
  set start(start) {
    this.initialStartTime = start;
    this.disconnectAll();
    this.recalculateStartTimes();
  }

  get start() {
    return this.initialStartTime;
  }

  set offset(offset) {
    this._offset = offset;
    this.disconnectAll();
    this.recalculateStartTimes();
  }

  get offset() {
    return this._offset;
  }
}

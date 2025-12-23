/**
 * Coordinates resize observations across multiple elements,
 * staggering callbacks to prevent performance spikes when many
 * elements resize simultaneously.
 */
class ResizeCoordinator {
  constructor() {
    this.observers = new Map(); // element -> { callback, observer }
    this.pendingCallbacks = new Set();
    this.isProcessing = false;
    this.batchSize = 3; // Process N callbacks per idle period
  }

  /**
   * Register an element and callback for coordinated resize observation
   * @param {Element} element - The element to observe
   * @param {Function} callback - The callback to invoke on resize
   * @returns {Object} - Object with un() method to unregister
   */
  observe(element, callback) {
    if (!element || !callback) {
      throw new Error('Element and callback are required');
    }

    // Use requestIdleCallback with fallback to requestAnimationFrame
    const scheduleCallback = () => {
      this.pendingCallbacks.add(callback);
      this.processPending();
    };

    const observer = new ResizeObserver(() => {
      scheduleCallback();
    });

    observer.observe(element);

    this.observers.set(element, { callback, observer });

    return {
      un: () => this.unobserve(element),
    };
  }

  /**
   * Unregister an element from resize observation
   * @param {Element} element - The element to stop observing
   */
  unobserve(element) {
    const entry = this.observers.get(element);
    if (entry) {
      entry.observer.disconnect();
      this.observers.delete(element);
      this.pendingCallbacks.delete(entry.callback);
    }
  }

  /**
   * Process pending callbacks in batches during idle time
   * @private
   */
  processPending() {
    if (this.isProcessing || this.pendingCallbacks.size === 0) {
      return;
    }

    this.isProcessing = true;

    const processBatch = () => {
      const callbacks = Array.from(this.pendingCallbacks).slice(
        0,
        this.batchSize,
      );

      callbacks.forEach(callback => {
        try {
          callback();
        } catch (err) {
          // Silently ignore errors
        }
        this.pendingCallbacks.delete(callback);
      });

      // If more callbacks remain, schedule next batch
      if (this.pendingCallbacks.size > 0) {
        this.scheduleNextBatch();
      } else {
        this.isProcessing = false;
      }
    };

    // Use requestIdleCallback if available, otherwise requestAnimationFrame
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(
        deadline => {
          // Process as many as we can within the time budget
          while (
            this.pendingCallbacks.size > 0 &&
            deadline.timeRemaining() > 0
          ) {
            const callback = this.pendingCallbacks.values().next().value;
            try {
              callback();
            } catch (err) {
              // Silently ignore errors
            }
            this.pendingCallbacks.delete(callback);
          }

          // If more work remains, schedule another batch
          if (this.pendingCallbacks.size > 0) {
            this.scheduleNextBatch();
          } else {
            this.isProcessing = false;
          }
        },
        { timeout: 100 }, // Ensure it runs even if never idle
      );
    } else {
      // Fallback to requestAnimationFrame
      requestAnimationFrame(() => {
        processBatch();
      });
    }
  }

  /**
   * Schedule the next batch of callbacks
   * @private
   */
  scheduleNextBatch() {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(
        deadline => {
          while (
            this.pendingCallbacks.size > 0 &&
            deadline.timeRemaining() > 0
          ) {
            const callback = this.pendingCallbacks.values().next().value;
            try {
              callback();
            } catch (err) {
              // Silently ignore errors
            }
            this.pendingCallbacks.delete(callback);
          }

          if (this.pendingCallbacks.size > 0) {
            this.scheduleNextBatch();
          } else {
            this.isProcessing = false;
          }
        },
        { timeout: 100 },
      );
    } else {
      requestAnimationFrame(() => {
        const callbacks = Array.from(this.pendingCallbacks).slice(
          0,
          this.batchSize,
        );
        callbacks.forEach(callback => {
          try {
            callback();
          } catch (err) {
            // Silently ignore errors
          }
          this.pendingCallbacks.delete(callback);
        });

        if (this.pendingCallbacks.size > 0) {
          this.scheduleNextBatch();
        } else {
          this.isProcessing = false;
        }
      });
    }
  }

  /**
   * Disconnect all observers
   */
  disconnectAll() {
    this.observers.forEach(({ observer }) => observer.disconnect());
    this.observers.clear();
    this.pendingCallbacks.clear();
    this.isProcessing = false;
  }
}

// Export a singleton instance
export default new ResizeCoordinator();

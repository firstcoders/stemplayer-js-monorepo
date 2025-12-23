/**
 * Batches style updates across multiple elements to prevent layout thrashing.
 * All queued style updates are applied in a single requestAnimationFrame.
 */
class StyleUpdateBatcher {
  constructor() {
    this.pendingUpdates = new Map(); // element -> { styles }
    this.rafId = null;
  }

  /**
   * Queue a style update for an element
   * @param {HTMLElement} element - The element to update
   * @param {Object} styles - Object containing CSS properties and values
   */
  queueUpdate(element, styles) {
    if (!element || !styles) {
      return;
    }

    // Merge with any existing pending updates for this element
    const existing = this.pendingUpdates.get(element) || {};
    this.pendingUpdates.set(element, { ...existing, ...styles });

    // Schedule flush if not already scheduled
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => this.flush());
    }
  }

  /**
   * Apply all pending style updates in a single frame
   * @private
   */
  flush() {
    this.pendingUpdates.forEach((styles, element) => {
      const { style } = element;
      Object.keys(styles).forEach(property => {
        style[property] = styles[property];
      });
    });

    this.pendingUpdates.clear();
    this.rafId = null;
  }

  /**
   * Cancel all pending updates
   */
  cancel() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pendingUpdates.clear();
  }
}

// Export a singleton instance
export default new StyleUpdateBatcher();

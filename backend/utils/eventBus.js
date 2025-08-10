import EventEmitter from "events";

class HotelEventBus extends EventEmitter {
  constructor() {
    super();
    // Allow many listeners without warnings
    this.setMaxListeners(50);

    // Global error listener
    this.on("error", (err) => {
      console.error("❌ Unhandled EventBus error:", err);
    });
  }

  /**
   * Emit an event with error handling (sync + async safe)
   * @param {string} eventName - Name of the event
   * @param {...any} args - Arguments for the event
   */
  async safeEmit(eventName, ...args) {
    try {
      // Get all listeners for this event
      const listeners = this.listeners(eventName);
      for (const listener of listeners) {
        try {
          // Await in case listener returns a Promise
          await listener(...args);
        } catch (err) {
          console.error(`❌ Error in listener for ${eventName}:`, err);
        }
      }
    } catch (error) {
      console.error(`❌ Error emitting event "${eventName}":`, error);
    }
  }

  /**
   * Safe listener registration that catches both sync & async errors
   * @param {string} eventName
   * @param {Function} listener
   */
  safeOn(eventName, listener) {
    this.on(eventName, async (...args) => {
      try {
        await listener(...args);
      } catch (err) {
        console.error(`❌ Error in listener for ${eventName}:`, err);
      }
    });
  }
}

// Singleton instance
const eventBus = new HotelEventBus();
export default eventBus;

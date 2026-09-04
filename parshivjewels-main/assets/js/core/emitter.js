/* Minimal pub/sub. Keeps services decoupled from the components that
   render them — services publish, components subscribe. */

export function createEmitter() {
  const listeners = new Map();

  return {
    on(event, handler) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(handler);
      return () => listeners.get(event)?.delete(handler);
    },
    off(event, handler) {
      listeners.get(event)?.delete(handler);
    },
    emit(event, payload) {
      listeners.get(event)?.forEach((handler) => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`[emitter] "${event}" listener failed`, error);
        }
      });
    },
  };
}

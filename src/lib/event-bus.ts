import { EventEmitter } from "events";

// Phase 0: Simple in-process event emitter
// Phase 2+: Migrate to Redis Pub/Sub or Inngest
class DaftarEventBus extends EventEmitter {
  emitEvent(event: string, payload: Record<string, unknown>) {
    this.emit(event, { ...payload, timestamp: new Date().toISOString() });
  }
}

const globalForEvents = globalThis as unknown as {
  daftarEvents: DaftarEventBus | undefined;
};

export const daftarEvents =
  globalForEvents.daftarEvents ?? new DaftarEventBus();

if (process.env.NODE_ENV !== "production") {
  globalForEvents.daftarEvents = daftarEvents;
}

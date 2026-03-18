import { auth } from "@/lib/auth";
import { daftarEvents } from "@/lib/event-bus";

// ─── SSE Connection Registry ────────────────────────────
// Maps userId → Set of writable stream controllers.
// When a notification is created for a user, we push it
// to every active SSE connection that user has open.
//
// Phase 0 (current): In-process EventBus listener.
//   Works for single-server deployments. Each server process
//   holds its own connection map and listens on daftarEvents.
//
// Phase 2+ migration path:
//   Replace daftarEvents listener with Redis Pub/Sub:
//     const redis = new Redis(process.env.REDIS_URL);
//     redis.subscribe("notifications");
//     redis.on("message", (_channel, raw) => {
//       const { userId, notification } = JSON.parse(raw);
//       pushToUser(userId, notification);
//     });
//   This lets multiple server instances each receive every
//   notification event and push to their own connected clients.

type StreamController = ReadableStreamDefaultController<Uint8Array>;

const connections = new Map<string, Set<StreamController>>();

function addConnection(userId: string, controller: StreamController) {
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  connections.get(userId)!.add(controller);
}

function removeConnection(userId: string, controller: StreamController) {
  const userConns = connections.get(userId);
  if (userConns) {
    userConns.delete(controller);
    if (userConns.size === 0) connections.delete(userId);
  }
}

function pushToUser(userId: string, data: Record<string, unknown>) {
  const userConns = connections.get(userId);
  if (!userConns) return;
  const encoded = new TextEncoder().encode(
    `data: ${JSON.stringify(data)}\n\n`
  );
  for (const controller of userConns) {
    try {
      controller.enqueue(encoded);
    } catch {
      // Client disconnected — clean up handled by cancel()
      userConns.delete(controller);
    }
  }
}

// ─── EventBus Listener ──────────────────────────────────
// Listens for notification.created events emitted by
// src/lib/notifications.ts → createNotification().
// The payload contains { notificationId, userId, type }.
//
// In Phase 2+ this would instead be a Redis subscriber:
//   redis.on("message", (_ch, raw) => { ... });

let listenerRegistered = false;

function ensureEventListener() {
  if (listenerRegistered) return;
  listenerRegistered = true;

  daftarEvents.on(
    "notification.created",
    (payload: { notificationId: string; userId: string; type: string; timestamp: string }) => {
      pushToUser(payload.userId, {
        event: "notification",
        notificationId: payload.notificationId,
        type: payload.type,
        timestamp: payload.timestamp,
      });
    }
  );

  // GI background task completions
  // Emitted by gi-engine.ts when async generation finishes
  daftarEvents.on(
    "gi.task.completed",
    (payload: { userId: string; taskType: string; result: string; timestamp: string }) => {
      pushToUser(payload.userId, {
        event: "gi_complete",
        taskType: payload.taskType,
        result: payload.result,
        timestamp: payload.timestamp,
      });
    }
  );
}

// ─── SSE Route Handler ──────────────────────────────────
// GET /api/notifications/stream
// Opens a text/event-stream connection for the authenticated user.
// Sends a heartbeat every 30s to keep the connection alive and
// detect dropped clients behind proxies/load balancers.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  ensureEventListener();

  const encoder = new TextEncoder();
  let heartbeatTimer: ReturnType<typeof setInterval>;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      addConnection(userId, controller);

      // Send initial connection confirmation
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ event: "connected", userId })}\n\n`
        )
      );

      // Heartbeat every 30s — keeps connection alive through
      // proxies and lets the client detect stale connections.
      heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeatTimer);
        }
      }, 30_000);
    },
    cancel() {
      // Client disconnected (browser tab closed, navigation, etc.)
      clearInterval(heartbeatTimer);
      // We can't reference the controller here directly, but the
      // pushToUser function handles dead controllers gracefully.
      // The connection map is cleaned up on the next push attempt.
      const userConns = connections.get(userId);
      if (userConns) {
        // Remove all controllers that are now closed
        for (const ctrl of userConns) {
          try {
            ctrl.enqueue(new Uint8Array(0));
          } catch {
            userConns.delete(ctrl);
          }
        }
        if (userConns.size === 0) connections.delete(userId);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable Nginx buffering
    },
  });
  } catch (err) {
    console.error("[Notifications Stream] Error:", err);
    return new Response(
      JSON.stringify({ error: "An internal error occurred" }),
      { status: 500 },
    );
  }
}

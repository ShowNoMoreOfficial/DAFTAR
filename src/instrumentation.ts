/**
 * Next.js Instrumentation — runs once on server startup.
 * Registers GI event listeners on the event bus so the GI
 * can reactively load skills when organizational events occur.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerGIEventListeners } = await import(
      "@/lib/gi-skill-engine"
    );
    registerGIEventListeners();

    const { registerCultureMonitor } = await import(
      "@/lib/hoccr/culture-monitor"
    );
    registerCultureMonitor();
  }
}

/**
 * Remotion Entry Point
 *
 * Used by `npx remotion render` and the Remotion Studio.
 * This file registers all compositions via the Root component.
 *
 * Usage:
 *   npx remotion studio src/lib/remotion/index.ts
 *   npx remotion render src/lib/remotion/index.ts DataCard --props='{"title":"GDP","value":"$3.5T","subtitle":"2025","color":"#00d4aa"}'
 */
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);

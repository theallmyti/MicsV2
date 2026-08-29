import { ConvexProvider, ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL || "https://notable-elephant-81.convex.cloud";

let convex = null;

if (convexUrl) {
  convex = new ConvexReactClient(convexUrl);
}

export { convex };

export function createConvexClient() {
  if (!convexUrl) return null;
  return new ConvexReactClient(convexUrl);
}

export const convexConfigured = Boolean(convexUrl);

// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

// Strip `data-tsd-source` props from every source file. R3F's applyProps walks
// dashed prop keys as nested paths (data.tsd.source) and throws on Three objects
// that don't have a `.data` object. Runs AFTER the tagger, in dev AND build.
function stripR3FSourceTags(): Plugin {
  return {
    name: "hydrogem:strip-r3f-source-tags",
    enforce: "post",
    transform(code, id) {
      if (!/\/src\/.*\.[jt]sx?$/.test(id)) return null;
      if (!code.includes("data-tsd-source")) return null;
      return {
        code: code
          // Before React transform: <mesh data-tsd-source="..." />
          .replace(/\s*data-tsd-source="[^"]*"/g, "")
          // After React/devtools transform: { "data-tsd-source": "...", children: ... }
          .replace(/\s*"data-tsd-source":\s*"[^"]*",?/g, "")
          // Single-quoted / minified variants
          .replace(/\s*'data-tsd-source':\s*'[^']*',?/g, ""),
        map: null,
      };
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [stripR3FSourceTags()],
  },
});

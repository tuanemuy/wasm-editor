import type { ServerResponse } from "node:http";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import type { Connect, ViteDevServer } from "vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const crossOriginIsolationPlugin = () => {
  return {
    name: "cross-origin-isolation",
    configureServer: (server: ViteDevServer) => {
      server.middlewares.use(
        (
          _req: Connect.IncomingMessage,
          res: ServerResponse,
          next: Connect.NextFunction,
        ) => {
          res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
          res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
          next();
        },
      );
    },
  };
};

export default defineConfig({
  plugins: [
    crossOriginIsolationPlugin(),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
  server: {
    host: true,
    allowedHosts: ["dev2.suiro.ink"],
    port: 53002,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});

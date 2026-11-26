import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type ProxyOptions } from "vite";

function buildApiProxy(
  rawBaseUrl: string | undefined,
): Record<string, ProxyOptions> | undefined {
  const trimmed = rawBaseUrl?.trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) {
    return undefined;
  }

  try {
    const parsed = new URL(trimmed.replace(/\/+$/, ""));
    const basePath = parsed.pathname.replace(/\/+$/, "");

    return {
      "/api": {
        target: parsed.origin,
        changeOrigin: true,
        secure: true,
        rewrite: (reqPath) => `${basePath}${reqPath.replace(/^\/api/, "")}`,
      },
    };
  } catch {
    return undefined;
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const loadedEnv = loadEnv(mode, process.cwd(), "");
  const proxy = buildApiProxy(loadedEnv.SETTLE_AFRICA_BASE_URL);

  return {
    plugins: [tailwindcss(), react()],
    envPrefix: ["VITE_", "SETTLE_AFRICA_"],
    server: {
      port: 3000,
      ...(proxy ? { proxy } : {}),
    },
    preview: {
      port: 3000,
    },
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
  };
});

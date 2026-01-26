export type RuntimeEnv = {
  VITE_API_BASE?: string;
  VITE_GOOGLE_CLIENT_ID?: string;
  VITE_APP_VERSION?: string;
};

function readWindowEnv(): RuntimeEnv {
  if (typeof window === "undefined") return {};
  return (window.__ENV ?? {}) as RuntimeEnv;
}

/**
 * Runtime-first env reader.
 * - In nginx container: values come from public/env.js generated at startup (window.__ENV).
 * - In dev/build: falls back to Vite build-time env (import.meta.env).
 */
export function getRuntimeEnv(): RuntimeEnv {
  const win = readWindowEnv();
  return {
    VITE_API_BASE: win.VITE_API_BASE ?? import.meta.env.VITE_API_BASE,
    VITE_GOOGLE_CLIENT_ID:
      win.VITE_GOOGLE_CLIENT_ID ?? import.meta.env.VITE_GOOGLE_CLIENT_ID,
    VITE_APP_VERSION: win.VITE_APP_VERSION ?? import.meta.env.VITE_APP_VERSION,
  };
}

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    base: "/",
    plugins: [
      react(),
      svgr({
        svgrOptions: {
          exportType: "default",
        },
      }),
    ],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    server: {
      host: "0.0.0.0", // 监听所有网卡
      port: 8080,
      proxy: {
        "/oss-proxy": {
          target: "http://aoss.cn-sh-01b.sensecoreapi-oss.cn",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/oss-proxy/, ""),
        },
      },
    },
    optimizeDeps: {
      // exclude: ["@ffmpeg/ffmpeg"], // 排除 @ffmpeg/ffmpeg 以防止预打包
    },
  };
});

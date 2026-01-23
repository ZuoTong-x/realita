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
        // "/whip-proxy": {
        //   target: "https://srs-eip.video-chat.internal.light-ai.top:8848",
        //   rewrite: (path) => path.replace(/^\/whip-proxy/, ""),
        //   changeOrigin: true,
        //   ws: true,
        //   secure: false, // 如果是自签名证书，设置为 false
        // },
        // "/whep-proxy": {
        //   target: "https://srs-eip.video-chat.internal.light-ai.top:8848",
        //   rewrite: (path) => path.replace(/^\/whep-proxy/, ""),
        //   changeOrigin: true,
        //   ws: true,
        //   secure: false, // 如果是自签名证书，设置为 false
        // },
      },
    },
    optimizeDeps: {
      // exclude: ["@ffmpeg/ffmpeg"], // 排除 @ffmpeg/ffmpeg 以防止预打包
    },
  };
});

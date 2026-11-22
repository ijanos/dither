import { defineConfig } from "vite";

function serveFFmpegThreadScript(server) {
  const base = server.config.base === "./" ? "/" : server.config.base;
  const threadScript = `${base}ffmpeg/ffmpeg_g`;
  server.middlewares.use((request, _response, next) => {
    // Emscripten loads the extensionless copy as a JavaScript module.
    if (request.url === threadScript) request.url = `${base}ffmpeg/ffmpeg.js`;
    next();
  });
}

export default defineConfig({
  plugins: [{
    name: "ffmpeg-thread-script",
    configureServer: serveFFmpegThreadScript,
    configurePreviewServer: serveFFmpegThreadScript,
  }],
  server: {
    watch: {
      ignored: ["**/.ffmpeg-build/**"],
    },
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});

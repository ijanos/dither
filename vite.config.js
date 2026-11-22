import { createHash } from "node:crypto";
import { readFileSync, readdirSync, renameSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

function serveFFmpegThreadScript(server) {
  const base = server.config.base === "./" ? "/" : server.config.base;

  server.middlewares.use((request, _response, next) => {
    // Emscripten loads the extensionless copy as a JavaScript module.
    const path = request.url?.slice(base.length);
    if (request.url?.startsWith(base) && /^ffmpeg(?:-[a-f0-9]{16})?\/ffmpeg_g$/.test(path)) {
      request.url = request.url.replace(/ffmpeg_g$/, "ffmpeg.js");
    }
    next();
  });
}

export default defineConfig(({ command, isPreview }) => {
  let coreDirectory = "ffmpeg";
  if (command === "build" && !isPreview) {
    const hash = createHash("sha256");
    for (const name of readdirSync("public/ffmpeg").sort()) {
      const digest = createHash("sha256").update(readFileSync(resolve("public/ffmpeg", name))).digest();
      hash.update(name).update("\0").update(digest);
    }
    coreDirectory = `ffmpeg-${hash.digest("hex").slice(0, 16)}`;
  }
  return {
    define: { __FFMPEG_DIRECTORY__: JSON.stringify(coreDirectory) },
    plugins: [{
      name: "ffmpeg-thread-script",
      writeBundle({ dir }) {
        renameSync(resolve(dir, "ffmpeg"), resolve(dir, coreDirectory));
      },
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
  };
});

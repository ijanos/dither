# dithertool

Client-side web tool that dithers images with a custom WASM build of FFmpeg.

## Run locally

Build the FFmpeg core once using the instructions below, then start Vite.

```sh
npm install
npm run dev
```

Open the localhost URL printed by Vite. The threaded core needs cross-origin
isolation. Vite serves the required headers for both development and preview.

## Build the OpenClaw FFmpeg core

Install Node 24.22.1 or newer, pnpm 12.15.0, and Emscripten 6.0.11. Follow the
upstream guide to install the system tools and activate Emscripten with your
installed version of Node. [Toolchain instructions](https://github.com/openclaw/ffmpeg-wasm/blob/b3c8e83919d7b0fae91f519fe8f82ae81be766a3/README.md#install)

```sh
npm run build:ffmpeg
```

The script checks out the pinned OpenClaw source under `.ffmpeg-build/` and
applies the patch that enables palette generation, dithering, GIF demuxing,
parsing, and decoding, and JPEG 2000 decoding. It writes the browser FFmpeg
JavaScript, WebAssembly, and upstream license notices to `public/ffmpeg/`.

## Original ffmpeg.wasm build

The ffmpeg.wasm file is around 30Mb by default, it can be greatly slimmed down
for image processing.

With some trial and error I managed to slim it under 2Mb with these compile flags.

```
bash -x /src/build.sh \
--disable-all \
--enable-gpl \
--enable-zlib \
--enable-libwebp \
--enable-protocol=file \
--enable-avcodec \
--enable-avformat \
--enable-avfilter \
--enable-swresample \
--enable-swscale \
--enable-avdevice \
--enable-postproc \
--enable-filter=paletteuse,palettegen,scale,format \
--enable-decoder=gif,mjpeg,jpeg200,png \
--enable-encoder=png \
--enable-muxer=apng,image2 \
--enable-demuxer=apng,gif,image_png_pipe,image2
```

## palettes

Plattes I didn't create are from https://lospec.com/palette-list/tag/2bit

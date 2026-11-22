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

## Build the FFmpeg core

Install and activate Emscripten 6.0.11 with Node 24.22.1 or newer. You'll also
need Git, Make, and pkg-config. [Emscripten SDK setup](https://emscripten.org/docs/getting_started/downloads.html)

```sh
npm run build:ffmpeg
```

The script builds FFmpeg 9.0.2 with `-Oz` and link-time optimization. It
includes the codecs needed for PNG, JPEG, GIF, JPEG 2000, and HEIC input and
PNG output. The browser JavaScript, WASM, and license notices go in
`public/ffmpeg/`.

## palettes

Plattes I didn't create are from https://lospec.com/palette-list/tag/2bit

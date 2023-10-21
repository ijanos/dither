# dithertool

Client side web tool to create dithered images.
Actual dithering is done by [FFmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm)

## ffmpeg.wasm

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

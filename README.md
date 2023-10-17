ffmpeg flags

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



Regular Dither icon by Arthur Shlain from Usefulicons
CC-BY-3.0
https://usefulicons.com/glyph-16x16/regular-dither

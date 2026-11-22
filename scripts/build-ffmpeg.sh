#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
build_dir="$repo_root/.ffmpeg-build"
source_dir="$build_dir/ffmpeg"
browser_dir="$build_dir/browser-ffmpeg"
output_dir="$repo_root/public/ffmpeg"
ffmpeg_url=https://github.com/FFmpeg/FFmpeg.git
# FFmpeg n9.0.2, the same revision used by the OpenClaw build.
ffmpeg_revision=946fcce07b6dcd0331c8cc609192aeff5e1924f8

missing_tools=()
for tool in git node emcc em++ emar emranlib emnm emmake emconfigure make pkg-config; do
  if ! command -v "$tool" >/dev/null; then
    missing_tools+=("$tool")
  fi
done
if ((${#missing_tools[@]})); then
  printf 'Missing FFmpeg build tools: %s\n' "${missing_tools[*]}" >&2
  exit 1
fi

mkdir -p "$source_dir" "$browser_dir"
if [[ ! -d "$source_dir/.git" ]]; then
  git init --quiet "$source_dir"
fi
if ! git -C "$source_dir" cat-file -e "$ffmpeg_revision^{commit}" 2>/dev/null; then
  git -C "$source_dir" fetch --quiet --depth=1 "$ffmpeg_url" "$ffmpeg_revision"
fi
git -C "$source_dir" checkout --quiet --detach "$ffmpeg_revision"

cd -- "$browser_dir"
compile_flags="-Oz -flto -pthread -sUSE_ZLIB=1"
link_flags="$compile_flags -sENVIRONMENT=web,worker -sMODULARIZE=1 -sEXPORT_ES6=1"
link_flags+=" -sALLOW_MEMORY_GROWTH=1 -sPTHREAD_POOL_SIZE=4 -sPROXY_TO_PTHREAD=1"
link_flags+=" -sEXIT_RUNTIME=1 -sEXPORTED_RUNTIME_METHODS=FS,callMain"

# HEIC input needs the MOV demuxer and HEVC decoder.
emconfigure "$source_dir/configure" \
  --target-os=none --arch=x86_32 --enable-cross-compile \
  --disable-x86asm --disable-inline-asm --disable-stripping --disable-doc \
  --disable-debug --disable-autodetect --disable-all --disable-network \
  --disable-iconv --disable-runtime-cpudetect \
  --enable-ffmpeg --enable-avcodec --enable-avformat --enable-avfilter \
  --enable-swscale --enable-swresample --enable-pthreads --enable-zlib \
  --enable-decoder=gif,hevc,jpeg2000,mjpeg,png \
  --enable-parser=gif,hevc,mjpeg,png \
  --enable-demuxer=gif,image2,mov \
  --enable-encoder=png --enable-muxer=image2 --enable-protocol=file \
  --enable-filter=palettegen,paletteuse,scale,format \
  --cc=emcc --cxx=em++ --ar=emar --ranlib=emranlib --nm=emnm \
  --optflags=-Oz --extra-cflags="$compile_flags" --extra-ldflags="$compile_flags"

jobs=$(node -p 'Math.min(8, require("node:os").availableParallelism())')
emmake make -j "$jobs" ffmpeg "LDEXEFLAGS=$link_flags"

mkdir -p "$output_dir"
cp ffmpeg "$output_dir/ffmpeg.js"
cp ffmpeg_g ffmpeg_g.wasm "$output_dir/"
cp "$source_dir"/LICENSE.md "$source_dir"/COPYING.* "$output_dir/"
# Remove artifacts from the previous build's external encoders and worker.
rm -f "$output_dir"/{COPYING.lame,LICENSE.lame,LICENSE.libvpx,PATENTS.libvpx,ffmpeg.worker.js}
if [[ -f ffmpeg.worker.js ]]; then
  cp ffmpeg.worker.js "$output_dir/"
fi
printf 'Browser FFmpeg assets written to %s\n' "$output_dir"

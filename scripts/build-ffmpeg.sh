#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
build_dir="$repo_root/.ffmpeg-build"
source_dir="$build_dir/openclaw"
output_dir="$repo_root/public/ffmpeg"
upstream_url=https://github.com/openclaw/ffmpeg-wasm.git
upstream_revision=b3c8e83919d7b0fae91f519fe8f82ae81be766a3

missing_tools=()
for tool in git node pnpm emcc em++ emar emranlib emnm emmake emconfigure make pkg-config autoconf automake libtool nasm yasm; do
  if ! command -v "$tool" >/dev/null; then
    missing_tools+=("$tool")
  fi
done
if ((${#missing_tools[@]})); then
  printf 'Missing FFmpeg build tools: %s\n' "${missing_tools[*]}" >&2
  exit 1
fi

mkdir -p "$source_dir"
if [[ ! -d "$source_dir/.git" ]]; then
  git init --quiet "$source_dir"
fi
if ! git -C "$source_dir" cat-file -e "$upstream_revision^{commit}" 2>/dev/null; then
  git -C "$source_dir" fetch --quiet --depth=1 "$upstream_url" "$upstream_revision"
fi

cd -- "$source_dir"
git checkout --quiet --detach "$upstream_revision"
# Restore the generated checkout's build script so the patch can be reapplied.
git restore --source="$upstream_revision" --worktree -- scripts/build.ts
git apply "$repo_root/scripts/openclaw-dither.patch"
pnpm install --frozen-lockfile --store-dir "$build_dir/pnpm-store"
env -u FFMPEG_VERSION -u LAME_REF -u LIBVPX_REF pnpm build

mkdir -p "$output_dir"
cp dist/browser/ffmpeg.js dist/browser/ffmpeg_g dist/browser/ffmpeg_g.wasm "$output_dir/"
if [[ -f dist/browser/ffmpeg.worker.js ]]; then
  cp dist/browser/ffmpeg.worker.js "$output_dir/"
fi
cp dist/LICENSE.md dist/COPYING.* dist/LICENSE.libvpx dist/PATENTS.libvpx "$output_dir/"
cp .cache/lame/COPYING "$output_dir/COPYING.lame"
cp .cache/lame/LICENSE "$output_dir/LICENSE.lame"
printf 'Browser FFmpeg assets written to %s\n' "$output_dir"

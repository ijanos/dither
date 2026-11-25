export interface DitherRequest {
  assetBase: string;
  filename: string;
  image: ArrayBuffer;
  palette: string;
  colorCount: number;
  algorithm: string;
}

export type DitherResult = { png: ArrayBuffer } | { error: string };

interface FFmpegModule {
  FS: {
    writeFile(path: string, bytes: Uint8Array): void;
    readFile(path: string): Uint8Array;
  };
}

type CreateFFmpeg = (options: {
  arguments: string[];
  locateFile: (name: string) => string;
  onAbort: (reason: string) => void;
  onExit: (code: number) => void;
  preRun: (module: FFmpegModule) => void;
  printErr: (line: string) => void;
  thisProgram: string;
}) => Promise<FFmpegModule>;

async function renderPng(
  createFFmpeg: CreateFFmpeg,
  coreBase: URL,
  args: string[],
  inputs: Record<string, Uint8Array>,
): Promise<ArrayBuffer> {
  const output = 'output.png';
  const stderr: string[] = [];
  let onExit!: (code: number) => void;
  let onAbort!: (reason: string) => void;
  const exited = new Promise<number>((resolve, reject) => {
    onExit = resolve;
    onAbort = (reason) => reject(new Error(stderr.join('\n') || reason));
  });

  const [module, code] = await Promise.all([
    createFFmpeg({
      arguments: ['-nostdin', '-hide_banner', '-loglevel', 'error', ...args, '-frames:v', '1', '-update', '1', output],
      locateFile: (name) => new URL(name, coreBase).href,
      onAbort,
      onExit,
      preRun: ({ FS }) => {
        for (const [filename, bytes] of Object.entries(inputs)) FS.writeFile(filename, bytes);
      },
      printErr: (line) => stderr.push(line),
      thisProgram: 'ffmpeg',
    }),
    exited,
  ]);

  if (code !== 0) throw new Error(stderr.join('\n') || `FFmpeg exited with code ${code}.`);
  return module.FS.readFile(output).slice().buffer;
}

async function dither(request: DitherRequest): Promise<ArrayBuffer> {
  if (!self.crossOriginIsolated) {
    throw new Error('FFmpeg requires cross-origin isolation. Open this app through the Vite development server or preview.');
  }

  const coreBase = new URL(`${__FFMPEG_DIRECTORY__}/`, request.assetBase);
  const coreURL = new URL('ffmpeg.js', coreBase).href;
  const { default: createFFmpeg }: { default: CreateFFmpeg } = await import(/* @vite-ignore */ coreURL)
    .catch(() => { throw new Error('Could not load the FFmpeg core. Run npm run build:ffmpeg and reload.'); });
  const inputs = { [request.filename]: new Uint8Array(request.image) };
  const args = ['-i', request.filename];
  const paletteUse = `paletteuse=dither=${request.algorithm}`;
  if (request.palette === 'gen') {
    // FFmpeg reserves one extra palette entry for transparency.
    const maxColors = request.colorCount + 1;
    args.push('-filter_complex', `[0:v:0]palettegen=max_colors=${maxColors}[p];[0:v:0][p]${paletteUse}`);
  } else {
    const response = await fetch(new URL(`pal_${request.palette}.png`, request.assetBase));
    if (!response.ok) throw new Error('Could not load the selected palette.');
    inputs['palette.png'] = new Uint8Array(await response.arrayBuffer());
    args.push('-i', 'palette.png', '-lavfi', paletteUse);
  }

  return renderPng(createFFmpeg, coreBase, args, inputs);
}

self.addEventListener('message', async ({ data }: MessageEvent<DitherRequest>) => {
  try {
    const png = await dither(data);
    self.postMessage({ png } satisfies DitherResult, { transfer: [png] });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error) } satisfies DitherResult);
  }
});

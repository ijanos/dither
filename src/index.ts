import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg|null = null;
let name: string|null = null;

const initFFmpeg = async () => {
  ffmpeg = new FFmpeg();
    ffmpeg.on("log", ({ message }) => {
      console.log(message);
    })

    await ffmpeg.load({
      coreURL: await toBlobURL('/ffmpeg-core.js', "text/javascript"),
      wasmURL: await toBlobURL('/ffmpeg-core.wasm', "application/wasm")
    });
}

const transcode = async () => {
  const dither = (document.getElementById('dither') as HTMLInputElement).value;
  const colors = (document.getElementById('colors') as HTMLInputElement).value;

  if (ffmpeg === null) {
    await initFFmpeg()
  }

  if (name == null ) { name = "" }

  if (colors == "gen") {
    await ffmpeg?.exec(['-i', name, '-vf', 'palettegen=max_colors=4', 'palette.png']);
  } else {
    await ffmpeg?.writeFile("palette.png", await fetchFile(`pal_${colors}.png`));
  }

  await ffmpeg?.exec(['-i', name, '-i', 'palette.png', '-lavfi', `paletteuse=dither=${dither}`, "output.png"]);

  const data = await ffmpeg?.readFile('output.png') as Uint8Array;

  const image = document.getElementById('output-image') as HTMLImageElement;
  image.src = URL.createObjectURL(new Blob([data.buffer], { type: 'image/png' }));
}

const updateThumbnail = async ( e: Event ) : Promise<void> => {
  const target = e.target as HTMLInputElement;
  const file = (target.files as FileList)[0];

  if (ffmpeg === null) {
    await initFFmpeg()
  }

  name = file.name;
  await ffmpeg?.writeFile(name, await fetchFile(file));

  const data = await ffmpeg?.readFile(name) as Uint8Array;
  const image = document.getElementById('thumbnail') as HTMLImageElement;

  image.src = URL.createObjectURL(new Blob([data.buffer]));
}

const elm = document.getElementById('uploader') as HTMLInputElement;
elm.addEventListener('change', updateThumbnail);
const ditherbutton = document.getElementById('ditherbutton') as HTMLButtonElement;
ditherbutton.addEventListener('click', transcode);

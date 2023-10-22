import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg = null;
let name = null;

const initFFmpeg = async () => {
  ffmpeg = new FFmpeg();
    ffmpeg.on("log", ({ message }) => {
      console.log(message);
    })
    ffmpeg.on("progress", ({ progress }) => { });

    await ffmpeg.load({
      coreURL: await toBlobURL('/ffmpeg-core.js', "text/javascript"),
      wasmURL: await toBlobURL('/ffmpeg-core.wasm', "application/wasm")
    });
}

const transcode = async ({ target: { files } }) => {
  const dither = document.getElementById('dither').value;
  const colors = document.getElementById('colors').value;

  if (ffmpeg === null) {
    await initFFmpeg()
  }

  if (colors == "gen") {
    await ffmpeg.exec(['-i', name, '-vf', 'palettegen=max_colors=4', 'palette.png']);
  } else {
    await ffmpeg.writeFile("palette.png", await fetchFile(`pal_${colors}.png`));
  }

  await ffmpeg.exec(['-i', name, '-i', 'palette.png', '-lavfi', `paletteuse=dither=${dither}`, "output.png"]);

  const data = await ffmpeg.readFile('output.png');

  const image = document.getElementById('output-image');
  image.src = URL.createObjectURL(new Blob([data.buffer], { type: 'image/png' }));
}

const updateThumbnail = async ({ target: { files } }) => {
  if (ffmpeg === null) {
    await initFFmpeg()
  }
  name = files[0].name;
  await ffmpeg.writeFile(name, await fetchFile(files[0]));

  const data = await ffmpeg.readFile(name);
  const image = document.getElementById('thumbnail');

  image.src = URL.createObjectURL(new Blob([data.buffer]));
}
const elm = document.getElementById('uploader');
elm.addEventListener('change', updateThumbnail);
const ditherbutton = document.getElementById('ditherbutton');
ditherbutton.addEventListener('click', transcode);

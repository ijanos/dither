import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const initFFmpeg = async () => {
  const ffmpeg = new FFmpeg();

  ffmpeg.on("log", ({ message }) => {
    console.log(message);
  });

  await ffmpeg.load({
    coreURL: await toBlobURL('/ffmpeg-core.js', "text/javascript"),
    wasmURL: await toBlobURL('/ffmpeg-core.wasm', "application/wasm")
  });

  return ffmpeg;
}

const ffmpeg = initFFmpeg();
let name: string = "";


function progressStart() {
  const text = document.getElementById('dithertext');
  const spinner = document.getElementById('ditherspinner');
  text?.classList.remove("inline");
  text?.classList.add("hidden");
  spinner?.classList.remove("hidden");
  spinner?.classList.add("inline");
}

function progressEnd() {
  const text = document.getElementById('dithertext');
  const spinner = document.getElementById('ditherspinner');
  text?.classList.remove("hidden");
  text?.classList.add("inline");
  spinner?.classList.remove("inline");
  spinner?.classList.add("hidden");
}

const dither = async () => {
  if (name == "") {return}

  progressStart();

  const dither = (document.getElementById('dither') as HTMLInputElement).value;
  const colors = (document.getElementById('colors') as HTMLInputElement).value;
  const ff = await ffmpeg;

  if (colors == "gen") {
    await ff.exec(['-i', name, '-vf', 'palettegen=max_colors=4', 'palette.png']);
  } else {
    await ff.writeFile("palette.png", await fetchFile(`pal_${colors}.png`));
  }

  await ff.exec(['-i', name, '-i', 'palette.png', '-lavfi', `paletteuse=dither=${dither}`, "output.png"]);

  const data = ff.readFile('output.png') as Promise<Uint8Array>;

  const image = document.getElementById('output-image') as HTMLImageElement;
  image.src = URL.createObjectURL(new Blob([(await data).buffer], { type: 'image/png' }));

  progressEnd();
}

const updateThumbnail = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = (target.files as FileList)[0];
  name = file.name;

  if (name.split(".").pop()?.toLowerCase() == "heic") {
    console.log("heic not supported"); // TODO warning on UI
  }

  const image = document.getElementById('thumbnail') as HTMLImageElement;
  image.src = URL.createObjectURL(file);

  await (await ffmpeg).writeFile(name, new Uint8Array(await file.arrayBuffer()));
}

const uploadButton = document.getElementById('uploader') as HTMLInputElement;
uploadButton.addEventListener('change', updateThumbnail);

const ditherbutton = document.getElementById('ditherbutton') as HTMLButtonElement;
ditherbutton.addEventListener('click', dither);

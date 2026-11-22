import type { DitherRequest, DitherResult } from './dither-worker';

function requireElement<T extends Element = Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing required element: ${selector}`);
  return element;
}

const uploader = requireElement<HTMLInputElement>('#uploader');
const palette = requireElement<HTMLSelectElement>('#colors');
const algorithm = requireElement<HTMLSelectElement>('#dither');
const button = requireElement<HTMLButtonElement>('#ditherbutton');
const buttonText = requireElement('#dithertext');
const spinner = requireElement('#ditherspinner');
const errorMessage = requireElement('#dither-error');
const thumbnail = requireElement<HTMLImageElement>('#thumbnail');
const output = requireElement<HTMLImageElement>('#output-image');
const assetBase = new URL(import.meta.env.BASE_URL, document.baseURI).href;

function runDither(request: DitherRequest): Promise<ArrayBuffer> {
  const worker = new Worker(new URL('./dither-worker.ts', import.meta.url), { type: 'module' });

  return new Promise<ArrayBuffer>((resolve, reject) => {
    worker.onmessage = ({ data }: MessageEvent<DitherResult>) => {
      if ('error' in data) reject(new Error(data.error));
      else resolve(data.png);
    };
    worker.onerror = ({ message }) => reject(new Error(message || 'The dithering worker failed to start.'));
    worker.onmessageerror = () => reject(new Error('The dithering worker returned an unreadable result.'));
    worker.postMessage(request, [request.image]);
  }).finally(() => worker.terminate());
}

function showError(message = '') {
  errorMessage.textContent = message;
  errorMessage.classList.toggle('hidden', !message);
}

uploader.addEventListener('change', () => {
  const file = uploader.files?.[0];
  if (thumbnail.src.startsWith('blob:')) URL.revokeObjectURL(thumbnail.src);
  if (file) thumbnail.src = URL.createObjectURL(file);
  else thumbnail.removeAttribute('src');
  button.disabled = !file;
  showError();
});

button.addEventListener('click', async () => {
  const file = uploader.files?.[0];
  if (!file || button.disabled) return;

  const filename = `input${file.name.match(/\.[a-z0-9]+$/i)?.[0].toLowerCase() ?? ''}`;
  const selectedPalette = palette.value;
  const selectedAlgorithm = algorithm.value;
  button.disabled = true;
  uploader.disabled = true;
  buttonText.classList.add('hidden');
  spinner.classList.replace('hidden', 'inline');
  showError();

  try {
    const png = await runDither({
      assetBase,
      filename,
      image: await file.arrayBuffer(),
      palette: selectedPalette,
      algorithm: selectedAlgorithm,
    });
    if (output.src.startsWith('blob:')) URL.revokeObjectURL(output.src);
    output.src = URL.createObjectURL(new Blob([png], { type: 'image/png' }));
  } catch (error) {
    showError(error instanceof Error ? error.message : String(error));
  } finally {
    spinner.classList.replace('inline', 'hidden');
    buttonText.classList.remove('hidden');
    uploader.disabled = false;
    button.disabled = false;
  }
});

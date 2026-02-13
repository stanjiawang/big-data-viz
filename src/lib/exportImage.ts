import { toPng } from 'html-to-image';

type ExportDebugWindow = Window & {
  __lastExportedImage?: string;
};

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function downloadElementAsImage(
  element: HTMLElement,
  fileName: string,
): Promise<void> {
  const safeName = sanitizeFileName(fileName) || 'export';
  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: '#ffffff',
  });

  const response = await fetch(dataUrl);
  const imageBlob = await response.blob();
  const objectUrl = URL.createObjectURL(imageBlob);
  const link = document.createElement('a');
  link.download = `${safeName}.png`;
  link.href = objectUrl;
  document.body.append(link);
  link.click();
  link.remove();
  (window as ExportDebugWindow).__lastExportedImage = `${safeName}.png`;
  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1_000);
}

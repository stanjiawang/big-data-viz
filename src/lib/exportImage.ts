import { toPng } from 'html-to-image';

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

  const link = document.createElement('a');
  link.download = `${safeName}.png`;
  link.href = dataUrl;
  link.click();
}

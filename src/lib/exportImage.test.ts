import { downloadElementAsImage } from '@/lib/exportImage';
import { toPng } from 'html-to-image';

jest.mock('html-to-image', () => ({
  toPng: jest.fn(() => Promise.resolve('data:image/png;base64,mock')),
}));

describe('exportImage', () => {
  it('exports an element as png with sanitized filename', async () => {
    const element = document.createElement('div');
    const click = jest.fn();
    let anchor: HTMLAnchorElement | null = null;
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = jest.spyOn(document, 'createElement');
    createElementSpy.mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        anchor = {
          download: '',
          href: '',
          click,
        } as unknown as HTMLAnchorElement;
        return anchor;
      }
      return originalCreateElement(tagName);
    });

    await downloadElementAsImage(element, '  Summary Card @ 2026  ');

    expect(toPng).toHaveBeenCalledWith(
      element,
      expect.objectContaining({
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      }),
    );
    expect(anchor?.download).toBe('summary-card-2026.png');
    expect(anchor?.href).toBe('data:image/png;base64,mock');
    expect(click).toHaveBeenCalledTimes(1);

    createElementSpy.mockRestore();
  });
});

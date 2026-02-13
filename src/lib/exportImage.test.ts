import { downloadElementAsImage } from '@/lib/exportImage';
import { toPng } from 'html-to-image';

jest.mock('html-to-image', () => ({
  toPng: jest.fn(() => Promise.resolve('data:image/png;base64,mock')),
}));

describe('exportImage', () => {
  it('exports an element as png with sanitized filename', async () => {
    const element = document.createElement('div');
    const linkMock = {
      download: '',
      href: '',
      click: jest.fn(),
    };
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = jest.spyOn(document, 'createElement');
    createElementSpy.mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        return linkMock as unknown as HTMLAnchorElement;
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
    expect(linkMock.download).toBe('summary-card-2026.png');
    expect(linkMock.href).toBe('data:image/png;base64,mock');
    expect(linkMock.click).toHaveBeenCalledTimes(1);

    createElementSpy.mockRestore();
  });
});

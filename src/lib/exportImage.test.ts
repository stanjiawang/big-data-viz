import { downloadElementAsImage } from '@/lib/exportImage';
import { toPng } from 'html-to-image';

jest.mock('html-to-image', () => ({
  toPng: jest.fn(() => Promise.resolve('data:image/png;base64,mock')),
}));

describe('exportImage', () => {
  it('exports an element as png with sanitized filename', async () => {
    const element = document.createElement('div');
    const appendSpy = jest.spyOn(document.body, 'append').mockImplementation(() => {});
    const removeSpy = jest.fn();
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const linkMock = {
      download: '',
      href: '',
      click: jest.fn(),
      remove: removeSpy,
    };
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      blob: jest.fn().mockResolvedValue(new Blob(['mock'])),
    } as unknown as Response);
    const createObjectUrlMock = jest.fn(() => 'blob:mock-export-url');
    const revokeObjectUrlMock = jest.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectUrlMock,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectUrlMock,
    });
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
    expect(fetchMock).toHaveBeenCalledWith('data:image/png;base64,mock');
    expect(createObjectUrlMock).toHaveBeenCalledTimes(1);
    expect(linkMock.href).toBe('blob:mock-export-url');
    expect(appendSpy).toHaveBeenCalledWith(linkMock);
    expect(linkMock.click).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledTimes(1);

    createElementSpy.mockRestore();
    appendSpy.mockRestore();
    fetchMock.mockRestore();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: originalCreateObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: originalRevokeObjectURL,
    });
  });
});

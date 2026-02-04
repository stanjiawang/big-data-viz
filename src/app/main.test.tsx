jest.mock('@/styles/tailwind.css', () => ({}));

import { bootstrap } from '@/app/main';

const renderMock = jest.fn();

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: renderMock,
  })),
}));

jest.mock('@/app/App', () => ({
  __esModule: true,
  default: () => <div>Mock App</div>,
}));

describe('bootstrap', () => {
  beforeEach(() => {
    renderMock.mockClear();
    document.body.innerHTML = '';
  });

  it('renders the app when root exists', async () => {
    document.body.innerHTML = '<div id="root"></div>';

    await bootstrap({ isDev: false });

    expect(renderMock).toHaveBeenCalled();
  });

  it('throws when root container is missing', async () => {
    await expect(bootstrap({ isDev: false })).rejects.toThrow(
      'Root container is missing in index.html',
    );
  });
});

jest.mock('@/mocks/handlers', () => ({
  handlers: [{}, {}],
}));

jest.mock('msw/browser', () => ({
  setupWorker: jest.fn(() => ({ start: jest.fn() })),
}));

import { worker } from '@/mocks/browser';

describe('msw worker', () => {
  it('exports a worker instance', () => {
    const { setupWorker } = jest.requireMock('msw/browser');
    expect(worker).toBeDefined();
    expect(setupWorker).toHaveBeenCalled();
  });
});

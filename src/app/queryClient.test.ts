import { queryClient } from '@/app/queryClient';

describe('queryClient', () => {
  it('sets default query options', () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.staleTime).toBe(30000);
    expect(defaults.queries?.retry).toBe(1);
  });
});

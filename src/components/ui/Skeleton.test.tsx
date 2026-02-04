import { render } from '@testing-library/react';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';

describe('Skeleton', () => {
  it('renders with aria-hidden and custom class', () => {
    const { container } = render(<Skeleton className="h-4 w-10" />);
    const node = container.querySelector('[aria-hidden="true"]');
    expect(node).toBeTruthy();
    expect(node?.className).toContain('h-4');
  });

  it('renders skeleton text', () => {
    const { container } = render(<SkeletonText className="w-12" />);
    const node = container.querySelector('[aria-hidden="true"]');
    expect(node?.className).toContain('h-3');
    expect(node?.className).toContain('w-12');
  });
});

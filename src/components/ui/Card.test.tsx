import { render, screen } from '@testing-library/react';
import { Card } from '@/components/ui/Card';

describe('Card', () => {
  it('renders title and description', () => {
    render(
      <Card title="Summary" description="Quick glance">
        <div>Content</div>
      </Card>,
    );

    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('Quick glance')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies custom className and contentClassName', () => {
    const { container } = render(
      <Card title="Custom" className="custom-card" contentClassName="custom-content">
        <div>Body</div>
      </Card>,
    );

    const section = container.querySelector('section');
    expect(section).toHaveClass('custom-card');
    const content = container.querySelector('.custom-content');
    expect(content).toBeInTheDocument();
  });
});

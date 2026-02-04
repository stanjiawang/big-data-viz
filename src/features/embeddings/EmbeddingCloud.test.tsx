import { render, screen } from '@testing-library/react';
import { EmbeddingCloud } from '@/features/embeddings/EmbeddingCloud';

jest.mock('@deck.gl/react', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="deckgl">{children}</div>
  ),
}));

jest.mock('@deck.gl/core', () => ({
  OrthographicView: class {},
}));

jest.mock('@deck.gl/layers', () => ({
  ScatterplotLayer: class {
    constructor() {}
  },
}));

describe('EmbeddingCloud', () => {
  it('shows loading state', () => {
    render(<EmbeddingCloud isLoading />);
    expect(screen.getByText('Loading embeddings...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(<EmbeddingCloud isError />);
    expect(screen.getByText('Failed to load embedding cloud.')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    render(<EmbeddingCloud records={[]} />);
    expect(screen.getByText('No embedding data.')).toBeInTheDocument();
  });
});

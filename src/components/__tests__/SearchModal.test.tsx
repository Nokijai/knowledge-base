import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchModal from '@/components/search/SearchModal';
import type { PostMeta } from '@/lib/content';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/',
}));

const mockPosts: PostMeta[] = [
  {
    title: 'Cointegration Theory',
    category: 'quant-theory',
    order: 1,
    date: '2026-06-01',
    tags: ['cointegration', 'pairs-trading'],
    description: 'Deep dive into cointegration.',
    slug: 'cointegration-theory',
    readingTime: 8,
  },
  {
    title: 'Speculative Decoding',
    category: 'daily-tech',
    order: 1,
    date: '2026-06-20',
    tags: ['llm', 'inference'],
    description: 'Accelerate LLM inference.',
    slug: 'speculative-decoding',
    readingTime: 6,
  },
  {
    title: 'Fourier Residue Identity',
    category: 'daily-finance',
    order: 1,
    date: '2026-07-18',
    tags: ['options', 'fourier'],
    description: 'Option pricing with residue calculus.',
    slug: 'fourier-residue-identity',
    readingTime: 10,
  },
];

describe('SearchModal', () => {
  beforeEach(() => {
    mockPush.mockClear();
    // Render with posts
    render(<SearchModal posts={mockPosts} />);
  });

  afterEach(() => {
    // Clean up any open modals
    const backdrop = document.querySelector('[data-testid="search-backdrop"]');
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    document.body.innerHTML = '';
  });

  it('does not show modal by default', () => {
    expect(screen.queryByPlaceholderText(/search.*articles/i)).not.toBeInTheDocument();
  });

  it('opens modal on Cmd+K', async () => {
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search.*articles/i)).toBeInTheDocument();
    });
  });

  it('opens modal on Ctrl+K', async () => {
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search.*articles/i)).toBeInTheDocument();
    });
  });

  it('closes modal on Escape', async () => {
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search.*articles/i)).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/search.*articles/i)).not.toBeInTheDocument();
    });
  });

  it('closes modal when clicking backdrop', async () => {
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search.*articles/i)).toBeInTheDocument();
    });

    const backdrop = screen.getByTestId('search-backdrop');
    fireEvent.click(backdrop);
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/search.*articles/i)).not.toBeInTheDocument();
    });
  });

  it('shows results when typing a query', async () => {
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText(/search.*articles/i);

    await userEvent.type(input, 'cointegration');
    await waitFor(() => {
      expect(screen.getByText('Cointegration Theory')).toBeInTheDocument();
    });
  });

  it('shows no results state for unmatched query', async () => {
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText(/search.*articles/i);

    await userEvent.type(input, 'xyznonexistent');
    await waitFor(() => {
      expect(screen.getByText(/no results/i)).toBeInTheDocument();
    });
  });

  it('navigates to article on result click', async () => {
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText(/search.*articles/i);

    await userEvent.type(input, 'fourier');
    await waitFor(() => {
      expect(screen.getByText('Fourier Residue Identity')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Fourier Residue Identity'));
    expect(mockPush).toHaveBeenCalledWith('/fourier-residue-identity');
  });

  it('shows empty state when input is cleared', async () => {
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    const input = await screen.findByPlaceholderText(/search.*articles/i);

    await userEvent.type(input, 'cointegration');
    await waitFor(() => {
      expect(screen.getByText('Cointegration Theory')).toBeInTheDocument();
    });

    // Clear input
    await userEvent.clear(input);
    await waitFor(() => {
      expect(screen.queryByText('Cointegration Theory')).not.toBeInTheDocument();
    });
  });

  it('shows total post count in empty state', async () => {
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    await waitFor(() => {
      expect(screen.getByText(/3 articles/i)).toBeInTheDocument();
    });
  });
});

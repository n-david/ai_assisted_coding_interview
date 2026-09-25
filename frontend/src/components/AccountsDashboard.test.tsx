import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AccountsDashboard from './AccountsDashboard';
import { getAccounts } from '~/lib/api';

vi.mock('~/lib/api', () => ({
  getAccounts: vi.fn(),
}));

const mockedGetAccounts = vi.mocked(getAccounts);

describe('AccountsDashboard', () => {
  it('renders the list of accounts once loaded', async () => {
    mockedGetAccounts.mockResolvedValue([
      { id: '1', name: 'Alice', balance_cents: 100000, created_at: '2026-01-01T00:00:00Z' },
      { id: '2', name: 'Bob', balance_cents: 50000, created_at: '2026-01-01T00:00:00Z' },
    ]);

    render(<AccountsDashboard />);

    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('$500.00')).toBeInTheDocument();
  });

  it('renders an error message when the accounts fail to load', async () => {
    mockedGetAccounts.mockRejectedValue(new Error('Could not load accounts (HTTP 500).'));

    render(<AccountsDashboard />);

    expect(await screen.findByText('Could not load accounts (HTTP 500).')).toBeInTheDocument();
  });
});

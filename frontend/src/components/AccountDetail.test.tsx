import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AccountDetail from './AccountDetail';
import { getAccount } from '~/lib/api';

vi.mock('~/lib/api', () => ({
  getAccount: vi.fn(),
}));

const mockedGetAccount = vi.mocked(getAccount);

describe('AccountDetail', () => {
  it('renders the account name and balance once loaded', async () => {
    mockedGetAccount.mockResolvedValue({
      id: '1',
      name: 'Alice',
      balance_cents: 100000,
      created_at: '2026-01-01T00:00:00Z',
    });

    render(<AccountDetail accountId="1" />);

    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
  });

  it('renders an error message when the account is not found', async () => {
    mockedGetAccount.mockRejectedValue(new Error('Could not load account (HTTP 404).'));

    render(<AccountDetail accountId="unknown" />);

    expect(await screen.findByText('Could not load account (HTTP 404).')).toBeInTheDocument();
  });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AccountDetail from './AccountDetail';
import { createTransfer, getAccount, getAccounts } from '~/lib/api';

vi.mock('~/lib/api', () => ({
  getAccount: vi.fn(),
  getAccounts: vi.fn(),
  createTransfer: vi.fn(),
}));

const mockedGetAccount = vi.mocked(getAccount);
const mockedGetAccounts = vi.mocked(getAccounts);
const mockedCreateTransfer = vi.mocked(createTransfer);

const alice = { id: '1', name: 'Alice', balance_cents: 100000, created_at: '2026-01-01T00:00:00Z' };
const bob = { id: '2', name: 'Bob', balance_cents: 100000, created_at: '2026-01-01T00:00:00Z' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AccountDetail', () => {
  it('renders the account name and balance once loaded', async () => {
    mockedGetAccount.mockResolvedValue(alice);
    mockedGetAccounts.mockResolvedValue([alice, bob]);

    render(<AccountDetail accountId="1" />);

    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
  });

  it('renders an error message when the account is not found', async () => {
    mockedGetAccount.mockRejectedValue(new Error('Could not load account (HTTP 404).'));
    mockedGetAccounts.mockResolvedValue([]);

    render(<AccountDetail accountId="unknown" />);

    expect(await screen.findByText('Could not load account (HTTP 404).')).toBeInTheDocument();
  });

  it('submits a transfer and refreshes the balance on success', async () => {
    mockedGetAccount.mockResolvedValueOnce(alice).mockResolvedValueOnce({
      ...alice,
      balance_cents: 75000,
    });
    mockedGetAccounts.mockResolvedValue([alice, bob]);
    mockedCreateTransfer.mockResolvedValue({
      id: 't1',
      from_account_id: alice.id,
      to_account_id: bob.id,
      amount_cents: 25000,
      idempotency_key: 'key',
      created_at: '2026-01-01T00:00:00Z',
    });

    render(<AccountDetail accountId="1" />);

    await screen.findByText('Alice');
    await waitFor(() => expect(screen.getByRole('option', { name: 'Bob' })).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Amount (USD)'), { target: { value: '250' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send transfer' }));

    expect(await screen.findByText('Transfer complete.')).toBeInTheDocument();
    expect(screen.getByText('$750.00')).toBeInTheDocument();
    expect(mockedCreateTransfer).toHaveBeenCalledWith(
      expect.objectContaining({ fromAccountId: '1', toAccountId: '2', amountCents: 25000 }),
    );
  });

  it('shows an inline error when the transfer fails (e.g. insufficient funds)', async () => {
    mockedGetAccount.mockResolvedValue(alice);
    mockedGetAccounts.mockResolvedValue([alice, bob]);
    mockedCreateTransfer.mockRejectedValue(new Error('Insufficient funds'));

    render(<AccountDetail accountId="1" />);

    await screen.findByText('Alice');
    await waitFor(() => expect(screen.getByRole('option', { name: 'Bob' })).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Amount (USD)'), { target: { value: '5000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send transfer' }));

    expect(await screen.findByText('Insufficient funds')).toBeInTheDocument();
  });

  it('rejects a non-positive amount before submitting', async () => {
    mockedGetAccount.mockResolvedValue(alice);
    mockedGetAccounts.mockResolvedValue([alice, bob]);

    render(<AccountDetail accountId="1" />);

    await screen.findByText('Alice');
    await waitFor(() => expect(screen.getByRole('option', { name: 'Bob' })).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Amount (USD)'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send transfer' }));

    expect(await screen.findByText('Amount must be greater than $0.')).toBeInTheDocument();
    expect(mockedCreateTransfer).not.toHaveBeenCalled();
  });

  it('excludes the current account from the destination dropdown', async () => {
    mockedGetAccount.mockResolvedValue(alice);
    mockedGetAccounts.mockResolvedValue([alice, bob]);

    render(<AccountDetail accountId="1" />);

    await screen.findByText('Alice');
    await waitFor(() => expect(screen.getByRole('option', { name: 'Bob' })).toBeInTheDocument());

    expect(screen.queryByRole('option', { name: 'Alice' })).not.toBeInTheDocument();
  });
});

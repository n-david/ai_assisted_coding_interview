'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createTransfer, getAccount, getAccounts, type Account } from '~/lib/api';
import { dollarsToCents, formatCents } from '~/lib/money';

export default function AccountDetail({ accountId }: { accountId: string }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [otherAccounts, setOtherAccounts] = useState<Account[]>([]);
  const [toAccountId, setToAccountId] = useState('');
  const [amountDollars, setAmountDollars] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferMessage, setTransferMessage] = useState<
    { type: 'success' | 'error'; text: string } | null
  >(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAccount() {
      try {
        const data = await getAccount(accountId, controller.signal);
        if (!controller.signal.aborted) setAccount(data);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load account');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadAccount();
    return () => controller.abort();
  }, [accountId]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadOtherAccounts() {
      try {
        const accounts = await getAccounts(controller.signal);
        if (controller.signal.aborted) return;
        const others = accounts.filter((a) => a.id !== accountId);
        setOtherAccounts(others);
        setToAccountId((current) => current || (others[0]?.id ?? ''));
      } catch {
        // The balance load above already surfaces a page-level error; the
        // transfer form simply has no destinations to offer in this case.
      }
    }

    void loadOtherAccounts();
    return () => controller.abort();
  }, [accountId]);

  const handleTransferSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTransferMessage(null);

    let amountCents: number;
    try {
      amountCents = dollarsToCents(amountDollars);
    } catch {
      setTransferMessage({ type: 'error', text: 'Enter a valid dollar amount.' });
      return;
    }
    if (amountCents <= 0) {
      setTransferMessage({ type: 'error', text: 'Amount must be greater than $0.' });
      return;
    }
    if (!toAccountId) {
      setTransferMessage({ type: 'error', text: 'Choose a destination account.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await createTransfer({
        fromAccountId: accountId,
        toAccountId,
        amountCents,
        idempotencyKey: crypto.randomUUID(),
      });
      const refreshed = await getAccount(accountId);
      setAccount(refreshed);
      setAmountDollars('');
      setTransferMessage({ type: 'success', text: 'Transfer complete.' });
    } catch (err) {
      setTransferMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Transfer failed',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline">
            &larr; Back to accounts
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-md bg-red-100 border border-red-400 text-red-700">
            {error}
          </div>
        )}

        {account && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900">{account.name}</h1>
            <p className="text-gray-600 mt-2">Current balance</p>
            <p className="text-4xl font-semibold text-gray-900 mt-1">
              {formatCents(account.balance_cents)}
            </p>
          </div>
        )}

        {account && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Transfer money</h2>
            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label htmlFor="to-account" className="block text-sm font-medium text-gray-700 mb-1">
                  To account
                </label>
                <select
                  id="to-account"
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  disabled={!otherAccounts.length}
                  className="w-full border border-gray-300 rounded-md p-2"
                >
                  {!otherAccounts.length && <option value="">No other accounts available</option>}
                  {otherAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (USD)
                </label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amountDollars}
                  onChange={(e) => setAmountDollars(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-md p-2"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !otherAccounts.length}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Sending...' : 'Send transfer'}
              </button>
            </form>

            {transferMessage && (
              <div
                className={`mt-4 p-4 rounded-md ${
                  transferMessage.type === 'success'
                    ? 'bg-green-100 border border-green-400 text-green-700'
                    : 'bg-red-100 border border-red-400 text-red-700'
                }`}
              >
                {transferMessage.text}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

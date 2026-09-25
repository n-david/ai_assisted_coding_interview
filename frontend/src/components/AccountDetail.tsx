'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAccount, type Account } from '~/lib/api';
import { formatCents } from '~/lib/money';

export default function AccountDetail({ accountId }: { accountId: string }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-3xl font-bold text-gray-900">{account.name}</h1>
            <p className="text-gray-600 mt-2">Current balance</p>
            <p className="text-4xl font-semibold text-gray-900 mt-1">
              {formatCents(account.balance_cents)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

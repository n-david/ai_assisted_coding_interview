'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAccounts, type Account } from '~/lib/api';
import { formatCents } from '~/lib/money';

export default function AccountsDashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAccounts() {
      try {
        const data = await getAccounts(controller.signal);
        if (!controller.signal.aborted) setAccounts(data);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load accounts');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadAccounts();
    return () => controller.abort();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
          <p className="text-gray-600">Select an account to view its balance and transfer money.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-md bg-red-100 border border-red-400 text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          {!accounts.length && !error ? (
            <p className="text-gray-500 text-center py-8">No accounts yet</p>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <Link
                  key={account.id}
                  href={`/accounts/${account.id}`}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium text-gray-900">{account.name}</p>
                  <p className="text-gray-700">{formatCents(account.balance_cents)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

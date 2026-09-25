const API_URL = "http://localhost:8080/api";

export interface Account {
  id: string;
  name: string;
  balance_cents: number;
  created_at: string;
}

export async function getAccounts(signal?: AbortSignal): Promise<Account[]> {
  const response = await fetch(`${API_URL}/accounts/`, {
    signal,
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Could not load accounts (HTTP ${response.status}).`);
  }
  return (await response.json()) as Account[];
}

export async function getAccount(accountId: string, signal?: AbortSignal): Promise<Account> {
  const response = await fetch(`${API_URL}/accounts/${accountId}`, {
    signal,
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Could not load account (HTTP ${response.status}).`);
  }
  return (await response.json()) as Account;
}

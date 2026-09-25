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

export interface Transfer {
  id: string;
  from_account_id: string;
  to_account_id: string;
  amount_cents: number;
  idempotency_key: string;
  created_at: string;
}

export interface CreateTransferInput {
  fromAccountId: string;
  toAccountId: string;
  amountCents: number;
  idempotencyKey: string;
}

export async function createTransfer(input: CreateTransferInput): Promise<Transfer> {
  const response = await fetch(`${API_URL}/transfers/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      from_account_id: input.fromAccountId,
      to_account_id: input.toAccountId,
      amount_cents: input.amountCents,
    }),
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return (await response.json()) as Transfer;
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: unknown };
    if (typeof body.detail === "string") {
      return body.detail;
    }
  } catch {
    // Body wasn't JSON (or had no `detail`); fall through to a generic message.
  }
  return `Transfer failed (HTTP ${response.status}).`;
}

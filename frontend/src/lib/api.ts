const API_URL = "http://localhost:8080/api";

export interface Message {
  id: string;
  content: string;
  created_at: string;
}

export async function getLatestMessages(signal?: AbortSignal): Promise<Message[]> {
  const response = await fetch(`${API_URL}/messages/latest/?limit=10`, {
    signal,
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Could not load messages (HTTP ${response.status}).`);
  }
  return (await response.json()) as Message[];
}

export async function createMessage(content: string): Promise<Message> {
  const response = await fetch(`${API_URL}/messages/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    throw new Error(`Could not create message (HTTP ${response.status}).`);
  }
  return (await response.json()) as Message;
}

export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  sound?: 'default' | null;
  data?: Record<string, unknown>;
};

type ExpoPushTicket = {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
};

type ExpoPushResponse = {
  data: ExpoPushTicket[];
};

/**
 * Send one or more Expo push notifications.
 * Returns tickets; callers should prune DeviceNotRegistered tokens.
 */
export async function sendExpoPush(
  messages: ExpoPushMessage[],
): Promise<ExpoPushTicket[]> {
  if (messages.length === 0) return [];

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const accessToken = Deno.env.get('EXPO_ACCESS_TOKEN');
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers,
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Expo push failed (${response.status}): ${text}`);
  }

  const payload = (await response.json()) as ExpoPushResponse;
  return payload.data ?? [];
}

/** Collect Expo push tokens that should be removed from the DB. */
export function collectInvalidPushTokens(
  messages: ExpoPushMessage[],
  tickets: ExpoPushTicket[],
): string[] {
  const invalid: string[] = [];
  for (let i = 0; i < tickets.length; i += 1) {
    const ticket = tickets[i];
    const message = messages[i];
    if (!ticket || !message) continue;
    if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
      invalid.push(message.to);
    }
  }
  return invalid;
}

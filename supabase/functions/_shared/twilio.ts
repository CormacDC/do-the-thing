import { TWILIO_MIN_SCHEDULE_MS } from './config.ts';

type TwilioCredentials = {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
};

let cachedMessagingServiceSid: string | null = null;

function twilioAuthHeader(accountSid: string, authToken: string): string {
  return `Basic ${btoa(`${accountSid}:${authToken}`)}`;
}

async function twilioFetch(
  url: string,
  creds: TwilioCredentials,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', twilioAuthHeader(creds.accountSid, creds.authToken));
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/x-www-form-urlencoded');
  }
  return fetch(url, { ...init, headers });
}

async function getPhoneNumberSid(creds: TwilioCredentials): Promise<string> {
  const encoded = encodeURIComponent(creds.phoneNumber);
  const url =
    `https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}/IncomingPhoneNumbers.json?PhoneNumber=${encoded}`;

  const response = await twilioFetch(url, creds);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to look up Twilio phone number: ${text}`);
  }

  const data = await response.json();
  const sid = data.incoming_phone_numbers?.[0]?.sid as string | undefined;
  if (!sid) {
    throw new Error(`Twilio phone number ${creds.phoneNumber} not found on account`);
  }
  return sid;
}

/**
 * Twilio message scheduling requires a Messaging Service. Resolve one that
 * includes TWILIO_PHONE_NUMBER, creating a service if necessary.
 */
async function getMessagingServiceSid(creds: TwilioCredentials): Promise<string> {
  if (cachedMessagingServiceSid) return cachedMessagingServiceSid;

  const listResponse = await twilioFetch(
    'https://messaging.twilio.com/v1/Services?PageSize=50',
    creds,
  );
  if (!listResponse.ok) {
    const text = await listResponse.text();
    throw new Error(`Failed to list Twilio Messaging Services: ${text}`);
  }

  const listData = await listResponse.json();
  const services = (listData.services ?? []) as Array<{ sid: string }>;

  for (const service of services) {
    const numbersResponse = await twilioFetch(
      `https://messaging.twilio.com/v1/Services/${service.sid}/PhoneNumbers?PageSize=50`,
      creds,
    );
    if (!numbersResponse.ok) continue;

    const numbersData = await numbersResponse.json();
    const numbers = (numbersData.phone_numbers ?? []) as Array<{ phone_number: string }>;
    if (numbers.some((entry) => entry.phone_number === creds.phoneNumber)) {
      cachedMessagingServiceSid = service.sid;
      return service.sid;
    }
  }

  const phoneNumberSid = await getPhoneNumberSid(creds);

  const createResponse = await twilioFetch('https://messaging.twilio.com/v1/Services', creds, {
    method: 'POST',
    body: new URLSearchParams({ FriendlyName: 'Do The Thing' }),
  });
  if (!createResponse.ok) {
    const text = await createResponse.text();
    throw new Error(`Failed to create Twilio Messaging Service: ${text}`);
  }

  const createData = await createResponse.json();
  const serviceSid = createData.sid as string;

  const attachResponse = await twilioFetch(
    `https://messaging.twilio.com/v1/Services/${serviceSid}/PhoneNumbers`,
    creds,
    {
      method: 'POST',
      body: new URLSearchParams({ PhoneNumberSid: phoneNumberSid }),
    },
  );
  if (!attachResponse.ok) {
    const text = await attachResponse.text();
    throw new Error(`Failed to attach phone number to Messaging Service: ${text}`);
  }

  cachedMessagingServiceSid = serviceSid;
  return serviceSid;
}

/** Resolve SendAt for Twilio, never in the past and at least 15 minutes out. */
export function resolveSendAtIso(deadlineAtIso: string, now = new Date()): string {
  const deadlineMs = new Date(deadlineAtIso).getTime();
  const nowMs = now.getTime();
  const minMs = nowMs + TWILIO_MIN_SCHEDULE_MS;

  if (Number.isNaN(deadlineMs) || deadlineMs <= nowMs) {
    return new Date(minMs).toISOString();
  }

  if (deadlineMs < minMs) {
    return new Date(minMs).toISOString();
  }

  return new Date(deadlineMs).toISOString();
}

export function replaceNameToken(template: string, name: string): string {
  return template.replaceAll('{name}', name);
}

export async function scheduleTwilioMessage(
  creds: TwilioCredentials,
  to: string,
  body: string,
  sendAtIso: string,
): Promise<string> {
  const messagingServiceSid = await getMessagingServiceSid(creds);

  const response = await twilioFetch(
    `https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}/Messages.json`,
    creds,
    {
      method: 'POST',
      body: new URLSearchParams({
        To: to,
        Body: body,
        MessagingServiceSid: messagingServiceSid,
        ScheduleType: 'fixed',
        SendAt: sendAtIso,
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Twilio schedule failed: ${text}`);
  }

  const data = await response.json();
  const sid = data.sid as string | undefined;
  if (!sid) {
    throw new Error('Twilio schedule response missing message SID');
  }

  return sid;
}

export type CancelTwilioResult = 'canceled' | 'already_sent' | 'not_found';

export async function cancelTwilioMessage(
  creds: TwilioCredentials,
  messageSid: string,
): Promise<CancelTwilioResult> {
  const fetchResponse = await twilioFetch(
    `https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}/Messages/${messageSid}.json`,
    creds,
  );

  if (fetchResponse.status === 404) {
    return 'not_found';
  }

  if (fetchResponse.ok) {
    const message = await fetchResponse.json();
    const status = (message.status as string | undefined)?.toLowerCase();

    if (status && status !== 'scheduled' && status !== 'queued') {
      return 'already_sent';
    }
  }

  const cancelResponse = await twilioFetch(
    `https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}/Messages/${messageSid}.json`,
    creds,
    {
      method: 'POST',
      body: new URLSearchParams({ Status: 'canceled' }),
    },
  );

  if (cancelResponse.ok) {
    return 'canceled';
  }

  const text = await cancelResponse.text();
  const lower = text.toLowerCase();

  if (
    cancelResponse.status === 404 ||
    lower.includes('not found') ||
    lower.includes('already') ||
    lower.includes('sent') ||
    lower.includes('delivered')
  ) {
    console.warn(`[cancel-sms] Twilio cancel treated as already sent for ${messageSid}: ${text}`);
    return 'already_sent';
  }

  throw new Error(`Twilio cancel failed: ${text}`);
}

const { google } = require('googleapis');

/**
 * GMAIL TOOLS Implementation
 */

async function listMessages(auth, { query = '', maxResults = 10 }) {
  const gmail = google.gmail({ version: 'v1', auth });
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults
  });

  if (!res.data.messages) return [];

  const messages = await Promise.all(
    res.data.messages.map(m => getMessage(auth, { messageId: m.id }))
  );

  return messages;
}

async function getMessage(auth, { messageId }) {
  const gmail = google.gmail({ version: 'v1', auth });
  const res = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full'
  });

  const headers = res.data.payload.headers;
  const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
  const from = headers.find(h => h.name === 'From')?.value || '(Unknown Sender)';
  const date = headers.find(h => h.name === 'Date')?.value || '';

  // Simple snippet for body, real parsing is complex but snippet is usually enough for AI
  return {
    id: res.data.id,
    from,
    subject,
    date,
    snippet: res.data.snippet
  };
}

async function sendEmail(auth, { to, subject, body }) {
  const gmail = google.gmail({ version: 'v1', auth });
  
  // RFC 2822 format simplified
  const rawEmail = [
    `To: ${to}`,
    `Subject: ${subject}`,
    '',
    body
  ].join('\n');

  const encodedEmail = Buffer.from(rawEmail)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedEmail
    }
  });

  return { success: true, messageId: res.data.id };
}

module.exports = { listMessages, getMessage, sendEmail };

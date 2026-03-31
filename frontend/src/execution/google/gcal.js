const { google } = require('googleapis');

/**
 * GCAL TOOLS Implementation
 */

async function listEvents(auth, { calendarId = 'primary', timeMin, timeMax, maxResults = 10 }) {
  const calendar = google.calendar({ version: 'v3', auth });
  
  const res = await calendar.events.list({
    calendarId,
    timeMin: timeMin || new Date().toISOString(),
    timeMax,
    maxResults,
    singleEvents: true,
    orderBy: 'startTime'
  });

  return res.data.items.map(event => ({
    id: event.id,
    summary: event.summary,
    description: event.description,
    status: event.status,
    start: event.start.dateTime || event.start.date,
    end: event.end.dateTime || event.end.date,
    location: event.location
  }));
}

async function createEvent(auth, { calendarId = 'primary', summary, description, start, end, location }) {
  const calendar = google.calendar({ version: 'v3', auth });
  
  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary,
      description,
      location,
      start: { dateTime: start },
      end: { dateTime: end }
    }
  });

  return { success: true, eventId: res.data.id, link: res.data.htmlLink };
}

module.exports = { listEvents, createEvent };

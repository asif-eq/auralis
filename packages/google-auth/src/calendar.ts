import { google } from 'googleapis';
import { createOAuthClient } from './client.js';

export async function listUpcomingEvents(tokens: any) {
  const client = createOAuthClient();
  client.setCredentials(tokens);

  const calendar = google.calendar({ version: 'v3', auth: client });

  const res = await calendar.events.list({
    calendarId: 'primary',
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime'
  });

  return res.data.items || [];
}

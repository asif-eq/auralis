// packages/google-utils/src/cleanGoogleEvent.ts


import { calendar_v3 } from 'googleapis';

/**
 * Takes a Google Calendar event and returns a simplified, readable object
 */
export function cleanGoogleEvent(event: calendar_v3.Schema$Event) {
  return {
    id: event.id,
    summary: event.summary || '',
    description: event.description || '',
    location: event.location || '',
    start: event.start?.dateTime || event.start?.date || '',
    end: event.end?.dateTime || event.end?.date || '',
    htmlLink: event.htmlLink || ''
  };
}

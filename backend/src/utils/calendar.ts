/**
 * Calendar Utility
 * Generates ICS calendar files for email attachments
 *
 * @module utils/calendar
 */

import { v4 as uuidv4 } from 'uuid';

interface CalendarEventData {
  title: string;
  description: string;
  location: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  durationMinutes: number;
  organizerName: string;
  organizerEmail: string;
  attendeeName?: string;
  attendeeEmail?: string;
}

/**
 * Generate an ICS calendar file content
 */
export function generateICSFile(data: CalendarEventData): string {
  const uid = uuidv4();
  const now = new Date();
  const dtstamp = formatDateTimeUTC(now);

  // Parse start date and time
  const [year, month, day] = data.startDate.split('-').map(Number);
  const [hours, minutes] = data.startTime.split(':').map(Number);

  // Create start date in local time (EST - Eastern Standard Time)
  const startDate = new Date(year, month - 1, day, hours, minutes, 0);
  const endDate = new Date(startDate.getTime() + data.durationMinutes * 60 * 1000);

  // Format for ICS (using local time with timezone)
  const dtstart = formatDateTimeLocal(startDate);
  const dtend = formatDateTimeLocal(endDate);

  // Escape special characters in text fields
  const escapedTitle = escapeICSText(data.title);
  const escapedDescription = escapeICSText(data.description);
  const escapedLocation = escapeICSText(data.location);

  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Serenity Care Partners//HR System//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VTIMEZONE
TZID:America/New_York
BEGIN:STANDARD
DTSTART:19701101T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
TZOFFSETFROM:-0400
TZOFFSETTO:-0500
TZNAME:EST
END:STANDARD
BEGIN:DAYLIGHT
DTSTART:19700308T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
TZOFFSETFROM:-0500
TZOFFSETTO:-0400
TZNAME:EDT
END:DAYLIGHT
END:VTIMEZONE
BEGIN:VEVENT
UID:${uid}@serenitycarepartners.com
DTSTAMP:${dtstamp}
DTSTART;TZID=America/New_York:${dtstart}
DTEND;TZID=America/New_York:${dtend}
SUMMARY:${escapedTitle}
DESCRIPTION:${escapedDescription}
LOCATION:${escapedLocation}
ORGANIZER;CN=${escapeICSText(data.organizerName)}:mailto:${data.organizerEmail}`;

  // Add attendee if provided
  if (data.attendeeEmail) {
    icsContent += `
ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${escapeICSText(data.attendeeName || data.attendeeEmail)}:mailto:${data.attendeeEmail}`;
  }

  icsContent += `
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT30M
ACTION:DISPLAY
DESCRIPTION:Reminder: ${escapedTitle}
END:VALARM
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Reminder: ${escapedTitle} tomorrow
END:VALARM
END:VEVENT
END:VCALENDAR`;

  return icsContent;
}

/**
 * Format date for UTC (YYYYMMDDTHHMMSSZ)
 */
function formatDateTimeUTC(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Format date for local time (YYYYMMDDTHHMMSS)
 */
function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Escape special characters for ICS format
 */
function escapeICSText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

/**
 * Generate interview calendar event
 */
export function generateInterviewCalendarEvent(data: {
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  interviewType: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  location: string;
  interviewerName: string;
  notes?: string;
}): string {
  const interviewTypeLabels: Record<string, string> = {
    'phone': 'Phone Screen',
    'video': 'Video Interview',
    'in_person': 'In-Person Interview',
    'panel': 'Panel Interview',
    'working': 'Working Interview / Job Shadow',
    'final': 'Final Interview'
  };

  const typeLabel = interviewTypeLabels[data.interviewType] || data.interviewType;

  const description = `Interview for ${data.jobTitle} position at Serenity Care Partners

Candidate: ${data.applicantName}
Interview Type: ${typeLabel}
Interviewer: ${data.interviewerName}
Duration: ${data.duration} minutes

${data.notes ? `Notes: ${data.notes}` : ''}

Contact HR: hr@serenitycarepartners.com | (513) 400-5113`;

  return generateICSFile({
    title: `Interview: ${data.applicantName} - ${data.jobTitle}`,
    description,
    location: data.location,
    startDate: data.scheduledDate,
    startTime: data.scheduledTime,
    durationMinutes: data.duration,
    organizerName: 'Serenity Care Partners HR',
    organizerEmail: 'hr@serenitycarepartners.com',
    attendeeName: data.applicantName,
    attendeeEmail: data.applicantEmail
  });
}

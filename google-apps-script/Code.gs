/**
 * Olivia & Alexander — Wedding RSVP backend
 *
 * SETUP:
 * 1. Create a new project at https://script.google.com/
 * 2. Replace Code.gs with this entire file.
 * 3. Run setupRsvpSheet() once and approve the requested Google permissions.
 *    It creates a "Wedding RSVP Responses" spreadsheet and saves its ID.
 * 4. Deploy > New deployment > Web app.
 *    Execute as: Me
 *    Who has access: Anyone
 * 5. Copy the Web app URL ending in /exec into RSVP_ENDPOINT in script.js.
 * 6. Commit the updated script.js to GitHub.
 */

function setupRsvpSheet() {
  const props = PropertiesService.getScriptProperties();
  let spreadsheetId = props.getProperty('RSVP_SHEET_ID');
  let spreadsheet;

  if (spreadsheetId) {
    spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  } else {
    spreadsheet = SpreadsheetApp.create('Wedding RSVP Responses');
    spreadsheetId = spreadsheet.getId();
    props.setProperty('RSVP_SHEET_ID', spreadsheetId);
  }

  let sheet = spreadsheet.getSheetByName('Responses');
  if (!sheet) sheet = spreadsheet.insertSheet('Responses');

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Submitted At',
      'Guest Name',
      'Attendance',
      'Number of Guests',
      'Message',
      'Wedding'
    ]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
    sheet.autoResizeColumns(1, 6);
  }

  Logger.log('Your RSVP spreadsheet: ' + spreadsheet.getUrl());
  return spreadsheet.getUrl();
}

function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents;
    if (!raw) throw new Error('No RSVP data received.');

    const data = JSON.parse(raw);
    const name = cleanCell(data.name, 100);
    const attendance = String(data.attendance || '');
    const guests = Number(data.guests);
    const message = cleanCell(data.message, 1000);
    const eventName = 'Olivia & Alexander — December 12, 2026';

    if (!name) throw new Error('Guest name is required.');
    if (!['Joyfully accepts', 'Regretfully declines'].includes(attendance)) {
      throw new Error('Please select an attendance response.');
    }
    if (!Number.isInteger(guests) || guests < 1 || guests > 8) {
      throw new Error('Guest count must be between 1 and 8.');
    }

    const spreadsheetId = PropertiesService.getScriptProperties()
      .getProperty('RSVP_SHEET_ID');
    if (!spreadsheetId) throw new Error('Run setupRsvpSheet() before deploying.');

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName('Responses');
      if (!sheet) throw new Error('Responses sheet was not found.');
      sheet.appendRow([
        new Date(),
        name,
        attendance,
        guests,
        message,
        eventName
      ]);
    } finally {
      lock.releaseLock();
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ success: false, error: String(error.message || error) });
  }
}

function cleanCell(value, maxLength) {
  let text = String(value || '').trim().slice(0, maxLength);
  // Prevent user-submitted text from being interpreted as a spreadsheet formula.
  if (/^[=+@]/.test(text) || /^-/.test(text)) text = "'" + text;
  return text;
}

function jsonResponse(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

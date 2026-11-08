# Connect the wedding RSVP form to Google Sheets

The website is prepared to submit RSVP responses to a Google Sheet. Complete this one-time setup:

1. Open [Google Apps Script](https://script.google.com/) and create a **New project**.
2. Replace the contents of `Code.gs` with the code in [google-apps-script/Code.gs](google-apps-script/Code.gs).
3. Select `setupRsvpSheet` from the function dropdown and click **Run**. Approve Google's permission prompt. This creates a spreadsheet named **Wedding RSVP Responses**. Find its URL under **Execution log**.
4. Click **Deploy → New deployment**. Choose **Web app**.
5. Set **Execute as** to **Me** and **Who has access** to **Anyone**, then click **Deploy** and authorize if asked.
6. Copy the Web app URL ending in `/exec`.
7. Open `script.js` in this repository and replace `PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE` with that URL. Commit the change to `main`.

After setup, guest responses will appear in the **Responses** tab of the spreadsheet, with submission date, name, attendance, guest count, and message.

**Important:** Anyone with the public wedding invitation can submit an RSVP. Keep the spreadsheet private; only share it with the couple. If you edit the Apps Script after deployment, deploy a new version of the web app.

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { google } = require("googleapis");
const cors = require("cors");
const dotenv = require("dotenv");

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

admin.initializeApp();

const allowedOrigins = [
  "http://localhost:3000"
];

const clientEmail = process.env.FIREBASE_CONFIG_google_client_email || process.env.CLIENT_EMAIL;
const privateKey = (process.env.FIREBASE_CONFIG_google_private_key || process.env.PRIVATE_KEY).replace(/\\n/g, "\n");
const spreadsheetId = process.env.FIREBASE_CONFIG_google_spreadsheet_id || process.env.SPREADSHEET_ID;

exports.syncToGoogleSheet = functions.https.onRequest((req, res) => {
  const corsMiddleware = cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  });

  corsMiddleware(req, res, async () => {
    if (!clientEmail || !privateKey || !spreadsheetId) {
      console.error("Missing environment variables");
      res.status(400).send({ error: "Missing environment variables" });
      return;
    }

    const events = req.body.data.events.sort((event, nextEvent) => {
      return +new Date(event.startTime) - new Date(nextEvent.startTime);
    });

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    try {
      const values = [
        ["title", "description", "type", "website", "startDateTime", "endDateTime", "location", "endLocation", "guests", "eventId"],
        ...events.map((event) => [
          event.title,
          event.description,
          event.type,
          event.website,
          formatDateTime(event.startTime),
          formatDateTime(event.endTime),
          event.address === "" ? "" : event.address,
          event.endAddress === "" ? "" : event.endAddress,
          !event.guests || event.guests.length === 0 ? "" : event.guests.join(", "),
          event.id,
        ]),
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: "events!A1:J",
        valueInputOption: "RAW",
        resource: {
          values,
        },
      });

      res.status(200).send({ success: true });
    } catch (error) {
      console.error("Error syncing data:", error);
      res.status(500).send({ error: "Error syncing data" });
    }
  });
});

function formatDateTime(date) {
  if (!date) return "";
  const d = new Date(new Date(date) - 3 * 60 * 60 * 1000);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
}

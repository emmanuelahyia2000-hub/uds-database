const { google } = require("googleapis");

module.exports = async function handler(req, res) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });

    const drive = google.drive({
      version: "v3",
      auth,
    });

    const response = await drive.files.list({
      q: `'${process.env.GOOGLE_DRIVE_FOLDER_ID}' in parents`,
      fields: "files(id,name,mimeType,webViewLink)",
    });

    res.status(200).json(response.data.files);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message,
    });
  }
}
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({
      version: 'v3',
      auth,
    });

    // Undergraduate is the existing working archive.
    // Postgraduate uses the new Google Drive folder.
    const isPostgrad = req.query.archive === 'postgraduate';

    const targetFolderId = isPostgrad
      ? process.env.GOOGLE_DRIVE_POSTGRADUATE_FOLDER_ID
      : process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!targetFolderId) {
      return res.status(500).json({
        error: isPostgrad
          ? 'Postgraduate Google Drive folder ID is not configured'
          : 'Undergraduate Google Drive folder ID is not configured',
      });
    }

    const response = await drive.files.list({
      q: `'${targetFolderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, webViewLink, thumbnailLink)',
      orderBy: 'name',
      pageSize: 1000,
    });

    return res.status(200).json(response.data.files || []);

  } catch (error) {
    console.error('Drive API Error:', error);

    return res.status(500).json({
      error: 'Failed to fetch files securely from Google Drive',
    });
  }
}
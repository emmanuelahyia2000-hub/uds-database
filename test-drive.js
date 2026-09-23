const { google } = require("googleapis");

const auth = new google.auth.GoogleAuth({
  keyFile: "./uds-database-7703714391dd.json", // your actual filename
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});

async function listFiles() {
  const drive = google.drive({
    version: "v3",
    auth,
  });

 const folderId = "1GSGdZWH2aPJYEcvHIZPokK_oTq4Afyj9";

  const response = await drive.files.list({
    q: `'${folderId}' in parents`,
    fields: "files(id,name,mimeType)",
  });

  console.log("Files found:");
  console.log(response.data.files);
}

listFiles().catch(console.error);
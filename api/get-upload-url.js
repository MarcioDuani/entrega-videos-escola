// api/get-upload-url.js
// Gera uma URL de upload resumível no Google Drive via Service Account.
// O vídeo é enviado diretamente do browser do aluno para o Drive — sem passar pelo servidor.

const { google } = require('googleapis');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { filename, mimetype, studentName, turma, titulo } = req.body;

    if (!filename || !mimetype || !studentName || !turma || !titulo) {
      return res.status(400).json({ error: 'Dados incompletos.' });
    }

    // Decodifica credenciais do Service Account
    const credentials = JSON.parse(
      Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf8')
    );

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const client = await auth.getClient();
    const tokenObj = await client.getAccessToken();
    const accessToken = tokenObj.token;

    // Monta nome seguro do arquivo no Drive
    const sanitize = (s) => s.replace(/[<>:"/\\|?*\r\n]/g, '_').trim();
    const ext = filename.split('.').pop() || 'mp4';
    const safeName = `${sanitize(turma)} - ${sanitize(studentName)} - ${sanitize(titulo)}.${ext}`;

    // Cria sessão de upload resumível
    const initRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': mimetype,
        },
        body: JSON.stringify({
          name: safeName,
          parents: [process.env.DRIVE_FOLDER_ID],
        }),
      }
    );

    if (!initRes.ok) {
      const errText = await initRes.text();
      console.error('Drive API error:', errText);
      return res.status(500).json({ error: 'Falha ao iniciar sessão de upload no Drive.' });
    }

    const uploadUrl = initRes.headers.get('location');
    if (!uploadUrl) {
      return res.status(500).json({ error: 'URL de upload não retornada pelo Drive.' });
    }

    return res.status(200).json({ uploadUrl });
  } catch (err) {
    console.error('get-upload-url error:', err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

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

    // Configura credenciais OAuth2
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'http://localhost:3000/oauth2callback'
    );
    oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

    // Resgata o Token de Acesso usando o Refresh Token
    const tokenObj = await oAuth2Client.getAccessToken();
    const accessToken = tokenObj.token;

    // Monta nome seguro do arquivo no Drive
    const sanitize = (s) => s.replace(/[<>:"/\\|?*\r\n]/g, '_').trim();
    const ext = filename.split('.').pop() || 'mp4';
    const safeName = `${sanitize(turma)} - ${sanitize(studentName)} - ${sanitize(titulo)}.${ext}`;

    // Pega a URL de origem do cliente (ex: https://entrega-npc-portugues.vercel.app)
    const clientOrigin = req.headers.origin || 'https://entrega-npc-portugues.vercel.app';

    // Cria sessão de upload resumível
    const initRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': mimetype,
          'Origin': clientOrigin, // <-- CRÍTICO: Avisa ao Google para liberar o CORS no PUT
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

    // Retorna a URL e o Token para que o frontend consiga permissão explícita no PUT final
    return res.status(200).json({ uploadUrl, accessToken });
  } catch (err) {
    console.error('get-upload-url error:', err);
    return res.status(500).json({ 
      error: 'Erro interno do servidor.', 
      details: err.message || err.toString(),
      stack: err.stack 
    });
  }
};

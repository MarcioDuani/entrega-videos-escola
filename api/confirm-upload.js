// api/confirm-upload.js
// Chamado após o vídeo ser enviado ao Drive.
// Registra a submissão no Google Sheets e envia e-mail de confirmação ao aluno.

const { google } = require('googleapis');
const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { fileId, studentName, turma, titulo, email } = req.body;

        if (!fileId || !studentName || !turma || !titulo || !email) {
            return res.status(400).json({ error: 'Dados incompletos.' });
        }

        // Credenciais do Service Account para acesso ao Sheets
        const credentials = JSON.parse(
            Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf8')
        );

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive.readonly',
            ],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // Timestamp formatado para o Brasil
        const now = new Date();
        const timestamp = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        const driveLink = `https://drive.google.com/file/d/${fileId}/view`;

        // Adiciona linha na Google Sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SHEET_ID,
            range: 'Submissões!A:G',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[timestamp, studentName, turma, titulo, email, driveLink, fileId]],
            },
        });

        // Configura transportador de e-mail
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });

        const professorName = process.env.PROFESSOR_NAME || 'Professora';
        const firstName = studentName.split(' ')[0];

        // E-mail de confirmação ao aluno
        await transporter.sendMail({
            from: `"${professorName}" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: `✓ Trabalho Entregue — ${titulo}`,
            html: buildStudentEmail(firstName, studentName, turma, titulo, timestamp, professorName),
        });

        // Notificação para a professora
        if (process.env.PROFESSOR_EMAIL) {
            await transporter.sendMail({
                from: `"Sistema de Entregas" <${process.env.GMAIL_USER}>`,
                to: process.env.PROFESSOR_EMAIL,
                subject: `📥 Nova Entrega: ${studentName} — ${turma}`,
                html: buildProfessorEmail(studentName, turma, titulo, email, timestamp, driveLink),
            });
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('confirm-upload error:', err);
        return res.status(500).json({ error: 'Erro ao confirmar entrega.' });
    }
};

// ─── Templates de E-mail ──────────────────────────────────────────────────────

function buildStudentEmail(firstName, fullName, turma, titulo, timestamp, professorName) {
    return `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Georgia',serif;">
  <div style="max-width:580px;margin:40px auto;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.12);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a3d2b,#2d6a4f);padding:48px 40px;text-align:center;">
      <div style="width:64px;height:64px;background:rgba(201,168,76,0.2);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
        <span style="font-size:28px;">✓</span>
      </div>
      <h1 style="color:#c9a84c;font-size:24px;margin:0;font-weight:700;letter-spacing:-0.5px;">Trabalho Entregue!</h1>
      <p style="color:rgba(255,255,255,0.75);margin:8px 0 0;font-size:14px;">Confirmação de recebimento</p>
    </div>

    <!-- Body -->
    <div style="background:#ffffff;padding:40px;">
      <p style="color:#2c2c2c;font-size:16px;margin:0 0 16px;">Olá, <strong>${firstName}</strong>! 👋</p>
      <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 28px;">
        Seu trabalho foi recebido com sucesso. Guarde este e-mail como comprovante de entrega.
      </p>

      <!-- Detalhes -->
      <div style="background:#f5f0e8;border-radius:12px;padding:24px;margin-bottom:28px;">
        <h3 style="color:#1a3d2b;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">Detalhes da Entrega</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#888;font-size:14px;width:40%;">Aluno(a)</td><td style="padding:8px 0;color:#2c2c2c;font-size:14px;font-weight:600;">${fullName}</td></tr>
          <tr style="border-top:1px solid #ede7d9;"><td style="padding:8px 0;color:#888;font-size:14px;">Turma</td><td style="padding:8px 0;color:#2c2c2c;font-size:14px;font-weight:600;">${turma}</td></tr>
          <tr style="border-top:1px solid #ede7d9;"><td style="padding:8px 0;color:#888;font-size:14px;">Título</td><td style="padding:8px 0;color:#2c2c2c;font-size:14px;font-weight:600;">${titulo}</td></tr>
          <tr style="border-top:1px solid #ede7d9;"><td style="padding:8px 0;color:#888;font-size:14px;">Data e hora</td><td style="padding:8px 0;color:#2c2c2c;font-size:14px;font-weight:600;">${timestamp}</td></tr>
        </table>
      </div>

      <p style="color:#555;font-size:14px;line-height:1.7;margin:0;">
        Em caso de dúvidas, entre em contato com <strong>${professorName}</strong>.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f5f0e8;padding:20px 40px;text-align:center;">
      <p style="color:#aaa;font-size:12px;margin:0;">${professorName} · Sistema de Entrega de Trabalhos</p>
    </div>
  </div>
</body></html>`;
}

function buildProfessorEmail(studentName, turma, titulo, email, timestamp, driveLink) {
    return `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:24px;background:#f5f0e8;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 4px 16px rgba(0,0,0,0.08);">
    <h2 style="color:#1a3d2b;margin:0 0 20px;">📥 Nova Entrega Recebida</h2>
    <table style="width:100%;border-collapse:collapse;font-size:15px;">
      <tr><td style="padding:10px 0;color:#666;width:35%;">Aluno(a)</td><td style="padding:10px 0;font-weight:600;color:#2c2c2c;">${studentName}</td></tr>
      <tr style="border-top:1px solid #eee;"><td style="padding:10px 0;color:#666;">Turma</td><td style="padding:10px 0;font-weight:600;color:#2c2c2c;">${turma}</td></tr>
      <tr style="border-top:1px solid #eee;"><td style="padding:10px 0;color:#666;">Título</td><td style="padding:10px 0;font-weight:600;color:#2c2c2c;">${titulo}</td></tr>
      <tr style="border-top:1px solid #eee;"><td style="padding:10px 0;color:#666;">E-mail</td><td style="padding:10px 0;color:#2c2c2c;">${email}</td></tr>
      <tr style="border-top:1px solid #eee;"><td style="padding:10px 0;color:#666;">Enviado em</td><td style="padding:10px 0;color:#2c2c2c;">${timestamp}</td></tr>
    </table>
    <a href="${driveLink}" style="display:inline-block;margin-top:24px;padding:12px 28px;background:#1a3d2b;color:#c9a84c;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
      ▶ Ver Vídeo no Drive
    </a>
  </div>
</body></html>`;
}

// api/admin/submissions.js
// Retorna todas as submissões da Google Sheet.
// Protegido por senha via Authorization header.
// Se as credenciais do Google forem inválidas (ex: ambiente de teste),
// retorna lista vazia em vez de erro 500.

const { google } = require('googleapis');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    // ── Autenticação por senha (sempre verificada)
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
        return res.status(401).json({ error: 'Não autorizado.' });
    }

    // ── Resposta padrão (dados vazios — usada se o Google Sheets falhar)
    const emptyResponse = {
        total: 0,
        today: 0,
        turmas: {},
        submissions: [],
        _warning: 'Credenciais do Google não configuradas. Configure GOOGLE_CREDENTIALS e SHEET_ID.',
    };

    // ── Tenta buscar dados reais do Google Sheets
    let credentials;
    try {
        credentials = JSON.parse(
            Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf8')
        );
    } catch {
        console.warn('[admin] GOOGLE_CREDENTIALS inválido ou não configurado. Retornando dados vazios.');
        return res.status(200).json(emptyResponse);
    }

    try {
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SHEET_ID,
            range: 'Submissões!A:G',
        });

        const rows = response.data.values || [];

        const data = rows.slice(1).map((row) => ({
            timestamp: row[0] || '',
            studentName: row[1] || '',
            turma: row[2] || '',
            titulo: row[3] || '',
            email: row[4] || '',
            driveLink: row[5] || '',
            fileId: row[6] || '',
        }));

        const today = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        const todayCount = data.filter((s) =>
            s.timestamp.startsWith(today.split('/').reverse().join('/'))
        ).length;

        const turmaCount = data.reduce((acc, s) => {
            acc[s.turma] = (acc[s.turma] || 0) + 1;
            return acc;
        }, {});

        return res.status(200).json({
            total: data.length,
            today: todayCount,
            turmas: turmaCount,
            submissions: data.reverse(),
        });
    } catch (err) {
        console.error('[admin] Erro ao acessar Google Sheets:', err.message);
        // Retorna dados vazios ao invés de erro 500 para não travar o painel
        return res.status(200).json({
            ...emptyResponse,
            _warning: `Erro ao acessar Google Sheets: ${err.message}`,
        });
    }
};

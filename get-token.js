// get-token.js
// Script para gerar o Refresh Token do Google Drive usando OAuth2
const fs = require('fs');
fs.readFileSync('.env', 'utf8').split(/\r?\n/).forEach(line => {
  if (line.trim().startsWith('#')) return;
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
});
const { google } = require('googleapis');
const readline = require('readline');

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/oauth2callback'
);

// Se quiser modificar os acessos no futuro, adicione novas URLs na lista abaixo
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline', // Importante para receber o Refresh Token
  scope: SCOPES,
  prompt: 'consent' // Forca a tela de consentimento para garantir o refresh_token
});

console.log('1. Clique neste link e faca login com a conta do Google que vai salvar os videos:');
console.log('\n', authUrl, '\n');
console.log('2. Apos autorizar, o Google vai tentar redirecionar para uma pagina de "localhost".');
console.log('Ela vai dar a mensagem "Nao e possivel acessar esse site" (ou similar). ISSO E NORMAL!');
console.log('3. Olhe para a barra de enderecos do navegador (URL) e copie TUDO que estiver DEPOIS de "code=" e ANTES de "&scope=" (se houver).');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('\nCole o "code" aqui e aperte ENTER: ', (code) => {
  rl.close();
  oAuth2Client.getToken(decodeURIComponent(code), (err, token) => {
    if (err) {
      return console.error('Erro ao resgatar o token de acesso.', err);
    }
    console.log('\n=== SUCESSO! ===\n');
    const envPath = '.env';
    let envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('GOOGLE_REFRESH_TOKEN=')) {
        envContent = envContent.replace(/GOOGLE_REFRESH_TOKEN=.*/, `GOOGLE_REFRESH_TOKEN=${token.refresh_token}`);
    } else {
        envContent += `\nGOOGLE_REFRESH_TOKEN=${token.refresh_token}\n`;
    }
    fs.writeFileSync(envPath, envContent);
    console.log('✅ O Token foi salvo AUTOMATICAMENTE no seu arquivo .env!');
    console.log('Agora voce ja pode testar o upload do video no site!');
    console.log('\n================');
  });
});

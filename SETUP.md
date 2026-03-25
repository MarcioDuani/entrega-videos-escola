# 🚀 Guia de Configuração — Plataforma de Entrega de Vídeos

## Pré-requisitos

- Conta Google (Gmail da professora)
- Conta no [Vercel](https://vercel.com) (gratuito)
- [Node.js 18+](https://nodejs.org) instalado
- [Git](https://git-scm.com) instalado

---

## Passo 1 — Google Cloud: Criar Credenciais OAuth2

Essa plataforma utiliza o Google Drive da própria conta vinculada para contornar limites de cota de upload de Contas de Serviço (Service Accounts).

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um novo projeto (ex: **"Entregas Portuguesa"**)
3. No menu lateral → **APIs e Serviços → Biblioteca**
4. Ative estas 2 APIs:
   - **Google Drive API**
   - **Google Sheets API**
5. No menu lateral → **Google Auth Platform** (ou Tela de Permissão OAuth)
   - Configure o Público-alvo como "Externo"
   - Preencha o nome do app e o e-mail de suporte.
   - **MUITO IMPORTANTE:** Clique no botão **"Publicar Aplicativo"** (para o token não expirar em 7 dias).
6. Vá em **APIs e Serviços → Credenciais → Criar Credenciais → ID do Cliente OAuth**
7. Escolha "Aplicativo da Web".
8. Em "URIs de redirecionamento autorizados", adicione: `http://localhost:3000/oauth2callback`
9. Clique em **Criar**. Copie o seu **Client ID** e **Client Secret**.

---

## Passo 2 — Google Drive: Pasta de entrega

1. Abra o [Google Drive](https://drive.google.com)
2. Crie uma pasta chamada **"Entregas de Trabalhos"**
3. Abra a pasta → copie o ID extraindo da URL: `drive.google.com/drive/folders/**ESSE_ID_AQUI**`

---

## Passo 3 — Google Sheets: Planilha de log

1. Acesse [sheets.google.com](https://sheets.google.com)
2. Crie uma nova planilha: **"Log de Entregas"**
3. Renomeie a aba para `Submissões`
4. Adicione estes cabeçalhos na linha 1:
   ```
   A1: Timestamp | B1: Nome | C1: Turma | D1: Título | E1: Email | F1: Link Drive | G1: File ID
   ```
5. Copie o ID da URL: `docs.google.com/spreadsheets/d/**ESSE_ID_AQUI**`/edit

---

## Passo 4 — Gmail: App Password para envio de e-mails

1. Acesse [myaccount.google.com/security](https://myaccount.google.com/security)
2. Ative **Verificação em duas etapas** (se ainda não tiver)
3. Pesquise "Senhas de app" → Gerar para **E-mail**, dispositivo **"Outro"** → nome: `Site de Entregas Vercel`
4. Copie a senha de 16 letras gerada (pode remover os espaços se quiser).

---

## Passo 5 — Gerar o Refresh Token (OAuth2)

A aplicação precisa de um token permanente para fazer uploads em nome da conta Google.

1. Faça cópia do `.env.example` para `.env` na raiz do projeto.
2. Preencha o `GOOGLE_CLIENT_ID` e o `GOOGLE_CLIENT_SECRET` (do passo 1) no `.env`.
3. No terminal do projeto no VS Code, rode:
   ```bash
   node get-token.js
   ```
4. O script gerará um link no terminal. Clique nele, faça login com a conta do Google que guardará os vídeos e autorize o app.
5. O navegador tentará redirecionar para um link "localhost" avisando que não pode acessar. Isso é normal!
6. Copie o códgio longo localizado na barra de endereço (a URL da página com erro), tudo que vier depois de `code=` e antes de `&scope`.
7. Cole o código copiado de volta no terminal do VS Code e dê Enter.
8. O script resgatará a autorização final e salvará o `GOOGLE_REFRESH_TOKEN` quase automaticamente no seu arquivo `.env`!

---

## Passo 6 — Deploy no Vercel

O Vercel será as "costas" (backend + frontend) da aplicação.

1. Instale o CLI e faça login:
   ```bash
   npm install -g vercel
   vercel login
   ```
2. Realize o deploy para produção (siga os passos do prompt com "Y"):
   ```bash
   vercel --prod
   ```
3. Registre as chaves na Vercel:
   No painel web da [vercel.com](https://vercel.com) → selecione seu projeto → **Settings → Environment Variables**:

| Nome | Valor |
|---|---|
| `GOOGLE_CLIENT_ID` | (do passo 1) |
| `GOOGLE_CLIENT_SECRET` | (do passo 1) |
| `GOOGLE_REFRESH_TOKEN` | (gerado no passo 5) |
| `DRIVE_FOLDER_ID` | ID da pasta do Drive |
| `SHEET_ID` | ID da Google Sheet |
| `GMAIL_USER` | email remetente que envia mensagens |
| `GMAIL_APP_PASSWORD` | senha de app de 16 caracteres (passo 4) |
| `PROFESSOR_EMAIL` | email que vai receber cópia dos avisos |
| `PROFESSOR_NAME` | Nome do Docente (ex: `Professora Roberta`) |
| `ADMIN_PASSWORD` | senha super forte para visualizar tela /admin |

*(Após inserir as variáveis, faça um **Redeploy** na dashboard de Deployments ou suba nova versão do código para as chaves entrarem em vigor na Vercel).*

---

## Passo 7 — Testes Finais e Acessos

| Dashboard | URL |
|---|---|
| Página de Envio pros Alunos | `https://seu-projeto.vercel.app/` |
| Painel Admin Protegido | `https://seu-projeto.vercel.app/admin` |

*(Lembre-se de configurar um Domínio Personalizado, se desejar, na aba Domains da Vercel!)*

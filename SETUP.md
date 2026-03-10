# 🚀 Guia de Configuração — Plataforma de Entrega de Vídeos

## Pré-requisitos

- Conta Google (Gmail da professora)
- Conta no [Vercel](https://vercel.com) (gratuito)
- [Node.js 18+](https://nodejs.org) instalado
- [Git](https://git-scm.com) instalado

---

## Passo 1 — Google Cloud: Criar Service Account

> A Service Account é uma "conta robô" que faz o upload no Drive da professora.

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um novo projeto (ex: **"Entregas Portuguesa"**)
3. No menu lateral → **APIs e Serviços → Biblioteca**
4. Ative estas 2 APIs:
   - **Google Drive API**
   - **Google Sheets API**
5. Vá em **APIs e Serviços → Credenciais → Criar Credenciais → Conta de Serviço**
6. Nome: `entrega-videos` → clique em **Criar**
7. Na tela seguinte, clique na conta criada → aba **Chaves → Adicionar Chave → JSON**
8. Salve o arquivo `.json` — você vai precisar dele

---

## Passo 2 — Google Drive: Pasta de entrega

1. Abra o [Google Drive](https://drive.google.com) **da professora**
2. Crie uma pasta chamada **"Entregas de Trabalhos"**
3. Clique com botão direito na pasta → **Compartilhar**
4. Cole o e-mail do Service Account (parece com `xxxx@xxxx.iam.gserviceaccount.com`)
5. Permissão: **Editor** → Confirmar
6. Abra a pasta → copie o ID da URL: `drive.google.com/drive/folders/**ESSE_ID_AQUI**`

---

## Passo 3 — Google Sheets: Planilha de log

1. Acesse [sheets.google.com](https://sheets.google.com) com a conta da professora
2. Crie uma nova planilha: **"Log de Entregas"**
3. Renomeie a aba para `Submissões`
4. Adicione estes cabeçalhos na linha 1:
   ```
   A1: Timestamp | B1: Nome | C1: Turma | D1: Título | E1: Email | F1: Link Drive | G1: File ID
   ```
5. Compartilhe a planilha com o e-mail do Service Account (permissão **Editor**)
6. Copie o ID da URL: `docs.google.com/spreadsheets/d/**ESSE_ID_AQUI**`

---

## Passo 4 — Gmail: App Password para envio de e-mails

1. Acesse [myaccount.google.com/security](https://myaccount.google.com/security)
2. Ative **Verificação em duas etapas** (se ainda não tiver)
3. Pesquise "Senhas de app" → Gerar para **"Outro"** → nome: `Entregas`
4. Copie a senha de 16 caracteres gerada

---

## Passo 5 — Codificar credenciais em Base64

No terminal (PowerShell ou cmd), execute:

```powershell
# Windows PowerShell
$json = Get-Content "caminho\para\service-account.json" -Raw
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($json))
```

Copie tudo que aparecer — esse é o valor de `GOOGLE_CREDENTIALS`.

---

## Passo 6 — Deploy no Vercel

### 6.1 — Instalar Vercel CLI

```bash
npm install -g vercel
```

### 6.2 — Navegar até a pasta do projeto

```bash
cd "C:\Users\marci\Desktop\RobertaHomePage"
npm install
```

### 6.3 — Fazer login no Vercel

```bash
vercel login
```

### 6.4 — Deploy

```bash
vercel --prod
```

Quando perguntar:
- **Set up and deploy?** → `Y`
- **Which scope?** → sua conta
- **Link to existing project?** → `N`
- **Project name?** → `entregas-portugues` (ou o que quiser)
- **Directory?** → `./ ` (confirme com Enter)

### 6.5 — Configurar variáveis de ambiente

No painel do Vercel ([vercel.com](https://vercel.com)) → seu projeto → **Settings → Environment Variables**:

| Nome | Valor |
|---|---|
| `GOOGLE_CREDENTIALS` | (string base64 do passo 5) |
| `DRIVE_FOLDER_ID` | ID da pasta do Drive |
| `SHEET_ID` | ID da Google Sheet |
| `GMAIL_USER` | email da professora |
| `GMAIL_APP_PASSWORD` | senha de app de 16 dígitos |
| `PROFESSOR_EMAIL` | email da professora (para notificações) |
| `PROFESSOR_NAME` | Ex: `Professora Roberta` |
| `ADMIN_PASSWORD` | senha forte para o painel |

### 6.6 — Re-deploy para aplicar variáveis

```bash
vercel --prod
```

---

## Passo 7 — Testar

| O que testar | URL |
|---|---|
| Página do aluno | `https://seu-projeto.vercel.app/` |
| Painel da professora | `https://seu-projeto.vercel.app/admin` |

---

## URL personalizada (grátis)

No painel Vercel → **Settings → Domains** → você pode alterar o subdomínio para algo como:
`entrega-portugues.vercel.app` ✅

---

## Testes locais (opcional)

```bash
# Crie o arquivo .env com base no .env.example
cp .env.example .env
# Edite o .env com seus valores reais

# Instale Vercel CLI
npm i -g vercel

# Rode localmente
vercel dev
```

Acesse: `http://localhost:3000`

# StudyForge - Cadernos de Questões & Mapeamento de Estudos com IA

O **StudyForge** é uma plataforma avançada para organização de estudos, criação de cadernos de questões, resolução de simulados e análise de desempenho com o auxílio de Inteligência Artificial (Google Gemini).

O projeto possui arquitetura **offline-first** (usando IndexedDB localmente para acesso ultrarrápido sem dependência contínua de rede) com sincronização em nuvem via **Firebase Firestore** e **Firebase Authentication**.

---

## 🚀 Funcionalidades Principais

- 📚 **Cadernos de Questões e Pastas**: Agrupamento por disciplinas, bancas ou assuntos.
- ⚡ **Estruturação de Provas por IA**: Cole textos de provas inteiras e a IA organiza os enunciados e alternativas automaticamente.
- 🎯 **Gerador de Questões Inéditas**: Criação de questões direcionadas por tema, banca e nível de dificuldade.
- 🧠 **Mapas Mentais Automáticos**: A IA sintetiza explicações em esquemas visuais e interativos.
- 🔍 **Explicações Aprofundadas**: Análises minuciosas com fundamentação legal e doutrinária (usando busca web grounding).
- 📊 **Estatísticas de Desempenho**: Gráficos de precisão, histórico de simulados e acompanhamento de cadernos de erros.
- 🔄 **Sincronização Nuvem + Offline**: Autenticação com e-mail/senha ou Google, com suporte a salvamento local e backup em nuvem.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, Recharts, Motion.
- **Backend / API**: Node.js, Express, Vite Middleware.
- **Inteligência Artificial**: Google GenAI SDK (`@google/genai`) com modelo `gemini-3.6-flash`.
- **Autenticação e Nuvem**: Firebase Auth & Firestore (com regras de segurança por usuário).
- **Armazenamento Local**: IndexedDB via biblioteca `idb`.

---

## 📦 Como Executar Localmente

### 1. Pré-requisitos
- Node.js versão 18 ou superior.
- Conta no [Firebase Console](https://console.firebase.google.com/) e chave de API do [Google AI Studio](https://aistudio.google.com/).

### 2. Instalação
Clone o repositório e instale as dependências:

```bash
git clone https://github.com/seu-usuario/studyforge.git
cd studyforge
npm install
```

### 3. Configuração de Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto baseado no arquivo `.env.example`:

```bash
cp .env.example .env
```

Preencha as variáveis no seu `.env`:

```env
# Chave de API do Google Gemini (Servidor)
GEMINI_API_KEY="sua-chave-gemini-aqui"

# URL da Aplicação
APP_URL="http://localhost:3000"

# Credenciais do Firebase (Cliente)
VITE_FIREBASE_API_KEY="sua-firebase-api-key"
VITE_FIREBASE_AUTH_DOMAIN="seu-projeto.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="seu-projeto-id"
VITE_FIREBASE_APP_ID="seu-app-id"
VITE_FIREBASE_FIRESTORE_DATABASE_ID=""
```

### 4. Executando em Modo de Desenvolvimento

```bash
npm run dev
```

Acesse a aplicação em `http://localhost:3000`.

### 5. Build e Produção

```bash
npm run build
npm start
```

---

## 🛡️ Regras de Segurança do Firestore

Caso vá utilizar o Firebase Firestore, aplique as regras presentes em `firestore.rules` no seu painel do Firebase:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

Isso garante isolamento total: cada usuário logado pode acessar e modificar estritamente os seus próprios cadernos, questões e históricos de resposta.

---

## 📄 Licença

Este projeto está licenciado sob a licença MIT.

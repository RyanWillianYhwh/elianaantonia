# Painel Saiyajin

Site estático servido por Express, com um chat integrado à API da Groq. A chave da API permanece exclusivamente no servidor.

## Requisitos

- Node.js 20 ou superior
- Uma chave da API da Groq

## Instalação e configuração

```bash
npm install
Copy-Item .env.example .env
```

Edite o arquivo `.env` e defina `GROQ_API_KEY`. Opcionalmente, defina `GROQ_MODEL`; o padrão é `qwen/qwen3.8-27b`.

## Execução

```bash
npm start
```

Para desenvolvimento com reinício automático:

```bash
npm run dev
```

Abra `http://localhost:3000`. Não abra o `index.html` diretamente, pois o chat e o formulário usam endpoints do servidor.

## Endpoints

- `POST /chat`: recebe a mensagem e o histórico limitado do navegador; valida a entrada e solicita uma resposta à Groq.
- `POST /contact`: valida e recebe a mensagem de contato. Para entrega por e-mail em produção, conecte este endpoint a um provedor transacional usando credenciais de ambiente.

## Segurança

O projeto usa Helmet, limite de taxa, limites de corpo e de mensagens, validação e normalização de entradas. Nunca publique o `.env` ou a chave da Groq.

## Deploy

Em qualquer plataforma, configure `GROQ_API_KEY` (e, se necessário, `GROQ_MODEL`, `PORT` e `ALLOWED_ORIGIN`) como variável de ambiente — não no código.

- **Render:** crie um Web Service, conecte o repositório, use `npm install` como build command e `npm start` como start command.
- **Railway:** crie um projeto a partir do repositório; Railway detecta Node.js. Adicione as variáveis no painel e publique.
- **Vercel:** este projeto é um servidor Express persistente; prefira Render ou Railway. Para Vercel, converta `server.js` em uma função serverless antes do deploy.
- **Hostinger:** use uma hospedagem Node.js, envie o projeto sem `node_modules`, execute `npm install` no servidor, defina as variáveis no painel e inicie com `npm start`.

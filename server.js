import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import Groq from 'groq-sdk';

const app = express();
const port = Number(process.env.PORT) || 3000;
const client = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const MAX_MESSAGE_LENGTH = 2000;
const SYSTEM_PROMPT = `Você é a assistente virtual informativa de Eliana, psicanalista. Responda somente em português brasileiro, em no máximo 2 frases e até 55 palavras. Sua única função é explicar, de forma geral, psicanálise, sessões, atendimento e formas de contato. Nunca realize diagnóstico, avaliação, interpretação clínica, relatório, tratamento, prescrição ou qualquer trabalho que pertença à psicanalista; nunca invente informações nem afirme possuir formação clínica. Para qualquer tema fora de psicanálise, atendimento ou contato, responda somente: "Opa, você não deveria procurar aqui! Contate-nos." Não inclua convite para falar com Eliana: o sistema o acrescentará.`;

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc:["'self'"], scriptSrc:["'self'"], styleSrc:["'self'"], imgSrc:["'self'", 'data:', 'https://picsum.photos'], connectSrc:["'self'"] } } }));
app.use(cors({ origin: process.env.ALLOWED_ORIGIN ? process.env.ALLOWED_ORIGIN.split(',') : false }));
app.use(express.json({ limit: '16kb', strict: true }));
app.use(express.static('.', { extensions: ['html'], maxAge: '1h' }));

const chatLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Muitas solicitações. Tente novamente em alguns minutos.' } });
const contactLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Muitas mensagens. Tente novamente mais tarde.' } });

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.normalize('NFKC').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, maxLength) : '';
}
function limitWords(value, maxWords) { return value.split(/\s+/).filter(Boolean).slice(0, maxWords).join(' '); }
function validHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.slice(-10).flatMap((item) => {
    if (!item || !['user', 'assistant'].includes(item.role)) return [];
    const content = cleanText(item.content, MAX_MESSAGE_LENGTH);
    return content ? [{ role:item.role, content }] : [];
  });
}

app.post('/chat', chatLimiter, async (request, response, next) => {
  const message = cleanText(request.body?.message, MAX_MESSAGE_LENGTH);
  if (!message) return response.status(400).json({ error: 'Envie uma mensagem válida.' });
  if (!client) return response.status(503).json({ error: 'O chat está indisponível no momento.' });
  try {
    const history = validHistory(request.body?.history).filter((item) => item.content !== message || item.role !== 'user');
    const completion = await client.chat.completions.create({
      model: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
      messages: [{ role:'system', content:SYSTEM_PROMPT }, ...history, { role:'user', content:message }],
      max_completion_tokens: 120,
      temperature: 0.4,
      reasoning_effort: 'none'
    });
    const answer = limitWords(cleanText(completion.choices[0]?.message?.content, 600), 55);
    if (!answer) throw new Error('Resposta vazia do provedor.');
    return response.json({ message: `${answer}\n\nPara atendimento ou relatório completo, fale com Eliana.` });
  } catch (error) { return next(error); }
});

app.post('/contact', contactLimiter, (request, response) => {
  const name = cleanText(request.body?.name, 120);
  const email = cleanText(request.body?.email, 254);
  const message = cleanText(request.body?.message, 3000);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!name || !validEmail || !message) return response.status(400).json({ error:'Preencha nome, e-mail válido e mensagem.' });
  return response.status(202).json({ message:'Mensagem recebida com sucesso.' });
});

app.use((error, request, response, next) => {
  console.error(error);
  if (error instanceof SyntaxError && 'body' in error) return response.status(400).json({ error:'JSON inválido.' });
  return response.status(500).json({ error:'Ocorreu um erro inesperado. Tente novamente.' });
});
app.listen(port, () => console.log(`Servidor disponível em http://localhost:${port}`));

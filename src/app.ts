import { Hono } from 'hono';

import { handleAuth, handleCallback } from './handler';

const app = new Hono();

app.get('/auth', async ctx => handleAuth(ctx));

app.get('/', async ctx => handleCallback(ctx));

export default app;

import { Hono } from 'hono';

import { handleAuth, handleCallback } from './handler';

const app = new Hono();

app.get('/auth', ctx => handleAuth(ctx));

app.get('/callback', async ctx => handleCallback(ctx));

export default app;

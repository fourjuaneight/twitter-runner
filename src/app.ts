import { Hono } from 'hono';

import { handleCallback } from './handler';

const app = new Hono();

app.get('/callback', async ctx => handleCallback(ctx));

export default app;

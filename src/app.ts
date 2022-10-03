import { Hono } from 'hono';

import {
  handleAccess,
  handleAuth,
  handleCallback,
  handleRefresh,
} from './handler';

const app = new Hono();

app.get('/auth', async ctx => handleAuth(ctx));

app.get('/', async ctx => handleCallback(ctx));

app.get('/access', async ctx => handleAccess(ctx));

app.get('/refresh', async ctx => handleRefresh(ctx));

export default app;

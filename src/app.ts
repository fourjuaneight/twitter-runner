import { Hono } from 'hono';

import {
  handleAccess,
  handleAuth,
  handleCallback,
  handleRefresh,
  handleRevoke,
} from './handler';

const app = new Hono();

// generate twitter auth url and save code + state to DB
app.get('/auth', async ctx => handleAuth(ctx));

// save authorized code + sate and access token, then return token
app.get('/', async ctx => handleCallback(ctx));

// get latest access token by user
app.get('/access', async ctx => handleAccess(ctx));

// refresh access token
app.post('/refresh', async ctx => handleRefresh(ctx));

// revoke access token
app.post('/revoke', async ctx => handleRevoke(ctx));

export default app;

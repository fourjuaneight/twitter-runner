import { Hono } from 'hono';

import {
  handleAccess,
  handleAuth,
  handleCallback,
  handleRefresh,
} from './handler';

const app = new Hono();

// generate twitter auth url and save code + state to DB
app.get('/auth', async ctx => handleAuth(ctx));

// save authorized code + sate and access token, then return token
app.get('/', async ctx => handleCallback(ctx));

// get latest access token by user
app.get('/access', async ctx => handleAccess(ctx));

// refresh access token.
app.get('/refresh', async ctx => handleRefresh(ctx));

export default app;

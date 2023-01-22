import { Hono } from 'hono';

import {
  handleAccess,
  handleAuth,
  handleCallback,
  handleDetails,
  handlePrompt,
  handlePromptsList,
  handleRefresh,
  handleRevoke,
  handleTweet,
} from './handler';

const app = new Hono();

app.get('/', ct) => {
  ctx.status(200);
  ctx.text('Why are you here?');
});

// generate twitter auth url and save code + state to DB
app.get('/auth', async (ctx) => handleAuth(ctx));

// save authorized code + sate and access token, then return token
app.get('/callback', async (ctx) => handleCallback(ctx));

// get latest access token by user
app.get('/access', async (ctx) => handleAccess(ctx));

// refresh access token
app.post('/refresh', async (ctx) => handleRefresh(ctx));

// revoke access token
app.post('/revoke', async (ctx) => handleRevoke(ctx));

// post tweet
app.post('/tweet', async (ctx) => handleTweet(ctx));

// save prompt
app.post('/prompt', async (ctx) => handlePrompt(ctx));

// save prompt
app.get('/prompts', async (ctx) => handlePromptsList(ctx));

// get tweet details
app.post('/details', async (ctx) => handleDetails(ctx));

export default app;

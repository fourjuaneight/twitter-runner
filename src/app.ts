/* eslint-disable no-restricted-globals */
import { Hono } from 'hono';

import { handleCallback } from './handler';

const app = new Hono();

app.get('/callback', ctx => handleCallback(ctx.req));

export default app;

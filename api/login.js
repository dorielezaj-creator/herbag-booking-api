import { createSessionCookie, isAdminAuthenticated, redirect } from './_auth.js';

async function readForm(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  let raw = '';

  for await (const chunk of req) {
    raw += chunk;
  }

  return Object.fromEntries(new URLSearchParams(raw));
}

function renderLogin(error = '') {
  return `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Herbag Admin Login</title>
    <style>
      body{
        margin:0;
        min-height:100vh;
        display:flex;
        align-items:center;
        justify-content:center;
        background:#f7f4f2;
        color:#28050A;
        font-family:Arial,sans-serif;
      }

      .login{
        width:min(420px, calc(100vw - 40px));
        background:#fff;
        border:1px solid #d8d0cc;
        padding:42px;
      }

      .logo{
        width:90px;
        height:90px;
        object-fit:contain;
        display:block;
        margin:0 auto 28px;
        background:#28050A;
      }

      h1{
        margin:0 0 10px;
        text-align:center;
        font-size:32px;
      }

      p{
        margin:0 0 28px;
        text-align:center;
        color:#6f6666;
      }

      input{
        width:100%;
        box-sizing:border-box;
        border:1px solid #28050A;
        padding:16px;
        font-size:16px;
        margin-bottom:16px;
      }

      button{
        width:100%;
        border:1px solid #28050A;
        background:#28050A;
        color:#fff;
        padding:16px;
        font-size:16px;
        font-weight:700;
        cursor:pointer;
      }

      .error{
        border:1px solid #9b1028;
        background:#fff0f2;
        color:#9b1028;
        padding:12px;
        margin-bottom:16px;
        text-align:center;
      }
    </style>
  </head>

  <body>
    <form class="login" method="POST" action="/api/login">
      <img class="logo" src="https://cdn.shopify.com/s/files/1/0748/5014/0314/files/herbag_logo_white.png?v=1778686299" alt="Herbag">

      <h1>Herbag Bookings</h1>
      <p>Login to manage appointments.</p>

      ${error ? `<div class="error">${error}</div>` : ''}

      <input type="password" name="password" placeholder="Password" required autofocus>

      <button type="submit">Login</button>
    </form>
  </body>
</html>
`;
}

export default async function handler(req, res) {
  if (isAdminAuthenticated(req)) {
    return redirect(res, '/api/admin-bookings');
  }

  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(renderLogin());
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const form = await readForm(req);
  const password = String(form.password || '');

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(401).send(renderLogin('Incorrect password.'));
  }

  res.setHeader('Set-Cookie', createSessionCookie());
  return redirect(res, '/api/admin-bookings');
}

import { clearSessionCookie, redirect } from './_auth.js';

export default async function handler(req, res) {
  res.setHeader('Set-Cookie', clearSessionCookie());
  return redirect(res, '/api/login');
}

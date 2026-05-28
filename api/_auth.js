import { createHmac, timingSafeEqual } from 'crypto';

const COOKIE_NAME = 'herbag_admin_session';
const SESSION_MAX_AGE = 60 * 60 * 8;

function getSecret() {
  return process.env.ADMIN_TOKEN || process.env.ADMIN_PASSWORD || 'herbag-admin';
}

function sign(value) {
  return createHmac('sha256', getSecret()).update(value).digest('hex');
}

function safeCompare(a, b) {
  const first = Buffer.from(String(a));
  const second = Buffer.from(String(b));

  if (first.length !== second.length) {
    return false;
  }

  return timingSafeEqual(first, second);
}

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie || '';

  return cookieHeader
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(name + '='))
    ?.split('=')
    .slice(1)
    .join('=') || '';
}

export function createSessionCookie() {
  const value = Date.now() + '.' + Math.random().toString(36).slice(2);
  const session = value + '.' + sign(value);

  return `${COOKIE_NAME}=${encodeURIComponent(session)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function isAdminAuthenticated(req) {
  const cookieValue = decodeURIComponent(getCookie(req, COOKIE_NAME));

  if (!cookieValue) {
    return false;
  }

  const parts = cookieValue.split('.');
  const signature = parts.pop();
  const value = parts.join('.');

  if (!value || !signature) {
    return false;
  }

  return safeCompare(signature, sign(value));
}

export function redirect(res, location) {
  res.writeHead(302, {
    Location: location
  });

  return res.end();
}

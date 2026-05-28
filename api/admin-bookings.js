import { createSessionCookie, isAdminAuthenticated, redirect } from './_auth.js';

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const tokenFromUrl = url.searchParams.get('token');
  const message = url.searchParams.get('message');

  if (!isAdminAuthenticated(req)) {
    if (tokenFromUrl && tokenFromUrl === process.env.ADMIN_TOKEN) {
      res.setHeader('Set-Cookie', createSessionCookie());
      return redirect(res, '/api/admin-bookings');
    }

    return redirect(res, '/api/login');
  }

  const response = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/bookings?select=id,created_at,first_name,last_name,email,phone,selected_date,selected_time,product,product_url,notes,confirmation_code,status&order=created_at.desc`,
    {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  );

  if (!response.ok) {
    return res.status(500).send(await response.text());
  }

  const bookings = await response.json();

  const pendingCount = bookings.filter((booking) => booking.status === 'pending').length;
  const acceptedCount = bookings.filter((booking) => booking.status === 'accepted').length;
  const cancelledCount = bookings.filter((booking) => booking.status === 'cancelled').length;

  const bookingsJson = JSON.stringify(bookings).replace(/</g, '\\u003c');

  const rows = bookings.map((booking) => {
    const canAccept = booking.status !== 'accepted';
    const canCancel = booking.status !== 'cancelled';

    return `
      <article
        class="card"
        data-status="${escapeHtml(booking.status)}"
        data-date="${escapeHtml(booking.selected_date)}"
        data-time="${escapeHtml(booking.selected_time)}"
      >
        <div class="card-top">
          <div>
            <strong>${escapeHtml(booking.first_name)} ${escapeHtml(booking.last_name)}</strong>
            <span class="muted">${escapeHtml(booking.email)} · ${escapeHtml(booking.phone)}</span>
          </div>

          <span class="status ${escapeHtml(booking.status)}">${escapeHtml(booking.status)}</span>
        </div>

        <div class="card-grid">
          <div>
            <span class="label">Product / Service</span>
            <p>${escapeHtml(booking.product)}</p>
          </div>

          <div>
            <span class="label">Date & Time</span>
            <p>${escapeHtml(booking.selected_date)} · ${escapeHtml(booking.selected_time)}</p>
          </div>

          <div>
            <span class="label">Confirmation Code</span>
            <p>${escapeHtml(booking.confirmation_code)}</p>
          </div>
        </div>

        <div class="actions">
          ${
            canAccept
              ? `<a class="accept" href="/api/update-booking-status?id=${encodeURIComponent(booking.id)}&status=accepted">Accept</a>`
              : ''
          }

          ${
            canCancel
              ? `<a class="cancel" href="/api/update-booking-status?id=${encodeURIComponent(booking.id)}&status=cancelled">Cancel</a>`
              : ''
          }
        </div>
      </article>
    `;
  }).join('');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  return res.status(200).send(`
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Herbag Bookings</title>

        <style>
          *{box-sizing:border-box;}

          body{
            margin:0;
            min-height:100vh;
            font-family:Arial,sans-serif;
            background:#f5f1ee;
            color:#2a0008;
          }

          .wrap{
            width:min(1120px, calc(100% - 36px));
            margin:0 auto;
            padding:34px 0 56px;
          }

          .hero{
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:24px;
            margin-bottom:22px;
            padding:22px;
            background:#ffffff;
            border:1px solid #ded5d0;
          }

          .brand{
            display:flex;
            align-items:center;
            gap:18px;
          }

          .brand-mark{
            width:64px;
            height:64px;
            display:flex;
            align-items:center;
            justify-content:center;
            background:#2a0008;
          }

          .brand-mark img{
            width:38px;
            height:auto;
            display:block;
          }

          h1{
            margin:0;
            font-size:34px;
            line-height:1.1;
          }

          .hero p{
            margin:6px 0 0;
            color:#7a7070;
            font-size:15px;
          }

          .hero-actions{
            display:flex;
            align-i

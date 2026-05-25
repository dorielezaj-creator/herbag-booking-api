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
  const token = url.searchParams.get('token');

  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).send('Unauthorized');
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

  const rows = bookings.map((booking) => `
    <div class="card">
      <div class="top">
        <strong>${escapeHtml(booking.first_name)} ${escapeHtml(booking.last_name)}</strong>
        <span class="status ${escapeHtml(booking.status)}">${escapeHtml(booking.status)}</span>
      </div>

      <p>${escapeHtml(booking.product)}</p>
      <p>${escapeHtml(booking.selected_date)} · ${escapeHtml(booking.selected_time)}</p>
      <p>${escapeHtml(booking.email)} · ${escapeHtml(booking.phone)}</p>
      <p>Code: ${escapeHtml(booking.confirmation_code)}</p>

      <div class="actions">
        <a class="accept" href="/api/update-booking-status?id=${encodeURIComponent(booking.id)}&status=accepted&token=${encodeURIComponent(token)}">Accept</a>
        <a class="cancel" href="/api/update-booking-status?id=${encodeURIComponent(booking.id)}&status=cancelled&token=${encodeURIComponent(token)}">Cancel</a>
      </div>
    </div>
  `).join('');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  return res.status(200).send(`
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Herbag Bookings</title>
        <style>
          body{font-family:Arial,sans-serif;background:#f7f4f2;color:#2a0008;padding:30px;}
          .wrap{max-width:900px;margin:auto;}
          .card{background:#fff;border:1px solid #d8d0cc;padding:22px;margin-bottom:16px;}
          .top{display:flex;justify-content:space-between;gap:12px;}
          .status{padding:6px 10px;border:1px solid currentColor;text-transform:uppercase;font-size:12px;}
          .accepted{color:green;}
          .cancelled{color:#888;}
          .pending{color:#7a0b1a;}
          .actions{display:flex;gap:10px;margin-top:18px;}
          .actions a{padding:12px 18px;text-decoration:none;color:#fff;}
          .accept{background:#2a0008;}
          .cancel{background:#777;}
        </style>
      </head>
      <body>
        <div class="wrap">
          <h1>Herbag Bookings</h1>
          ${rows || '<p>No bookings yet.</p>'}
        </div>
      </body>
    </html>
  `);
}

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
  const message = url.searchParams.get('message');

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

  const pendingBookings = bookings.filter((booking) => booking.status === 'pending');
  const acceptedBookings = bookings.filter((booking) => booking.status === 'accepted');
  const cancelledBookings = bookings.filter((booking) => booking.status === 'cancelled');

  function renderCard(booking) {
    const canAccept = booking.status !== 'accepted';
    const canCancel = booking.status !== 'cancelled';

    return `
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
          ${
            canAccept
              ? `<a class="accept" href="/api/update-booking-status?id=${encodeURIComponent(booking.id)}&status=accepted&token=${encodeURIComponent(token)}">Accept</a>`
              : ''
          }

          ${
            canCancel
              ? `<a class="cancel" href="/api/update-booking-status?id=${encodeURIComponent(booking.id)}&status=cancelled&token=${encodeURIComponent(token)}">Cancel</a>`
              : ''
          }
        </div>
      </div>
    `;
  }

  function renderSection(title, subtitle, items, className) {
    return `
      <section class="booking-section booking-section--${className}">
        <div class="section-head">
          <div>
            <h2>${title}</h2>
            <p>${subtitle}</p>
          </div>

          <span class="count">${items.length}</span>
        </div>

        ${
          items.length
            ? items.map(renderCard).join('')
            : `<div class="empty">No bookings in this section.</div>`
        }
      </section>
    `;
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  return res.status(200).send(`
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Herbag Bookings</title>

        <style>
          *{
            box-sizing:border-box;
          }

          body{
            font-family:Arial,sans-serif;
            background:#f7f4f2;
            color:#2a0008;
            padding:30px;
            margin:0;
          }

          .wrap{
            max-width:980px;
            margin:auto;
          }

          h1{
            margin:0 0 26px;
            font-size:42px;
            line-height:1.1;
          }

          .notice{
            background:#fdebed;
            border:1px solid #9b1c31;
            color:#7a0b1a;
            padding:18px 22px;
            margin-bottom:24px;
            font-weight:700;
          }

          .booking-section{
            margin-bottom:34px;
          }

          .section-head{
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:20px;
            margin-bottom:14px;
            padding-bottom:10px;
            border-bottom:1px solid #d8d0cc;
          }

          .section-head h2{
            margin:0;
            font-size:24px;
          }

          .section-head p{
            margin:6px 0 0;
            color:#777;
            font-size:14px;
          }

          .count{
            min-width:42px;
            height:42px;
            border:1px solid currentColor;
            display:flex;
            align-items:center;
            justify-content:center;
            font-weight:700;
          }

          .card{
            background:#fff;
            border:1px solid #d8d0cc;
            padding:22px;
            margin-bottom:16px;
          }

          .top{
            display:flex;
            justify-content:space-between;
            gap:12px;
            align-items:flex-start;
          }

          .card p{
            margin:16px 0;
            font-size:18px;
          }

          .status{
            padding:6px 10px;
            border:1px solid currentColor;
            text-transform:uppercase;
            font-size:12px;
            white-space:nowrap;
          }

          .accepted{
            color:green;
          }

          .cancelled{
            color:#777;
          }

          .pending{
            color:#7a0b1a;
          }

          .actions{
            display:flex;
            gap:10px;
            margin-top:18px;
          }

          .actions a{
            padding:12px 18px;
            text-decoration:none;
            color:#fff;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            min-width:92px;
          }

          .accept{
            background:#2a0008;
          }

          .cancel{
            background:#777;
          }

          .empty{
            background:#fff;
            border:1px dashed #d8d0cc;
            padding:24px;
            color:#777;
          }

          @media(max-width:700px){
            body{
              padding:18px;
            }

            h1{
              font-size:32px;
            }

            .top,
            .section-head{
              flex-direction:column;
              align-items:flex-start;
            }

            .actions{
              flex-direction:column;
            }

            .actions a{
              width:100%;
            }
          }
        </style>
      </head>

      <body>
        <div class="wrap">
          <h1>Herbag Bookings</h1>

          ${message ? `<div class="notice">${escapeHtml(message)}</div>` : ''}

          ${renderSection(
            'Pending approval',
            'Appointments waiting for manager approval.',
            pendingBookings,
            'pending'
          )}

          ${renderSection(
            'Accepted',
            'Confirmed appointments.',
            acceptedBookings,
            'accepted'
          )}

          ${renderSection(
            'Cancelled',
            'Cancelled appointment requests.',
            cancelledBookings,
            'cancelled'
          )}
        </div>
      </body>
    </html>
  `);
}

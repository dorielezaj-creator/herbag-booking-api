import { isAdminAuthenticated } from './_auth.js';

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));

function buildStatusEmail({ booking, status }) {
  const isAccepted = status === 'accepted';

  const title = isAccepted
    ? 'APPOINTMENT CONFIRMED'
    : 'APPOINTMENT CANCELLED';

  const message = isAccepted
    ? 'We are pleased to confirm your appointment with Herbag.'
    : 'Your appointment request has been cancelled. If you would like to choose another time, please book a new appointment.';

  return `
<div style="background:#f5f1ee;padding:40px;font-family:Arial,sans-serif;">
  <div style="max-width:620px;margin:auto;background:#ffffff;border:1px solid #d9d1cc;">
    <div style="background:#2a0008;padding:40px;text-align:center;">
      <img
        src="https://cdn.shopify.com/s/files/1/0748/5014/0314/files/herbag_logo_white.png?v=1778686299"
        alt="Herbag"
        style="width:120px;height:auto;display:block;margin:0 auto 18px;"
      >

      <p style="margin:0;color:#d8c9c9;font-size:13px;letter-spacing:4px;">
        ${title}
      </p>
    </div>

    <div style="padding:40px;">
      <h2 style="margin-top:0;color:#111;font-weight:500;">
        Dear ${escapeHtml(booking.first_name)},
      </h2>

      <p style="font-size:16px;color:#444;line-height:1.8;">
        ${message}
      </p>

      <div style="margin-top:35px;padding:25px;background:#f8f6f4;border:1px solid #eee;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:10px 0;color:#888;font-size:12px;letter-spacing:2px;">SERVICE</td>
            <td style="padding:10px 0;text-align:right;color:#111;">${escapeHtml(booking.product)}</td>
          </tr>

          <tr>
            <td style="padding:10px 0;color:#888;font-size:12px;letter-spacing:2px;">DATE</td>
            <td style="padding:10px 0;text-align:right;color:#111;">${escapeHtml(booking.selected_date)}</td>
          </tr>

          <tr>
            <td style="padding:10px 0;color:#888;font-size:12px;letter-spacing:2px;">TIME</td>
            <td style="padding:10px 0;text-align:right;color:#111;">${escapeHtml(booking.selected_time)}</td>
          </tr>

          <tr>
            <td style="padding:10px 0;color:#888;font-size:12px;letter-spacing:2px;">CODE</td>
            <td style="padding:10px 0;text-align:right;color:#111;">${escapeHtml(booking.confirmation_code)}</td>
          </tr>
        </table>
      </div>

      <p style="margin-top:40px;color:#777;line-height:1.8;">
        Herbag<br>
        Luxury Bags & Accessories
      </p>
    </div>
  </div>
</div>
`;
}

async function sendStatusEmail({ booking, status }) {
  if (!booking.email || !['accepted', 'cancelled'].includes(status)) {
    return;
  }

  const subject =
    status === 'accepted'
      ? `Your Herbag Appointment Is Confirmed - ${booking.confirmation_code}`
      : `Your Herbag Appointment Has Been Cancelled - ${booking.confirmation_code}`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Herbag <info@herbag.al>',
      to: [booking.email],
      subject,
      html: buildStatusEmail({ booking, status })
    })
  });

  if (!response.ok) {
    console.error('Bulk status email failed:', await response.text());
  }
}

async function updateBookingStatus({ id, status }) {
  const response = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        status,
        updated_at: new Date().toISOString()
      })
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const rows = await response.json();
  return rows[0];
}

async function deleteBooking({ id }) {
  const response = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export default async function handler(req, res) {
  if (!isAdminAuthenticated(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body =
    typeof req.body === 'string'
      ? JSON.parse(req.body || '{}')
      : req.body || {};

  const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
  const action = body.action;

  if (!ids.length) {
    return res.status(400).json({ error: 'No bookings selected.' });
  }

  if (!['accepted', 'cancelled', 'delete'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action.' });
  }

  const result = {
    success: true,
    action,
    total: ids.length,
    completed: 0,
    failed: []
  };

  for (const id of ids) {
    try {
      if (action === 'delete') {
        await deleteBooking({ id });
      } else {
        const booking = await updateBookingStatus({ id, status: action });
        if (booking) {
          await sendStatusEmail({ booking, status: action });
        }
      }

      result.completed += 1;
    } catch (error) {
      result.failed.push({
        id,
        error: error.message
      });
    }
  }

  const actionText = {
    accepted: 'accepted',
    cancelled: 'cancelled',
    delete: 'deleted'
  }[action];

  result.message =
    `${result.completed} booking(s) ${actionText}.` +
    (result.failed.length ? ` ${result.failed.length} failed.` : '');

  return res.status(result.completed ? 200 : 409).json(result);
}

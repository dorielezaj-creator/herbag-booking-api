const ADMIN_BOOKINGS_URL = 'https://bookings.herbag.al/api/admin-bookings';

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function generateBookingCode() {
  const now = new Date();

  const datePart =
    String(now.getFullYear()).slice(2) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0');

  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();

  return 'HB' + datePart + randomPart;
}

function buildClientEmail({ booking }) {
  return `
<div style="background:#f5f1ee;padding:40px;font-family:Arial,sans-serif;">
  <div style="max-width:620px;margin:auto;background:#ffffff;border:1px solid #d9d1cc;">
    <div style="background:#2a0008;padding:40px;text-align:center;">
      <img src="https://cdn.shopify.com/s/files/1/0748/5014/0314/files/herbag_logo_white.png?v=1778686299" alt="Herbag" style="width:120px;height:auto;display:block;margin:0 auto 18px;">
      <p style="margin:0;color:#d8c9c9;font-size:13px;letter-spacing:4px;">APPOINTMENT REQUEST RECEIVED</p>
    </div>

    <div style="padding:40px;">
      <h2 style="margin-top:0;color:#111;font-weight:500;">Dear ${escapeHtml(booking.first_name)},</h2>

      <p style="font-size:16px;color:#444;line-height:1.8;">
        Thank you. Your appointment request has been received. Our team will review it and confirm your appointment shortly.
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

function buildAdminEmail({ booking }) {
  return `
<div style="background:#f5f1ee;padding:40px;font-family:Arial,sans-serif;">
  <div style="max-width:720px;margin:auto;background:#ffffff;border:1px solid #d9d1cc;">
    <div style="background:#2a0008;padding:34px;text-align:center;">
      <img src="https://cdn.shopify.com/s/files/1/0748/5014/0314/files/herbag_logo_white.png?v=1778686299" alt="Herbag" style="width:110px;height:auto;display:block;margin:0 auto 18px;">
      <p style="margin:0;color:#d8c9c9;font-size:13px;letter-spacing:4px;">NEW BOOKING REQUEST</p>
    </div>

    <div style="padding:34px;">
      <h2 style="margin-top:0;color:#111;">New appointment request</h2>

      <div style="padding:22px;background:#f8f6f4;border:1px solid #eee;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:9px 0;color:#888;">Name</td><td style="padding:9px 0;text-align:right;color:#111;">${escapeHtml(booking.first_name)} ${escapeHtml(booking.last_name)}</td></tr>
          <tr><td style="padding:9px 0;color:#888;">Email</td><td style="padding:9px 0;text-align:right;color:#111;">${escapeHtml(booking.email)}</td></tr>
          <tr><td style="padding:9px 0;color:#888;">Phone</td><td style="padding:9px 0;text-align:right;color:#111;">${escapeHtml(booking.phone)}</td></tr>
          <tr><td style="padding:9px 0;color:#888;">Service</td><td style="padding:9px 0;text-align:right;color:#111;">${escapeHtml(booking.product)}</td></tr>
          <tr><td style="padding:9px 0;color:#888;">Date</td><td style="padding:9px 0;text-align:right;color:#111;">${escapeHtml(booking.selected_date)}</td></tr>
          <tr><td style="padding:9px 0;color:#888;">Time</td><td style="padding:9px 0;text-align:right;color:#111;">${escapeHtml(booking.selected_time)}</td></tr>
          <tr><td style="padding:9px 0;color:#888;">Code</td><td style="padding:9px 0;text-align:right;color:#111;">${escapeHtml(booking.confirmation_code)}</td></tr>
        </table>
      </div>

      ${
        booking.notes
          ? `<p style="margin-top:24px;color:#444;line-height:1.7;"><strong>Notes:</strong><br>${escapeHtml(booking.notes)}</p>`
          : ''
      }

      <p style="margin-top:28px;">
        <a href="${ADMIN_BOOKINGS_URL}" style="display:inline-block;background:#2a0008;color:#ffffff;text-decoration:none;padding:14px 20px;font-weight:700;">
          Open Admin Bookings
        </a>
      </p>
    </div>
  </div>
</div>
`;
}

async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY || !to) {
    console.error('Missing RESEND_API_KEY or email recipient.');
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Herbag <herbag.lake@gmail.com>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html
    })
  });

  if (!response.ok) {
    console.error('Email failed:', await response.text());
  }
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body =
    typeof req.body === 'string'
      ? JSON.parse(req.body || '{}')
      : req.body || {};

  const confirmation_code = body.confirmation_code || generateBookingCode();

  const bookingData = {
    first_name: body.first_name || '',
    last_name: body.last_name || '-',
    email: body.email || '',
    phone: body.phone || '',
    notes: body.notes || '',
    selected_date: body.selected_date || '',
    selected_time: body.selected_time || '',
    product: body.product || '',
    product_url: body.product_url || '',
    product_image: body.product_image || '',
    product_description: body.product_description || '',
    confirmation_code,
    status: 'pending'
  };

  if (
    !bookingData.first_name ||
    !bookingData.email ||
    !bookingData.phone ||
    !bookingData.selected_date ||
    !bookingData.selected_time ||
    !bookingData.product
  ) {
    return res.status(400).json({ error: 'Missing required booking fields.' });
  }

  const supabaseResponse = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/bookings`,
    {
      method: 'POST',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(bookingData)
    }
  );

  if (!supabaseResponse.ok) {
    return res.status(500).send(await supabaseResponse.text());
  }

  const rows = await supabaseResponse.json();
  const booking = rows[0] || bookingData;

  await Promise.allSettled([
    sendEmail({
      to: booking.email,
      subject: `Herbag Appointment Request Received - ${booking.confirmation_code}`,
      html: buildClientEmail({ booking })
    }),
    sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `New Herbag Booking - ${booking.selected_date} ${booking.selected_time}`,
      html: buildAdminEmail({ booking })
    })
  ]);

  return res.status(200).json({
    success: true,
    confirmation_code: booking.confirmation_code
  });
}

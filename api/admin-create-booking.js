import { isAdminAuthenticated, redirect } from './_auth.js';

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));

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
      <img
        src="https://cdn.shopify.com/s/files/1/0748/5014/0314/files/herbag_logo_white.png?v=1778686299"
        alt="Herbag"
        style="width:120px;height:auto;display:block;margin:0 auto 18px;"
      >

      <p style="margin:0;color:#d8c9c9;font-size:13px;letter-spacing:4px;">
        APPOINTMENT CONFIRMED
      </p>
    </div>

    <div style="padding:40px;">
      <h2 style="margin-top:0;color:#111;font-weight:500;">
        Dear ${escapeHtml(booking.first_name)},
      </h2>

      <p style="font-size:16px;color:#444;line-height:1.8;">
        Your Herbag appointment has been confirmed.
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

      <p style="margin-top:50px;color:#777;line-height:1.8;">
        We look forward to welcoming you.<br><br>
        Herbag<br>
        Luxury Bags & Accessories
      </p>
    </div>
  </div>
</div>
`;
}

function renderPage() {
  return `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Create Appointment</title>

    <style>
      *{box-sizing:border-box;}

      body{
        margin:0;
        min-height:100vh;
        font-family:Arial,sans-serif;
        background:#f5f1ee;
        color:#2a0008;
        padding:28px;
      }

      .wrap{
        width:min(760px, 100%);
        margin:auto;
      }

      .top{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:18px;
        margin-bottom:22px;
      }

      h1{
        margin:0;
        font-size:34px;
      }

      .back{
        color:#2a0008;
        text-decoration:none;
        border:1px solid currentColor;
        padding:12px 16px;
        background:#fff;
      }

      form{
        background:#fff;
        border:1px solid #ded5d0;
        padding:24px;
      }

      .grid{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:16px;
      }

      label{
        display:block;
        margin-bottom:7px;
        color:#8c8080;
        font-size:11px;
        letter-spacing:.14em;
        text-transform:uppercase;
      }

      input,
      select,
      textarea{
        width:100%;
        border:1px solid #2a0008;
        background:#fff;
        color:#2a0008;
        padding:14px;
        font:inherit;
      }

      textarea{
        min-height:120px;
        resize:vertical;
      }

      .field{
        margin-bottom:16px;
      }

      .full{
        grid-column:1 / -1;
      }

      button{
        width:100%;
        border:1px solid #2a0008;
        background:#2a0008;
        color:#fff;
        padding:16px 18px;
        cursor:pointer;
        font:inherit;
        font-weight:700;
      }

      button:disabled{
        background:#bdb7b9;
        border-color:#bdb7b9;
        cursor:not-allowed;
      }

      .message{
        margin-top:16px;
        font-weight:700;
      }

      .message.error{
        color:#9b1c31;
      }

      @media(max-width:640px){
        body{
          padding:16px;
        }

        .top{
          flex-direction:column;
          align-items:flex-start;
        }

        .back{
          width:100%;
          text-align:center;
        }

        .grid{
          grid-template-columns:1fr;
        }

        form{
          padding:18px;
        }
      }
    </style>
  </head>

  <body>
    <div class="wrap">
      <div class="top">
        <h1>Create Appointment</h1>
        <a class="back" href="/api/admin-bookings">Back to Bookings</a>
      </div>

      <form id="adminCreateForm">
        <div class="grid">
          <div class="field">
            <label>First Name</label>
            <input type="text" name="first_name" required>
          </div>

          <div class="field">
            <label>Last Name</label>
            <input type="text" name="last_name" required>
          </div>

          <div class="field">
            <label>Email</label>
            <input type="email" name="email" required>
          </div>

          <div class="field">
            <label>Phone</label>
            <input type="tel" name="phone" required>
          </div>

          <div class="field full">
            <label>Service / Product</label>
            <input list="services" name="product" required placeholder="Sell a Bag">
            <datalist id="services">
              <option value="Sell a Bag">
              <option value="Buy a Bag">
              <option value="Rent a Bag">
              <option value="Entrupy Authentication Service">
              <option value="Product Appointment">
            </datalist>
          </div>

          <div class="field">
            <label>Date</label>
            <input type="date" name="selected_date" required>
          </div>

          <div class="field">
            <label>Time</label>
            <select name="selected_time" required>
              <option value="">Select time</option>
              <option value="10:30">10:30</option>
              <option value="11:15">11:15</option>
              <option value="12:00">12:00</option>
              <option value="12:45">12:45</option>
              <option value="13:30">13:30</option>
              <option value="14:15">14:15</option>
              <option value="15:00">15:00</option>
              <option value="15:45">15:45</option>
              <option value="16:30">16:30</option>
              <option value="17:15">17:15</option>
              <option value="18:00">18:00</option>
            </select>
          </div>

          <div class="field full">
            <label>Notes</label>
            <textarea name="notes"></textarea>
          </div>
        </div>

        <button type="submit">Create Confirmed Appointment</button>
        <div class="message" id="formMessage"></div>
      </form>
    </div>

    <script>
      const form = document.getElementById('adminCreateForm');
      const message = document.getElementById('formMessage');

      form.addEventListener('submit', async function(event) {
        event.preventDefault();

        const button = form.querySelector('button[type="submit"]');
        const formData = new FormData(form);

        const payload = {
          first_name: formData.get('first_name'),
          last_name: formData.get('last_name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          product: formData.get('product'),
          selected_date: formData.get('selected_date'),
          selected_time: formData.get('selected_time'),
          notes: formData.get('notes')
        };

        button.disabled = true;
        button.innerText = 'Creating...';
        message.className = 'message';
        message.innerText = '';

        try {
          const response = await fetch('/api/admin-create-booking', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Something went wrong.');
          }

          window.location.href =
            '/api/admin-bookings?message=' +
            encodeURIComponent('Appointment created and client email sent.');
        } catch (error) {
          message.className = 'message error';
          message.innerText = error.message;

          button.disabled = false;
          button.innerText = 'Create Confirmed Appointment';
        }
      });
    </script>
  </body>
</html>
`;
}

export default async function handler(req, res) {
  if (!isAdminAuthenticated(req)) {
    if (req.method === 'GET') {
      return redirect(res, '/api/login');
    }

    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(renderPage());
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    first_name,
    last_name,
    email,
    phone,
    product,
    selected_date,
    selected_time,
    notes
  } = req.body;

  if (!first_name || !last_name || !email || !phone || !product || !selected_date || !selected_time) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const confirmation_code = generateBookingCode();

  const bookingData = {
    first_name,
    last_name,
    email,
    phone,
    product,
    product_url: '',
    product_image: '',
    product_description: '',
    selected_date,
    selected_time,
    notes: notes || '',
    confirmation_code,
    status: 'accepted'
  };

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
    const errorText = await supabaseResponse.text();

    if (errorText.includes('one_accepted_booking_per_slot')) {
      return res.status(409).json({
        error: 'This date and time is already booked.'
      });
    }

    return res.status(500).json({
      error: errorText
    });
  }

  const rows = await supabaseResponse.json();
  const booking = rows[0];

  const emailResponse = await fetch(
    'https://api.resend.com/emails',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Herbag <info@herbag.al>',
        to: [email],
        subject: `Your Herbag Appointment Is Confirmed - ${confirmation_code}`,
        html: buildClientEmail({ booking })
      })
    }
  );

  if (!emailResponse.ok) {
    return res.status(500).json({
      error: 'Appointment created, but client email failed.'
    });
  }

  return res.status(200).json({
    success: true,
    confirmation_code
  });
}

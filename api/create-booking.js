export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      product,
      product_url,
      selected_date,
      selected_time,
      notes,
      confirmation_code
    } = req.body;

    if (!first_name || !last_name || !email || !phone || !selected_date || !selected_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const bookingData = {
      first_name,
      last_name,
      email,
      phone,
      product,
      product_url,
      selected_date,
      selected_time,
      notes: notes || '',
      confirmation_code
    };

    const supabaseResponse = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/bookings`,
      {
        method: 'POST',
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify(bookingData)
      }
    );

    if (!supabaseResponse.ok) {
      const errorText = await supabaseResponse.text();
      return res.status(500).json({ error: errorText });
    }

    const adminEmailHtml = `
      <div style="font-family:Arial,sans-serif;color:#111;line-height:1.6;">
        <h2>New Herbag Appointment Request</h2>
        <p><strong>Confirmation Code:</strong> ${confirmation_code}</p>

        <hr>

        <h3>Client Details</h3>
        <p><strong>Name:</strong> ${first_name} ${last_name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>

        <h3>Appointment</h3>
        <p><strong>Date:</strong> ${selected_date}</p>
        <p><strong>Time:</strong> ${selected_time}</p>

        <h3>Product</h3>
        <p><strong>Product:</strong> ${product}</p>
        <p><strong>Product URL:</strong> <a href="${product_url}">${product_url}</a></p>

        <h3>Notes</h3>
        <p>${notes || 'No notes provided.'}</p>
      </div>
    `;

    const clientEmailHtml = `
      <div style="font-family:Arial,sans-serif;color:#111;line-height:1.6;">
        <h2>Your Herbag Appointment is Confirmed</h2>

        <p>Dear ${first_name},</p>

        <p>Thank you for booking an appointment with Herbag.</p>

        <p><strong>Confirmation Code:</strong> ${confirmation_code}</p>

        <hr>

        <h3>Appointment Details</h3>
        <p><strong>Date:</strong> ${selected_date}</p>
        <p><strong>Time:</strong> ${selected_time}</p>

        <h3>Product</h3>
        <p><strong>${product}</strong></p>
        <p><a href="${product_url}">View product</a></p>

        <p>We look forward to welcoming you.</p>

        <p style="margin-top:30px;">
          Herbag<br>
          Luxury Bags & Accessories
        </p>
      </div>
    `;

    const adminEmailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Herbag <info@herbag.al>',
        to: ['info@herbag.al'],
        subject: `New Appointment Request - ${confirmation_code}`,
        html: adminEmailHtml
      })
    });

    const clientEmailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Herbag <info@herbag.al>',
        to: [email],
        subject: `Your Herbag Appointment Confirmation - ${confirmation_code}`,
        html: clientEmailHtml
      })
    });

    if (!adminEmailResponse.ok || !clientEmailResponse.ok) {
      return res.status(500).json({ error: 'Booking saved, but email failed.' });
    }

    return res.status(200).json({
      success: true,
      confirmation_code
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}

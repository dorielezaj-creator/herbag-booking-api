export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

if (req.method === 'OPTIONS') {
  return res.status(200).end();
}

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

    ```js
const adminEmailHtml = `
<div style="background:#f5f1ee;padding:40px;font-family:Arial,sans-serif;">

  <div style="max-width:620px;margin:auto;background:#ffffff;border:1px solid #d9d1cc;">

    <div style="background:#2a0008;padding:30px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:28px;letter-spacing:3px;font-weight:400;">
        HERBAG
      </h1>

      <p style="margin-top:10px;color:#d8c9c9;font-size:13px;letter-spacing:2px;">
        NEW APPOINTMENT REQUEST
      </p>
    </div>

    <div style="padding:40px;">

      <div style="margin-bottom:35px;">
        <p style="font-size:12px;color:#888;letter-spacing:2px;margin-bottom:8px;">
          PRODUCT
        </p>

        <h2 style="margin:0;font-size:26px;color:#111;font-weight:500;">
          ${product}
        </h2>
      </div>

      <table style="width:100%;border-collapse:collapse;">

        <tr>
          <td style="padding:16px 0;border-top:1px solid #eee;">
            <span style="font-size:12px;color:#888;letter-spacing:2px;">
              CLIENT
            </span>
          </td>

          <td style="padding:16px 0;border-top:1px solid #eee;text-align:right;font-size:16px;color:#111;">
            ${first_name} ${last_name}
          </td>
        </tr>

        <tr>
          <td style="padding:16px 0;border-top:1px solid #eee;">
            <span style="font-size:12px;color:#888;letter-spacing:2px;">
              PHONE
            </span>
          </td>

          <td style="padding:16px 0;border-top:1px solid #eee;text-align:right;font-size:16px;color:#111;">
            ${phone}
          </td>
        </tr>

        <tr>
          <td style="padding:16px 0;border-top:1px solid #eee;">
            <span style="font-size:12px;color:#888;letter-spacing:2px;">
              EMAIL
            </span>
          </td>

          <td style="padding:16px 0;border-top:1px solid #eee;text-align:right;font-size:16px;color:#111;">
            ${email}
          </td>
        </tr>

        <tr>
          <td style="padding:16px 0;border-top:1px solid #eee;">
            <span style="font-size:12px;color:#888;letter-spacing:2px;">
              DATE
            </span>
          </td>

          <td style="padding:16px 0;border-top:1px solid #eee;text-align:right;font-size:16px;color:#111;">
            ${selected_date}
          </td>
        </tr>

        <tr>
          <td style="padding:16px 0;border-top:1px solid #eee;border-bottom:1px solid #eee;">
            <span style="font-size:12px;color:#888;letter-spacing:2px;">
              TIME
            </span>
          </td>

          <td style="padding:16px 0;border-top:1px solid #eee;border-bottom:1px solid #eee;text-align:right;font-size:16px;color:#111;">
            ${selected_time}
          </td>
        </tr>

      </table>

      ${
        notes
          ? `
      <div style="margin-top:35px;">
        <p style="font-size:12px;color:#888;letter-spacing:2px;margin-bottom:12px;">
          NOTES
        </p>

        <div style="background:#f8f6f4;padding:20px;border:1px solid #eee;color:#333;line-height:1.7;">
          ${notes}
        </div>
      </div>
      `
          : ''
      }

      <div style="margin-top:40px;text-align:center;">
        <p style="font-size:12px;color:#888;letter-spacing:2px;">
          CONFIRMATION CODE
        </p>

        <div style="font-size:22px;color:#2a0008;letter-spacing:4px;font-weight:bold;">
          ${confirmation_code}
        </div>
      </div>

    </div>

  </div>

</div>
`;

const clientEmailHtml = `
<div style="background:#f5f1ee;padding:40px;font-family:Arial,sans-serif;">

  <div style="max-width:620px;margin:auto;background:#ffffff;border:1px solid #d9d1cc;">

    <div style="background:#2a0008;padding:30px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:28px;letter-spacing:3px;font-weight:400;">
        HERBAG
      </h1>

      <p style="margin-top:10px;color:#d8c9c9;font-size:13px;letter-spacing:2px;">
        APPOINTMENT CONFIRMED
      </p>
    </div>

    <div style="padding:40px;">

      <h2 style="margin-top:0;color:#111;font-weight:500;">
        Dear ${first_name},
      </h2>

      <p style="font-size:16px;color:#444;line-height:1.8;">
        Thank you for booking your appointment with Herbag.
      </p>

      <div style="margin-top:35px;padding:25px;background:#f8f6f4;border:1px solid #eee;">

        <table style="width:100%;border-collapse:collapse;">

          <tr>
            <td style="padding:10px 0;color:#888;font-size:12px;letter-spacing:2px;">
              PRODUCT
            </td>

            <td style="padding:10px 0;text-align:right;color:#111;">
              ${product}
            </td>
          </tr>

          <tr>
            <td style="padding:10px 0;color:#888;font-size:12px;letter-spacing:2px;">
              DATE
            </td>

            <td style="padding:10px 0;text-align:right;color:#111;">
              ${selected_date}
            </td>
          </tr>

          <tr>
            <td style="padding:10px 0;color:#888;font-size:12px;letter-spacing:2px;">
              TIME
            </td>

            <td style="padding:10px 0;text-align:right;color:#111;">
              ${selected_time}
            </td>
          </tr>

        </table>

      </div>

      <div style="margin-top:40px;text-align:center;">
        <p style="font-size:12px;color:#888;letter-spacing:2px;">
          CONFIRMATION CODE
        </p>

        <div style="font-size:24px;color:#2a0008;letter-spacing:4px;font-weight:bold;">
          ${confirmation_code}
        </div>
      </div>

      <div style="margin-top:40px;text-align:center;">
        <a href="${product_url}"
          style="
            display:inline-block;
            padding:14px 34px;
            background:#2a0008;
            color:#ffffff;
            text-decoration:none;
            letter-spacing:2px;
            font-size:12px;
          ">
          VIEW PRODUCT
        </a>
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
```


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

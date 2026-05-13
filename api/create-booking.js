export default async function handler(req, res) {
  // Lejo vetëm POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
    });
  }

  try {
    const { name, phone, email, product } = req.body;

    // Kontroll bazik
    if (!name || !phone) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    // Ruaj në Supabase
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/bookings`,
      {
        method: 'POST',
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          name,
          phone,
          email,
          product,
          created_at: new Date().toISOString(),
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      return res.status(500).json({
        error: errorText,
      });
    }

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}

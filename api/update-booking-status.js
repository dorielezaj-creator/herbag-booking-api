export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);

  const token =
    req.method === 'GET'
      ? url.searchParams.get('token')
      : req.body?.token || req.headers['x-admin-token'];

  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const id = req.method === 'GET' ? url.searchParams.get('id') : req.body?.id;
  const status = req.method === 'GET' ? url.searchParams.get('status') : req.body?.status;

  if (!id || !['pending', 'accepted', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid request' });
  }

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
    return res.status(409).json({
      error: await response.text()
    });
  }

  if (req.method === 'GET') {
    res.writeHead(302, {
      Location: `/api/admin-bookings?token=${encodeURIComponent(token)}`
    });
    return res.end();
  }

  return res.status(200).json({ success: true });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = new URL(req.url, `https://${req.headers.host}`);
  const date = url.searchParams.get('date');

  if (!date) {
    return res.status(400).json({ error: 'Missing date' });
  }

  const response = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/bookings?select=selected_time&selected_date=eq.${encodeURIComponent(date)}&status=eq.accepted`,
    {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  );

  if (!response.ok) {
    return res.status(500).json({ error: await response.text() });
  }

  const rows = await response.json();

  return res.status(200).json({
    booked_times: rows.map((row) => row.selected_time).filter(Boolean)
  });
}

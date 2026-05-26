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

  const pendingCount = bookings.filter((booking) => booking.status === 'pending').length;
  const acceptedCount = bookings.filter((booking) => booking.status === 'accepted').length;
  const cancelledCount = bookings.filter((booking) => booking.status === 'cancelled').length;

  const bookingsJson = JSON.stringify(bookings).replace(/</g, '\\u003c');

  const rows = bookings.map((booking) => {
    const canAccept = booking.status !== 'accepted';
    const canCancel = booking.status !== 'cancelled';

    return `
      <div class="card" data-status="${escapeHtml(booking.status)}">
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
  }).join('');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  return res.status(200).send(`
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Herbag Bookings</title>

        <style>
          *{box-sizing:border-box;}

          body{
            font-family:Arial,sans-serif;
            background:#f7f4f2;
            color:#2a0008;
            padding:30px;
            margin:0;
          }

          .wrap{max-width:980px;margin:auto;}

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

          .toolbar{
            display:grid;
            grid-template-columns:1fr auto;
            gap:14px;
            align-items:stretch;
            margin-bottom:24px;
          }

          .filters{
            display:grid;
            grid-template-columns:repeat(4, 1fr);
            gap:12px;
          }

          .filter-btn,
          .download-btn{
            border:1px solid currentColor;
            background:#fff;
            color:#2a0008;
            padding:16px;
            text-align:left;
            cursor:pointer;
            font:inherit;
          }

          .filter-btn strong{
            display:block;
            font-size:15px;
            margin-bottom:8px;
          }

          .filter-btn span{
            display:inline-flex;
            align-items:center;
            justify-content:center;
            min-width:34px;
            height:30px;
            border:1px solid currentColor;
            font-weight:700;
          }

          .filter-btn.active{
            background:#2a0008;
            color:#fff;
          }

          .download-btn{
            min-width:180px;
            background:#2a0008;
            color:#fff;
            text-align:center;
            font-weight:700;
          }

          .download-btn:disabled{
            background:#bdb7b9;
            border-color:#bdb7b9;
            color:#fff;
            cursor:not-allowed;
          }

          .section-title{
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:18px;
            margin:0 0 14px;
            padding-bottom:12px;
            border-bottom:1px solid #d8d0cc;
          }

          .section-title h2{
            margin:0;
            font-size:24px;
          }

          .section-title p{
            margin:5px 0 0;
            color:#777;
          }

          .card{
            background:#fff;
            border:1px solid #d8d0cc;
            padding:22px;
            margin-bottom:16px;
          }

          .card.hidden{display:none;}

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

          .accepted{color:green;}
          .cancelled{color:#777;}
          .pending{color:#7a0b1a;}

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

          .accept{background:#2a0008;}
          .cancel{background:#777;}

          .empty{
            display:none;
            background:#fff;
            border:1px dashed #d8d0cc;
            padding:24px;
            color:#777;
          }

          .empty.active{display:block;}

          @media(max-width:760px){
            body{padding:18px;}

            h1{font-size:32px;}

            .toolbar{
              grid-template-columns:1fr;
            }

            .filters{
              grid-template-columns:1fr 1fr;
            }

            .download-btn{
              width:100%;
            }

            .top,
            .section-title{
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

          @media(max-width:480px){
            .filters{
              grid-template-columns:1fr;
            }
          }
        </style>
      </head>

      <body>
        <div class="wrap">
          <h1>Herbag Bookings</h1>

          ${message ? `<div class="notice">${escapeHtml(message)}</div>` : ''}

          <div class="toolbar">
            <div class="filters">
              <button type="button" class="filter-btn active" data-filter="all">
                <strong>All</strong>
                <span>${bookings.length}</span>
              </button>

              <button type="button" class="filter-btn" data-filter="pending">
                <strong>Pending</strong>
                <span>${pendingCount}</span>
              </button>

              <button type="button" class="filter-btn" data-filter="accepted">
                <strong>Accepted</strong>
                <span>${acceptedCount}</span>
              </button>

              <button type="button" class="filter-btn" data-filter="cancelled">
                <strong>Cancelled</strong>
                <span>${cancelledCount}</span>
              </button>
            </div>

            <button type="button" class="download-btn" id="downloadExcel">
              Download Excel
            </button>
          </div>

          <div class="section-title">
            <div>
              <h2 id="currentTitle">All bookings</h2>
              <p id="currentSubtitle">Showing all appointment requests.</p>
            </div>
          </div>

          <div id="bookingList">
            ${rows || ''}
          </div>

          <div class="empty" id="emptyState">
            No bookings in this filter.
          </div>
        </div>

        <script>
          const bookingsData = ${bookingsJson};
          const buttons = document.querySelectorAll('.filter-btn');
          const cards = document.querySelectorAll('.card');
          const title = document.getElementById('currentTitle');
          const subtitle = document.getElementById('currentSubtitle');
          const emptyState = document.getElementById('emptyState');
          const downloadButton = document.getElementById('downloadExcel');

          let currentFilter = 'all';

          const labels = {
            all: {
              title: 'All bookings',
              subtitle: 'Showing all appointment requests.'
            },
            pending: {
              title: 'Pending approval',
              subtitle: 'Appointments waiting for manager approval.'
            },
            accepted: {
              title: 'Accepted',
              subtitle: 'Confirmed appointments.'
            },
            cancelled: {
              title: 'Cancelled',
              subtitle: 'Cancelled appointment requests.'
            }
          };

          function getFilteredBookings() {
            if (currentFilter === 'all') {
              return bookingsData;
            }

            return bookingsData.filter(function(booking) {
              return booking.status === currentFilter;
            });
          }

          function applyFilter(filter) {
            currentFilter = filter;
            let visibleCount = 0;

            cards.forEach(function(card) {
              const shouldShow = filter === 'all' || card.dataset.status === filter;
              card.classList.toggle('hidden', !shouldShow);

              if (shouldShow) {
                visibleCount += 1;
              }
            });

            buttons.forEach(function(button) {
              button.classList.toggle('active', button.dataset.filter === filter);
            });

            title.innerText = labels[filter].title;
            subtitle.innerText = labels[filter].subtitle;
            emptyState.classList.toggle('active', visibleCount === 0);
            downloadButton.disabled = visibleCount === 0;
          }

          function cleanCsvValue(value) {
            if (value === null || value === undefined) {
              return '';
            }

            return String(value).replace(/\\r?\\n|\\r/g, ' ').trim();
          }

          function csvCell(value) {
            return '"' + cleanCsvValue(value).replace(/"/g, '""') + '"';
          }

          function downloadSelectedBookings() {
            const selectedBookings = getFilteredBookings();

            if (!selectedBookings.length) {
              return;
            }

            const headers = [
              'Status',
              'First Name',
              'Last Name',
              'Email',
              'Phone',
              'Date',
              'Time',
              'Product',
              'Product URL',
              'Notes',
              'Confirmation Code',
              'Created At'
            ];

            const lines = [
              headers.map(csvCell).join(',')
            ];

            selectedBookings.forEach(function(booking) {
              lines.push([
                booking.status,
                booking.first_name,
                booking.last_name,
                booking.email,
                booking.phone,
                booking.selected_date,
                booking.selected_time,
                booking.product,
                booking.product_url,
                booking.notes,
                booking.confirmation_code,
                booking.created_at
              ].map(csvCell).join(','));
            });

            const csv = '\\ufeff' + lines.join('\\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const date = new Date().toISOString().slice(0, 10);

            link.href = URL.createObjectURL(blob);
            link.download = 'herbag-bookings-' + currentFilter + '-' + date + '.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
          }

          buttons.forEach(function(button) {
            button.addEventListener('click', function() {
              applyFilter(button.dataset.filter);
            });
          });

          downloadButton.addEventListener('click', downloadSelectedBookings);
        </script>
      </body>
    </html>
  `);
}

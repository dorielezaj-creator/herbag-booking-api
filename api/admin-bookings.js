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
      <article class="card" data-status="${escapeHtml(booking.status)}">
        <div class="card-top">
          <div>
            <strong>${escapeHtml(booking.first_name)} ${escapeHtml(booking.last_name)}</strong>
            <span class="muted">${escapeHtml(booking.email)} · ${escapeHtml(booking.phone)}</span>
          </div>

          <span class="status ${escapeHtml(booking.status)}">${escapeHtml(booking.status)}</span>
        </div>

        <div class="card-grid">
          <div>
            <span class="label">Product / Service</span>
            <p>${escapeHtml(booking.product)}</p>
          </div>

          <div>
            <span class="label">Date & Time</span>
            <p>${escapeHtml(booking.selected_date)} · ${escapeHtml(booking.selected_time)}</p>
          </div>

          <div>
            <span class="label">Confirmation Code</span>
            <p>${escapeHtml(booking.confirmation_code)}</p>
          </div>
        </div>

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
      </article>
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
            margin:0;
            min-height:100vh;
            font-family:Arial,sans-serif;
            background:#f5f1ee;
            color:#2a0008;
          }

          .wrap{
            width:min(1120px, calc(100% - 36px));
            margin:0 auto;
            padding:34px 0 56px;
          }

          .hero{
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:24px;
            margin-bottom:28px;
            padding:22px;
            background:#ffffff;
            border:1px solid #ded5d0;
          }

          .brand{
            display:flex;
            align-items:center;
            gap:18px;
          }

          .brand-mark{
            width:64px;
            height:64px;
            display:flex;
            align-items:center;
            justify-content:center;
            background:#2a0008;
          }

          .brand-mark img{
            width:38px;
            height:auto;
            display:block;
          }

          h1{
            margin:0;
            font-size:34px;
            line-height:1.1;
            letter-spacing:.01em;
          }

          .hero p{
            margin:6px 0 0;
            color:#7a7070;
            font-size:15px;
          }

          .download-btn{
            min-width:178px;
            border:1px solid #2a0008;
            background:#2a0008;
            color:#fff;
            padding:15px 18px;
            cursor:pointer;
            font:inherit;
            font-weight:700;
          }

          .download-btn:disabled{
            background:#bdb7b9;
            border-color:#bdb7b9;
            cursor:not-allowed;
          }

          .notice{
            background:#fff0f2;
            border:1px solid #9b1c31;
            color:#7a0b1a;
            padding:16px 18px;
            margin-bottom:18px;
            font-weight:700;
          }

          .filters{
            display:grid;
            grid-template-columns:repeat(4, 1fr);
            gap:12px;
            margin-bottom:24px;
          }

          .filter-btn{
            border:1px solid #ded5d0;
            background:#ffffff;
            color:#2a0008;
            padding:18px;
            text-align:left;
            cursor:pointer;
            font:inherit;
          }

          .filter-btn strong{
            display:block;
            font-size:15px;
            margin-bottom:14px;
          }

          .filter-btn span{
            font-size:28px;
            font-weight:700;
            line-height:1;
          }

          .filter-btn.active{
            background:#2a0008;
            border-color:#2a0008;
            color:#ffffff;
          }

          .section-title{
            display:flex;
            align-items:flex-end;
            justify-content:space-between;
            gap:18px;
            margin:0 0 16px;
            padding-bottom:14px;
            border-bottom:1px solid #ded5d0;
          }

          .section-title h2{
            margin:0;
            font-size:26px;
          }

          .section-title p{
            margin:5px 0 0;
            color:#7a7070;
          }

          .card{
            background:#ffffff;
            border:1px solid #ded5d0;
            padding:24px;
            margin-bottom:14px;
          }

          .card.hidden{
            display:none;
          }

          .card-top{
            display:flex;
            justify-content:space-between;
            align-items:flex-start;
            gap:16px;
            margin-bottom:24px;
          }

          .card-top strong{
            display:block;
            font-size:19px;
            margin-bottom:6px;
          }

          .muted{
            color:#777;
            font-size:14px;
          }

          .card-grid{
            display:grid;
            grid-template-columns:1.4fr 1fr 1fr;
            gap:18px;
          }

          .label{
            display:block;
            margin-bottom:7px;
            color:#8c8080;
            font-size:11px;
            letter-spacing:.14em;
            text-transform:uppercase;
          }

          .card p{
            margin:0;
            font-size:17px;
            line-height:1.45;
          }

          .status{
            padding:7px 10px;
            border:1px solid currentColor;
            text-transform:uppercase;
            font-size:12px;
            white-space:nowrap;
          }

          .accepted{color:#168019;}
          .cancelled{color:#777;}
          .pending{color:#9b1c31;}

          .actions{
            display:flex;
            gap:10px;
            margin-top:24px;
          }

          .actions a{
            padding:12px 18px;
            text-decoration:none;
            color:#fff;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            min-width:96px;
            font-weight:700;
          }

          .accept{background:#2a0008;}
          .cancel{background:#777;}

          .empty{
            display:none;
            background:#ffffff;
            border:1px dashed #ded5d0;
            padding:24px;
            color:#777;
          }

          .empty.active{
            display:block;
          }

          @media(max-width:860px){
            .hero{
              align-items:flex-start;
              flex-direction:column;
            }

            .download-btn{
              width:100%;
            }

            .filters{
              grid-template-columns:1fr 1fr;
            }

            .card-grid{
              grid-template-columns:1fr;
            }
          }

          @media(max-width:560px){
            .wrap{
              width:calc(100% - 24px);
              padding-top:18px;
            }

            .hero{
              padding:18px;
            }

            .brand{
              align-items:flex-start;
            }

            .brand-mark{
              width:54px;
              height:54px;
            }

            .brand-mark img{
              width:32px;
            }

            h1{
              font-size:28px;
            }

            .filters{
              grid-template-columns:1fr;
            }

            .card{
              padding:18px;
            }

            .card-top,
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
        </style>
      </head>

      <body>
        <div class="wrap">
          <header class="hero">
            <div class="brand">
              <div class="brand-mark">
                <img src="https://cdn.shopify.com/s/files/1/0748/5014/0314/files/herbag_logo_white.png?v=1778686299" alt="Herbag">
              </div>

              <div>
                <h1>Herbag Bookings</h1>
                <p>Manage appointment requests, confirmations, and cancellations.</p>
              </div>
            </div>

            <button type="button" class="download-btn" id="downloadExcel">
              Download Excel
            </button>
          </header>

          ${message ? `<div class="notice">${escapeHtml(message)}</div>` : ''}

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

document.addEventListener('DOMContentLoaded', () => {
  const PROGRAMS = [
    {
      id: 'clothing-swap-2026-11-21',
      date: '2026-11-21',
      dateLabel: 'SATURDAY, NOVEMBER 21',
      title: 'Clothing Swap — Donate Ur Swag 2 Get New Swag',
      category: 'SWAP & THRIFT',
      categoryKey: 'swap-thrift',
      timeVenue: '6:00 PM – 8:00 PM • Banjara Hills Community Lounge, Hyderabad',
      venue: 'Banjara Hills Community Lounge, Hyderabad',
      details: 'Free clothes & free tote bags! Bring pre-loved pieces from your wardrobe and swap them for fresh thrifted finds.',
      poster: 'assets/events/clothing-swap.png',
      posterAlt: 'Scrapbook clothing swap flyer with the words “free clothes” and “free tote bags”'
    },
    {
      id: 'curated-craft-club-2026-11-29',
      date: '2026-11-29',
      dateLabel: 'SUNDAY, NOVEMBER 29',
      title: 'Curated Craft Club: Sustainable Bag Charms',
      category: 'WORKSHOP',
      categoryKey: 'workshop',
      timeVenue: '1:00 PM – 3:00 PM • Jubilee Hills Studio, Hyderabad',
      venue: 'Jubilee Hills Studio, Hyderabad',
      details: 'All materials provided (₹250 entry, Ages 15+). Craft upcycled fabric & patchwork bag charms from deadstock scraps.',
      poster: 'assets/events/craft-club.png',
      posterAlt: 'Curated Craft Club poster for a sustainable bag-charm workshop'
    },
    {
      id: 'hand-sewing-2026-12-02',
      date: '2026-12-02',
      dateLabel: 'WEDNESDAY, DECEMBER 2',
      title: 'Hand Sewing & Visible Mending Workshop',
      category: 'WORKSHOP',
      categoryKey: 'workshop',
      timeVenue: '1:00 PM – 3:00 PM • Roastery Coffee House Courtyard, Banjara Hills',
      venue: 'Roastery Coffee House Courtyard, Banjara Hills',
      details: 'All materials provided (₹250 per person). Learn hand stitching, darning, and decorative mending using upcycled textiles.',
      poster: 'assets/events/hand-sewing.png',
      posterAlt: 'Colorful hand-sewing workshop poster with stitched-letter artwork'
    }
  ];

  const DRIVES = [
    {
      id: 'open-donation-drive-2026-11',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      dateLabel: '11.01.26 – 11.30.26',
      title: 'Open Donation Drive: Clothes, Shoes & Accessories',
      category: 'DONATION DRIVE',
      categoryKey: 'donation-drive',
      timeVenue: 'Month-long collection across Hyderabad campuses & drop-off hubs.',
      venue: 'Hyderabad campuses & drop-off hubs',
      details: 'Month-long wardrobe collection drive across Hyderabad campuses & drop-off hubs. Donate wearable clothes, shoes, and accessories for local redistribution.',
      poster: 'assets/events/donation-drive.png',
      posterAlt: 'Open donation flyer featuring clothing, shoes, accessories, and contact numbers'
    },
    {
      id: 'deadstock-showcase-2026',
      startDate: '2026-11-15',
      endDate: '2026-12-20',
      dateLabel: '11.15.26 – 12.20.26',
      title: 'Hyderabad Deadstock & Upcycled Textile Showcase',
      category: 'EXHIBITION',
      categoryKey: 'workshop',
      timeVenue: 'Dates and venue details to be announced • Hyderabad',
      venue: 'Hyderabad (venue details to be announced)',
      details: 'Curated exhibition of zero-waste garments and patchwork pieces crafted by local Hyderabad tailors and student designers.',
      poster: 'assets/events/upcycle-showcase.png',
      posterAlt: 'Upcycle & Paint Workshop artwork used for the Hyderabad textile showcase'
    }
  ];

  const programsFeed = document.getElementById('programs-feed');
  const ongoingDrives = document.getElementById('ongoing-drives');
  const calendarMonthLabel = document.getElementById('calendar-month');
  const calendarDays = document.getElementById('calendar-days');
  const calendarFeedback = document.getElementById('calendar-feedback');
  const pageStatus = document.getElementById('events-status');
  const eventDialog = document.getElementById('event-dialog');
  const hostDialog = document.getElementById('host-dialog');
  const hostForm = document.getElementById('host-form');
  const eventRsvpButton = document.getElementById('event-rsvp-button');
  const eventUnrsvpButton = document.getElementById('event-unrsvp-button');
  const eventRsvpMessage = document.getElementById('event-rsvp-message');
  const hostMessage = document.getElementById('host-message');
  let rsvps = readRsvps();
  let activeEvent = null;
  let calendarMonth = new Date(2026, 10, 1);
  let selectedDate = '';

  function escapeHTML(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showPageStatus(message, kind) {
    pageStatus.textContent = message;
    pageStatus.dataset.kind = kind || 'info';
    pageStatus.hidden = false;
  }

  function readRsvps() {
    try {
      const saved = window.localStorage.getItem('atelier_event_rsvps');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) {
        throw new Error('Saved event RSVPs are not a list.');
      }
      return parsed.filter((entry) => entry && typeof entry.eventId === 'string');
    } catch (error) {
      console.error('Unable to read saved event RSVPs.', error);
      showPageStatus('Saved RSVPs could not be loaded from this browser.', 'error');
      return [];
    }
  }

  function hasRsvp(entry) {
    return rsvps.some((rsvp) => rsvp.eventId === entry.id);
  }

  function getSelectedCategory() {
    const selected = document.querySelector('input[name="event-category"]:checked');
    return selected ? selected.value : 'all';
  }

  function posterButton(entry, className) {
    return `
      <button class="${className}" type="button" data-open-event="${escapeHTML(entry.id)}" aria-label="View poster for ${escapeHTML(entry.title)}">
        <img src="${escapeHTML(entry.poster)}" alt="${escapeHTML(entry.posterAlt)}" loading="lazy">
        <span class="events-poster__tape" aria-hidden="true"></span>
      </button>`;
  }

  function rsvpBadge(entry) {
    return `<span class="events-going-badge" data-going-for="${escapeHTML(entry.id)}" ${hasRsvp(entry) ? '' : 'hidden'}>You’re Going! ✓</span>`;
  }

  function programMarkup(entry) {
    return `
      <article class="events-program" id="events-${escapeHTML(entry.id)}" data-event-id="${escapeHTML(entry.id)}">
        <div class="events-program__copy">
          <p class="events-program__date">${escapeHTML(entry.dateLabel)}</p>
          <h3>${escapeHTML(entry.title)}</h3>
          <span class="events-category">${escapeHTML(entry.category)}</span>
          <p class="events-program__venue">${escapeHTML(entry.timeVenue)}</p>
          <p class="events-program__details">${escapeHTML(entry.details)}</p>
          <div class="events-program__actions">
            <button class="events-details-button" type="button" data-open-event="${escapeHTML(entry.id)}">RSVP / Details</button>
            ${rsvpBadge(entry)}
          </div>
        </div>
        ${posterButton(entry, 'events-poster events-poster--program')}
      </article>`;
  }

  function driveMarkup(entry) {
    return `
      <article class="events-drive" id="events-${escapeHTML(entry.id)}" data-event-id="${escapeHTML(entry.id)}">
        <p class="events-drive__dates">${escapeHTML(entry.dateLabel)}</p>
        <h3>${escapeHTML(entry.title)}</h3>
        ${posterButton(entry, 'events-poster events-poster--drive')}
        <p class="events-drive__details">${escapeHTML(entry.details)}</p>
        <div class="events-drive__actions">
          <button class="events-details-button" type="button" data-open-event="${escapeHTML(entry.id)}">RSVP / Details</button>
          ${rsvpBadge(entry)}
        </div>
      </article>`;
  }

  function renderPrograms() {
    const selectedCategory = getSelectedCategory();
    const entries = selectedCategory === 'all'
      ? PROGRAMS
      : selectedCategory === 'donation-drive'
        ? [DRIVES[0]]
        : PROGRAMS.filter((entry) => entry.categoryKey === selectedCategory);

    programsFeed.innerHTML = entries.length
      ? entries.map(programMarkup).join('<hr class="events-divider">')
      : '<p class="events-empty">No programs in this category just yet.</p>';
  }

  function renderDrives() {
    ongoingDrives.innerHTML = DRIVES.map(driveMarkup).join('');
  }

  function formatISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getEntriesOnDate(dateString) {
    const scheduled = PROGRAMS.find((entry) => entry.date === dateString);
    if (scheduled) return scheduled;
    return DRIVES.find((entry) => dateString >= entry.startDate && dateString <= entry.endDate) || null;
  }

  function renderCalendar() {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    calendarMonthLabel.textContent = new Intl.DateTimeFormat('en', {
      month: 'long',
      year: 'numeric'
    }).format(calendarMonth);

    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = Array.from({ length: firstWeekday }, () => '<span class="events-calendar__blank" aria-hidden="true"></span>');

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = formatISODate(new Date(year, month, day));
      const scheduled = PROGRAMS.some((entry) => entry.date === date);
      const ongoing = DRIVES.some((entry) => date >= entry.startDate && date <= entry.endDate);
      const dateLabel = new Intl.DateTimeFormat('en', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }).format(new Date(year, month, day));
      const classes = [
        'events-calendar__day',
        scheduled ? 'events-calendar__day--event' : '',
        ongoing ? 'events-calendar__day--drive' : '',
        selectedDate === date ? 'is-selected' : ''
      ].filter(Boolean).join(' ');
      const eventDescription = scheduled
        ? 'scheduled program'
        : ongoing
          ? 'ongoing drive'
          : 'no listed event';

      cells.push(`
        <button class="${classes}" type="button" data-calendar-date="${date}" aria-label="${dateLabel}, ${eventDescription}" aria-pressed="${selectedDate === date}">
          ${day}${scheduled ? '<span aria-hidden="true">•</span>' : ''}
        </button>`);
    }

    calendarDays.innerHTML = cells.join('');
  }

  function showEvent(entry) {
    activeEvent = entry;
    document.getElementById('event-dialog-image').src = entry.poster;
    document.getElementById('event-dialog-image').alt = entry.posterAlt;
    document.getElementById('event-dialog-date').textContent = entry.dateLabel;
    document.getElementById('event-dialog-category').textContent = entry.category;
    document.getElementById('event-dialog-title').textContent = entry.title;
    document.getElementById('event-dialog-venue').textContent = entry.timeVenue;
    document.getElementById('event-dialog-details').textContent = entry.details;
    document.getElementById('event-dialog-organizer').textContent = 'Organizer: Atelier Community Events';
    document.getElementById('event-dialog-contact').textContent = 'Organizer contact details coming soon.';
    eventRsvpMessage.hidden = true;
    eventRsvpMessage.textContent = '';
    updateRsvpButton();
    if (!eventDialog.open) eventDialog.showModal();
  }

  function updateRsvpButton() {
    const going = activeEvent && hasRsvp(activeEvent);
    eventRsvpButton.disabled = Boolean(going);
    eventRsvpButton.textContent = going ? 'You’re Going! ✓' : 'RSVP / Save Spot';
    eventUnrsvpButton.hidden = !going;
    if (activeEvent) {
      document.querySelectorAll(`[data-going-for="${activeEvent.id}"]`).forEach((badge) => {
        badge.hidden = !going;
      });
    }
  }

  function saveRsvp() {
    if (!activeEvent || hasRsvp(activeEvent)) return;
    const nextRsvps = [
      ...rsvps,
      {
        eventId: activeEvent.id,
        title: activeEvent.title,
        date: activeEvent.date || activeEvent.startDate,
        savedAt: new Date().toISOString()
      }
    ];

    try {
      window.localStorage.setItem('atelier_event_rsvps', JSON.stringify(nextRsvps));
      rsvps = nextRsvps;
      renderPrograms();
      renderDrives();
      updateRsvpButton();
      eventRsvpMessage.textContent = 'You’re on the list — see you there!';
      eventRsvpMessage.dataset.kind = 'success';
      eventRsvpMessage.hidden = false;
    } catch (error) {
      console.error('Unable to save the event RSVP.', error);
      eventRsvpMessage.textContent = 'Your RSVP could not be saved. Check browser storage and try again.';
      eventRsvpMessage.dataset.kind = 'error';
      eventRsvpMessage.hidden = false;
    }
  }

  function cancelRsvp() {
    if (!activeEvent || !hasRsvp(activeEvent)) return;
    const nextRsvps = rsvps.filter((rsvp) => rsvp.eventId !== activeEvent.id);

    try {
      window.localStorage.setItem('atelier_event_rsvps', JSON.stringify(nextRsvps));
      rsvps = nextRsvps;
      renderPrograms();
      renderDrives();
      updateRsvpButton();
      eventRsvpMessage.textContent = 'Your RSVP has been cancelled.';
      eventRsvpMessage.dataset.kind = 'success';
      eventRsvpMessage.hidden = false;
    } catch (error) {
      console.error('Unable to cancel the event RSVP.', error);
      eventRsvpMessage.textContent = 'Your RSVP could not be cancelled. Check browser storage and try again.';
      eventRsvpMessage.dataset.kind = 'error';
      eventRsvpMessage.hidden = false;
    }
  }

  function openDateEntry(dateString) {
    const entry = getEntriesOnDate(dateString);
    selectedDate = dateString;
    renderCalendar();

    if (!entry) {
      calendarFeedback.textContent = 'No events are listed for this date yet.';
      return;
    }

    calendarFeedback.textContent = `${entry.dateLabel || entry.dateRange || entry.title} · ${entry.title}`;
    if (PROGRAMS.includes(entry) && getSelectedCategory() !== 'all' && getSelectedCategory() !== entry.categoryKey) {
      document.querySelector('input[name="event-category"][value="all"]').checked = true;
      renderPrograms();
    }
    const target = document.getElementById(`events-${entry.id}`);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  document.querySelectorAll('input[name="event-category"]').forEach((radio) => {
    radio.addEventListener('change', renderPrograms);
  });

  document.getElementById('calendar-prev').addEventListener('click', () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
    renderCalendar();
  });
  document.getElementById('calendar-next').addEventListener('click', () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    renderCalendar();
  });
  calendarDays.addEventListener('click', (event) => {
    const button = event.target instanceof Element
      ? event.target.closest('[data-calendar-date]')
      : null;
    if (button) openDateEntry(button.dataset.calendarDate);
  });

  document.addEventListener('click', (event) => {
    const button = event.target instanceof Element
      ? event.target.closest('[data-open-event]')
      : null;
    if (!button) return;
    const entryId = button.dataset.openEvent;
    const entry = [...PROGRAMS, ...DRIVES].find((item) => item.id === entryId);
    if (entry) showEvent(entry);
  });

  eventRsvpButton.addEventListener('click', saveRsvp);
  eventUnrsvpButton.addEventListener('click', cancelRsvp);
  document.querySelectorAll('[data-close-event]').forEach((button) => {
    button.addEventListener('click', () => eventDialog.close());
  });
  eventDialog.addEventListener('click', (event) => {
    if (event.target === eventDialog) eventDialog.close();
  });

  document.getElementById('open-host-dialog').addEventListener('click', () => {
    hostMessage.hidden = true;
    hostMessage.textContent = '';
    hostDialog.showModal();
  });
  document.querySelectorAll('[data-close-host]').forEach((button) => {
    button.addEventListener('click', () => hostDialog.close());
  });
  hostDialog.addEventListener('click', (event) => {
    if (event.target === hostDialog) hostDialog.close();
  });
  hostForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(hostForm);
    const submission = {
      id: `proposal-${Date.now()}`,
      title: String(formData.get('title') || '').trim(),
      category: String(formData.get('category') || ''),
      date: String(formData.get('date') || ''),
      details: String(formData.get('details') || '').trim(),
      contact: String(formData.get('contact') || '').trim(),
      submittedAt: new Date().toISOString()
    };

    try {
      const saved = window.localStorage.getItem('atelier_event_submissions');
      const submissions = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(submissions)) {
        throw new Error('Saved event proposals are not a list.');
      }
      submissions.push(submission);
      window.localStorage.setItem('atelier_event_submissions', JSON.stringify(submissions));
      hostForm.reset();
      hostMessage.textContent = 'Thanks! Your event proposal has been saved for the Atelier community.';
      hostMessage.dataset.kind = 'success';
      hostMessage.hidden = false;
    } catch (error) {
      console.error('Unable to save the event proposal.', error);
      hostMessage.textContent = 'Your event proposal could not be saved. Check browser storage and try again.';
      hostMessage.dataset.kind = 'error';
      hostMessage.hidden = false;
    }
  });

  renderCalendar();
  renderPrograms();
  renderDrives();
});

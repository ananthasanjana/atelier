document.addEventListener('DOMContentLoaded', () => {
  const SEED_PROGRAMS = [
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
      organizer: 'Banjara Hills Closet Circle',
      contact: '@atelier.events.hyd',
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
      organizer: 'Jubilee Hills Craft Club',
      contact: '@atelier.events.hyd',
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
      organizer: 'Deccan Mending Collective',
      contact: '@atelier.events.hyd',
      poster: 'assets/events/hand-sewing.png',
      posterAlt: 'Colorful hand-sewing workshop poster with stitched-letter artwork'
    }
  ];

  const SEED_DRIVES = [
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
      organizer: 'Hyderabad Rewear Collective',
      contact: '@atelier.events.hyd',
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
      organizer: 'Deccan Deadstock Collective',
      contact: '@atelier.events.hyd',
      poster: 'assets/events/upcycle-showcase.png',
      posterAlt: 'Upcycle & Paint Workshop artwork used for the Hyderabad textile showcase'
    }
  ];

  let PROGRAMS = [...SEED_PROGRAMS];
  let DRIVES = [...SEED_DRIVES];
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
  const eventRsvpMessage = document.getElementById('event-rsvp-message');
  const hostMessage = document.getElementById('host-message');
  let rsvps = new Set();
  let rsvpStatusLoaded = false;
  let rsvpUserId = '';
  let supabaseClient = null;
  let authSubscription = null;
  let currentUser = null;
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

  function hasRsvp(entry) {
    return Boolean(currentUser && rsvpUserId === currentUser.id && rsvps.has(String(entry.id)));
  }

  function toDateOnly(value) {
    const text = String(value || '').trim();
    const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? '' : formatISODate(date);
  }

  function formatDateLabel(value) {
    const dateOnly = toDateOnly(value);
    if (!dateOnly) return '';
    const [year, month, day] = dateOnly.split('-').map(Number);
    return new Intl.DateTimeFormat('en', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    }).format(new Date(year, month - 1, day)).toUpperCase();
  }

  function safePosterUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return 'assets/sewing-repair.jpg';
    try {
      const url = new URL(value, window.location.href);
      if (url.protocol === 'https:' || url.origin === window.location.origin) return url.href;
    } catch (error) {
      console.error('Ignoring an invalid event poster URL.', error);
    }
    return 'assets/sewing-repair.jpg';
  }

  function mapDatabaseEvent(row) {
    const categoryText = String(row.category || row.event_type || row.type || '').trim();
    const categoryLower = categoryText.toLowerCase();
    const startDate = toDateOnly(row.start_date || row.event_date || row.date || row.starts_at);
    const endDate = toDateOnly(row.end_date || row.ends_at);
    const isDrive = Boolean(row.is_drive || endDate || /drive|collection|donation/.test(categoryLower));
    const categoryKey = /swap|thrift/.test(categoryLower)
      ? 'swap-thrift'
      : /donation|drive|collection/.test(categoryLower)
        ? 'donation-drive'
        : 'workshop';
    const category = categoryText
      ? categoryText.toUpperCase()
      : (isDrive ? 'DONATION DRIVE' : categoryKey === 'swap-thrift' ? 'SWAP & THRIFT' : 'WORKSHOP');
    const venue = String(row.venue || row.location || row.address || '').trim();
    const time = String(row.time || row.time_label || '').trim();
    const dateLabel = String(row.date_label || row.dateLabel || '').trim()
      || (isDrive && endDate
        ? `${formatDateLabel(startDate || row.created_at)} – ${formatDateLabel(endDate)}`
        : formatDateLabel(startDate));
    const id = String(row.id || `event-${startDate}-${String(row.title || row.name || 'atelier-event').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
    return {
      id,
      date: startDate,
      startDate: startDate || '',
      endDate: endDate || startDate || '',
      dateLabel,
      title: String(row.title || row.name || 'Atelier Community Event'),
      category,
      categoryKey,
      timeVenue: String(row.time_venue || [time, venue].filter(Boolean).join(' • ') || venue || 'Hyderabad'),
      venue: venue || 'Hyderabad',
      details: String(row.details || row.description || row.about || ''),
      poster: safePosterUrl(row.poster_url || row.image_url || row.poster || ''),
      posterAlt: String(row.poster_alt || row.image_alt || row.title || row.name || 'Atelier event poster'),
      organizer: String(row.organizer_name || row.organizer || 'Atelier Community Events'),
      contact: String(row.contact || row.contact_info || row.contact_email || row.phone || row.instagram || 'Contact via Atelier Events'),
      isDrive,
      source: 'supabase'
    };
  }

  function mergeEvents(seeds, remote) {
    const entries = new Map(seeds.map((entry) => [entry.id, entry]));
    remote.forEach((entry) => {
      const signature = `${entry.title.trim().toLowerCase()}|${entry.date || entry.startDate}`;
      [...entries.entries()].forEach(([id, existing]) => {
        const existingSignature = `${existing.title.trim().toLowerCase()}|${existing.date || existing.startDate}`;
        if (existingSignature === signature) entries.delete(id);
      });
      entries.set(entry.id, entry);
    });
    return [...entries.values()];
  }

  async function loadPrivateRsvps(user) {
    const { data, error } = await supabaseClient
      .from('event_rsvps')
      .select('event_id')
      .eq('user_id', user.id);
    if (error) throw error;
    rsvps = new Set((data || []).map((row) => String(row.event_id)));
    rsvpUserId = user.id;
    rsvpStatusLoaded = true;
  }

  function watchAuthChanges() {
    if (!supabaseClient || authSubscription || typeof supabaseClient.auth.onAuthStateChange !== 'function') return;
    const subscriptionResult = supabaseClient.auth.onAuthStateChange((_event, session) => {
      const nextUser = session && session.user ? session.user : null;
      if (nextUser && currentUser && nextUser.id === currentUser.id) return;
      currentUser = nextUser;
      rsvps.clear();
      rsvpUserId = '';
      rsvpStatusLoaded = !nextUser;
      renderPrograms();
      renderDrives();
      updateRsvpButton();
      if (nextUser) {
        loadPrivateRsvps(nextUser).then(() => {
          renderPrograms();
          renderDrives();
          updateRsvpButton();
        }).catch((error) => {
          console.error('Unable to load private event RSVPs after an account change.', error);
          rsvpStatusLoaded = false;
          showPageStatus('Your private RSVP status could not be loaded. Refresh before changing an RSVP.', 'error');
          updateRsvpButton();
        });
      }
    });
    authSubscription = subscriptionResult && subscriptionResult.data
      ? subscriptionResult.data.subscription
      : null;
  }

  async function loadEventsAndRsvps() {
    let statusError = false;
    try {
      if (!window.atelierSupabase) throw new Error('Supabase is unavailable.');
      supabaseClient = window.atelierSupabase.getClient();
      try {
        const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError) throw sessionError;
        currentUser = sessionData.session && sessionData.session.user
          ? sessionData.session.user
          : null;
      } catch (error) {
        currentUser = null;
        statusError = true;
        console.error('Unable to verify the current user for private event RSVPs.', error);
        showPageStatus('Your private RSVP status could not be verified. You can still browse events.', 'error');
      }

      let remoteEvents = [];
      try {
        const eventResult = await supabaseClient.from('events').select('*');
        if (eventResult.error) throw eventResult.error;
        remoteEvents = (eventResult.data || []).map(mapDatabaseEvent);
      } catch (error) {
        statusError = true;
        console.error('Unable to load public Atelier events.', error);
        showPageStatus('Live events could not be loaded. Showing the event scrapbook samples.', 'error');
      }
      PROGRAMS = mergeEvents(SEED_PROGRAMS, remoteEvents.filter((entry) => !entry.isDrive));
      DRIVES = mergeEvents(SEED_DRIVES, remoteEvents.filter((entry) => entry.isDrive));
      if (currentUser) {
        try {
          await loadPrivateRsvps(currentUser);
        } catch (error) {
          rsvps.clear();
          rsvpUserId = '';
          rsvpStatusLoaded = false;
          statusError = true;
          console.error('Unable to load private event RSVPs.', error);
          showPageStatus('Your private RSVP status could not be loaded. Try refreshing before changing an RSVP.', 'error');
        }
      } else {
        rsvps.clear();
        rsvpUserId = '';
        rsvpStatusLoaded = true;
      }
      renderCalendar();
      renderPrograms();
      renderDrives();
      updateRsvpButton();
      if (!statusError) pageStatus.hidden = true;
      watchAuthChanges();
    } catch (error) {
      console.error('Unable to load Atelier events or private RSVPs from Supabase.', error);
      if (!currentUser) rsvpStatusLoaded = true;
      else rsvpStatusLoaded = false;
      showPageStatus('Live events or your private RSVP status could not be loaded. Showing the event scrapbook samples.', 'error');
    }
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
    return `<span class="events-going-badge" data-going-for="${escapeHTML(entry.id)}" ${hasRsvp(entry) ? '' : 'hidden'}>✓ You're Going</span>`;
  }

  function rsvpButtonLabel(entry) {
    return hasRsvp(entry) ? "✓ You're Going" : currentUser ? 'RSVP / Going' : 'Log in to RSVP';
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
          <p class="events-program__contact"><strong>Contact / Organizer:</strong> ${escapeHTML(entry.organizer || 'Atelier Community Events')} · ${escapeHTML(entry.contact || 'Contact via Atelier Events')}</p>
          <div class="events-program__actions">
            <button class="events-details-button" type="button" data-toggle-rsvp="${escapeHTML(entry.id)}" aria-pressed="${hasRsvp(entry)}">${escapeHTML(rsvpButtonLabel(entry))}</button>
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
        <p class="events-drive__contact"><strong>Contact / Organizer:</strong> ${escapeHTML(entry.organizer || 'Atelier Community Events')} · ${escapeHTML(entry.contact || 'Contact via Atelier Events')}</p>
        <div class="events-drive__actions">
          <button class="events-details-button" type="button" data-toggle-rsvp="${escapeHTML(entry.id)}" aria-pressed="${hasRsvp(entry)}">${escapeHTML(rsvpButtonLabel(entry))}</button>
          ${rsvpBadge(entry)}
        </div>
      </article>`;
  }

  function renderPrograms() {
    const selectedCategory = getSelectedCategory();
    const entries = selectedCategory === 'all'
      ? PROGRAMS
      : selectedCategory === 'donation-drive'
        ? DRIVES.filter((entry) => entry.categoryKey === 'donation-drive')
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
    document.getElementById('event-dialog-organizer').textContent = 'Contact / Organizer:';
    document.getElementById('event-dialog-contact').textContent = `${entry.organizer || 'Atelier Community Events'} · ${entry.contact || 'Contact via Atelier Events'}`;
    eventRsvpMessage.hidden = true;
    eventRsvpMessage.textContent = '';
    updateRsvpButton();
    if (!eventDialog.open) eventDialog.showModal();
  }

  function updateRsvpButton() {
    const going = activeEvent && hasRsvp(activeEvent);
    eventRsvpButton.disabled = Boolean(currentUser && !rsvpStatusLoaded);
    eventRsvpButton.textContent = going ? "✓ You're Going" : currentUser ? 'RSVP / Save Spot' : 'Log in to RSVP';
    eventRsvpButton.setAttribute('aria-pressed', String(Boolean(going)));
    document.querySelectorAll('[data-toggle-rsvp]').forEach((button) => {
      const entry = [...PROGRAMS, ...DRIVES].find((item) => String(item.id) === button.dataset.toggleRsvp);
      if (!entry) return;
      const entryGoing = hasRsvp(entry);
      button.disabled = Boolean(currentUser && !rsvpStatusLoaded);
      button.textContent = rsvpButtonLabel(entry);
      button.setAttribute('aria-pressed', String(Boolean(entryGoing)));
    });
    if (activeEvent) {
      document.querySelectorAll('[data-going-for]').forEach((badge) => {
        if (badge.dataset.goingFor === String(activeEvent.id)) badge.hidden = !going;
      });
    }
  }

  async function toggleRsvp(entry = activeEvent) {
    if (!entry) return;
    activeEvent = entry;
    const eventId = String(entry.id);
    updateRsvpButton();
    eventRsvpButton.disabled = true;
    document.querySelectorAll('[data-toggle-rsvp]').forEach((button) => {
      if (button.dataset.toggleRsvp === eventId) button.disabled = true;
    });
    const showFeedback = (message, kind) => {
      if (eventDialog.open) {
        eventRsvpMessage.textContent = message;
        eventRsvpMessage.dataset.kind = kind;
        eventRsvpMessage.hidden = false;
      } else {
        showPageStatus(message, kind);
      }
    };
    try {
      if (!supabaseClient) {
        if (!window.atelierSupabase) throw new Error('Supabase is unavailable. Please try again later.');
        supabaseClient = window.atelierSupabase.getClient();
      }
      const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
      if (sessionError) throw sessionError;
      currentUser = sessionData.session && sessionData.session.user
        ? sessionData.session.user
        : null;
      if (!currentUser) {
        rsvps.clear();
        rsvpUserId = '';
        rsvpStatusLoaded = true;
        updateRsvpButton();
        window.atelierAuth.prepareLoginRedirect();
        window.location.assign('login.html');
        return;
      }

      if (!rsvpStatusLoaded || rsvpUserId !== currentUser.id) {
        await loadPrivateRsvps(currentUser);
      }
      if (rsvps.has(eventId)) {
        const { error } = await supabaseClient
          .from('event_rsvps')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('event_id', eventId);
        if (error) throw error;
        rsvps.delete(eventId);
        showFeedback('Your RSVP has been cancelled.', 'success');
      } else {
        const { error } = await supabaseClient
          .from('event_rsvps')
          .insert({ user_id: currentUser.id, event_id: eventId });
        if (error) throw error;
        rsvps.add(eventId);
        showFeedback('You’re on the list — see you there!', 'success');
      }
      renderPrograms();
      renderDrives();
      rsvpUserId = currentUser.id;
      rsvpStatusLoaded = true;
      updateRsvpButton();
    } catch (error) {
      console.error('Unable to toggle the private event RSVP.', error);
      showFeedback(`Your RSVP could not be updated: ${error.message || 'Please try again.'}`, 'error');
    } finally {
      updateRsvpButton();
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
    const rsvpButton = event.target instanceof Element
      ? event.target.closest('[data-toggle-rsvp]')
      : null;
    if (rsvpButton) {
      const entry = [...PROGRAMS, ...DRIVES].find((item) => String(item.id) === rsvpButton.dataset.toggleRsvp);
      if (entry) toggleRsvp(entry);
      return;
    }

    const button = event.target instanceof Element
      ? event.target.closest('[data-open-event]')
      : null;
    if (!button) return;
    const entryId = button.dataset.openEvent;
    const entry = [...PROGRAMS, ...DRIVES].find((item) => item.id === entryId);
    if (entry) showEvent(entry);
  });

  eventRsvpButton.addEventListener('click', () => toggleRsvp());
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
  const hostDateField = hostForm.elements.namedItem('date');
  const hostContactField = hostForm.elements.namedItem('contact');
  hostDateField.addEventListener('input', () => hostDateField.setCustomValidity(''));
  hostContactField.addEventListener('input', () => {
    hostContactField.setCustomValidity(hostContactField.value.trim() ? '' : 'Enter a contact method.');
  });
  document.querySelectorAll('[data-close-host]').forEach((button) => {
    button.addEventListener('click', () => hostDialog.close());
  });
  hostDialog.addEventListener('click', (event) => {
    if (event.target === hostDialog) hostDialog.close();
  });
  hostForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const dateField = hostForm.elements.namedItem('date');
    const contactField = hostForm.elements.namedItem('contact');
    dateField.setCustomValidity(dateField.value ? '' : 'Choose an event date.');
    contactField.setCustomValidity(contactField.value.trim() ? '' : 'Enter a contact method.');
    if (!hostForm.reportValidity()) return;

    const formData = new FormData(hostForm);
    const submission = {
      title: String(formData.get('title') || '').trim(),
      category: String(formData.get('category') || ''),
      date: String(formData.get('date') || ''),
      details: String(formData.get('details') || '').trim(),
      contact: String(formData.get('contact') || '').trim()
    };
    const submitButton = hostForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    hostMessage.hidden = true;

    try {
      if (!supabaseClient) {
        if (!window.atelierSupabase) throw new Error('Supabase is unavailable. Please try again later.');
        supabaseClient = window.atelierSupabase.getClient();
      }
      const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
      if (sessionError) throw sessionError;
      currentUser = sessionData.session && sessionData.session.user
        ? sessionData.session.user
        : null;
      if (!currentUser) {
        hostMessage.textContent = 'Please log in to publish an event.';
        hostMessage.dataset.kind = 'error';
        hostMessage.hidden = false;
        window.atelierAuth.prepareLoginRedirect();
        window.location.assign('login.html');
        return;
      }

      const userMetadata = currentUser.user_metadata || {};
      const organizerName = userMetadata.username
        || userMetadata.full_name
        || (currentUser.email ? currentUser.email.split('@')[0] : 'Atelier Community Member');
      const { data: savedEvent, error } = await supabaseClient
        .from('events')
        .insert({
          title: submission.title,
          category: submission.category,
          event_date: submission.date,
          venue: 'Hyderabad',
          details: submission.details,
          organizer_name: organizerName,
          contact: submission.contact,
          user_id: currentUser.id
        })
        .select('*')
        .single();
      if (error) throw error;

      const entry = mapDatabaseEvent(savedEvent);
      if (entry.isDrive) {
        DRIVES = mergeEvents(DRIVES, [entry]);
      } else {
        PROGRAMS = mergeEvents(PROGRAMS, [entry]);
      }
      renderCalendar();
      renderPrograms();
      renderDrives();
      updateRsvpButton();
      hostForm.reset();
      hostDialog.close();
      showPageStatus('Your event was published to the Atelier community.', 'success');
      const eventCard = document.getElementById(`events-${entry.id}`);
      if (eventCard) eventCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (error) {
      console.error('Unable to publish the event to Supabase.', error);
      hostMessage.textContent = `Your event could not be published: ${error.message || 'Please try again.'}`;
      hostMessage.dataset.kind = 'error';
      hostMessage.hidden = false;
    } finally {
      submitButton.disabled = false;
    }
  });

  renderCalendar();
  renderPrograms();
  renderDrives();
  loadEventsAndRsvps();
});

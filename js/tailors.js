const CLOUDINARY_CLOUD_NAME = 'lify0b3k';
const CLOUDINARY_UPLOAD_PRESET = 'atelier_unsigned';

let tailorToastTimeout = 0;

function showTailorsToast(message, kind) {
  const toast = document.getElementById('tailors-toast');
  if (!toast) return;

  window.clearTimeout(tailorToastTimeout);
  toast.textContent = message;
  toast.dataset.kind = kind || 'info';
  toast.classList.add('is-visible');
  if (kind !== 'loading') {
    tailorToastTimeout = window.setTimeout(() => toast.classList.remove('is-visible'), 3600);
  }
}

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  showTailorsToast('Uploading photo...', 'loading');

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error && data.error.message
        ? data.error.message
        : 'Cloudinary could not upload this photo.');
    }
    if (typeof data.secure_url !== 'string' || !data.secure_url) {
      throw new Error('Cloudinary did not return a secure photo URL.');
    }

    return data.secure_url;
  } catch (error) {
    showTailorsToast(`Photo upload failed: ${error.message}`, 'error');
    throw error;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const DEFAULT_CENTER = [17.4239, 78.4480];
  const AREA_RADIUS = 3500;
  const HYDERABAD_BOUNDS = '17.34,78.34,17.50,78.55';
  const OVERPASS_ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
  ];
  const SERVICES = [
    'Alterations',
    'Embroidery',
    'Custom Upcycling',
    'Zipper Repair',
    'Denim Revival'
  ];
  const GENERIC_OSM_SHOP_NAMES = new Set([
    'tailor',
    'tailors',
    'tailor shop',
    'tailoring',
    'tailoring shop'
  ]);
  const areaCenters = {
    'Jubilee Hills': [17.4312, 78.4071],
    'Banjara Hills': [17.4126, 78.4487],
    Madhapur: [17.4484, 78.3915],
    Gachibowli: [17.4401, 78.3489],
    Kondapur: [17.4691, 78.3578],
    Secunderabad: [17.4399, 78.4983],
    Himayatnagar: [17.4065, 78.4867]
  };
  const BUILT_IN_TAILORS = [
    {
      id: 'partner-urban-silayi',
      name: 'Urban Silayi',
      lat: 17.4165,
      lng: 78.4426,
      area: 'Banjara Hills',
      street: 'Rd.10, Flat no-501, 5th floor Highness Maurya, Road No. 10, Gouri Shankar Nagar Colony, Banjara Hills, Hyderabad 500034',
      phone: '+91 97042 78194',
      is_verified: true,
      rating: 4.8,
      reviewCount: 198,
      price: 150,
      bio: 'Tailoring boutique in Banjara Hills.',
      services: [],
      source: 'partner'
    },
    {
      id: 'partner-mannat-boutique',
      name: 'Mannat Boutique',
      lat: 17.4258,
      lng: 78.4519,
      area: 'Punjagutta',
      street: '6/3/678/l/a/l, beside Jayalukkas Lane, Durga Nagar Colony, Punjagutta, Hyderabad 500082',
      phone: '+91 90145 44959',
      is_verified: true,
      rating: 5.0,
      reviewCount: 78,
      price: 120,
      bio: 'Boutique tailoring in Punjagutta.',
      services: [],
      source: 'partner'
    },
    {
      id: 'partner-rang-boutique',
      name: 'Rang Boutique',
      lat: 17.4094,
      lng: 78.4382,
      area: 'Banjara Hills',
      street: '6-3-240/3 Sharada Devi Street, Prem Nagar, Banjara Hills Road No. 12, adjacent to Virinchi Hospital, Hyderabad 500004',
      phone: '+91 99634 24075',
      is_verified: true,
      rating: 4.7,
      reviewCount: 21,
      price: 100,
      bio: 'Boutique tailoring in Banjara Hills.',
      services: [],
      source: 'partner'
    },
    {
      id: 'osm-node-7113998287',
      osmType: 'node',
      osmId: '7113998287',
      name: 'Tailorman',
      lat: 17.4297928,
      lng: 78.4093822,
      area: 'Jubilee Hills',
      street: 'Jubilee Hills Road No 36'
    },
    {
      id: 'osm-node-5405054240',
      osmType: 'node',
      osmId: '5405054240',
      name: 'Golden women desigñer',
      lat: 17.4370671,
      lng: 78.3660945,
      area: 'Kondapur',
      street: 'Old Bombay Road',
      phone: '+918143522417'
    },
    {
      id: 'osm-node-7025820828',
      osmType: 'node',
      osmId: '7025820828',
      name: 'Ladies Tailoring',
      lat: 17.4492939,
      lng: 78.3909745,
      area: 'Ayyappa Society Colony',
      street: '60 Feet Road'
    },
    {
      id: 'osm-way-356163814',
      osmType: 'way',
      osmId: '356163814',
      name: 'Haripriya Ladies Tailors',
      lat: 17.460544,
      lng: 78.355132,
      area: 'Sriram Nagar',
      street: 'Sriram Nagar Road'
    },
    {
      id: 'osm-node-6308240127',
      osmType: 'node',
      osmId: '6308240127',
      name: 'Ashoka Tailors',
      lat: 17.4071715,
      lng: 78.4858842,
      area: 'Domalguda',
      street: 'Street No. 10'
    },
    {
      id: 'osm-node-6996493086',
      osmType: 'node',
      osmId: '6996493086',
      name: "Regent men's tailor",
      lat: 17.4372189,
      lng: 78.498914,
      area: 'Marredpally',
      street: 'Regimental Bazar Main Road'
    },
    {
      id: 'osm-node-6996517585',
      osmType: 'node',
      osmId: '6996517585',
      name: 'S.S. Ladies Tailor',
      lat: 17.4371518,
      lng: 78.4987921,
      area: 'Marredpally',
      street: 'Regimental Bazar Main Road'
    },
    {
      id: 'osm-node-7135117047',
      osmType: 'node',
      osmId: '7135117047',
      name: 'MKS Fancy Design & Ladies Tailor',
      lat: 17.4032773,
      lng: 78.3910339,
      area: 'Manikonda',
      street: 'Huda Colony Main Road'
    }
  ];

  const mapElement = document.getElementById('tailors-map');
  const cardList = document.getElementById('tailors-card-list');
  const areaFilter = document.getElementById('area-filter');
  const serviceFilter = document.getElementById('service-filter');
  const ratingFilter = document.getElementById('rating-filter');
  const resultsLabel = document.getElementById('tailors-results');
  const fetchStatus = document.getElementById('tailors-fetch-status');
  const emptyMessage = document.getElementById('tailors-empty');
  const bookingDialog = document.getElementById('booking-dialog');
  const bookingForm = document.getElementById('booking-form');
  const bookingConfirmation = document.getElementById('booking-confirmation');
  const suggestDialog = document.getElementById('suggest-dialog');
  const suggestForm = document.getElementById('suggest-form');
  const suggestMessage = document.getElementById('suggest-message');
  const registerDialog = document.getElementById('register-dialog');
  const registerForm = document.getElementById('register-form');
  const registerMessage = document.getElementById('register-message');
  const reviewDialog = document.getElementById('review-dialog');
  const reviewForm = document.getElementById('review-form');
  const reviewMessage = document.getElementById('review-message');
  let activeBookingShop = null;
  let activeReviewShop = null;
  let supabaseClient = null;
  let remoteTailors = [];
  let currentUserData = null;
  let currentArea = 'all';
  let liveShops = BUILT_IN_TAILORS
    .map((shop) => normalizeStoredShop({
      ...shop,
      services: shop.services || ['Alterations'],
      bio: shop.bio || 'OpenStreetMap-listed tailor. Contact the shop to confirm current services.',
      is_verified: Boolean(shop.is_verified),
      rating: shop.rating || 0,
      reviewCount: shop.reviewCount || 0,
      price: shop.price || null,
      image: shop.image || 'assets/sewing-repair.jpg',
      source: shop.source || 'osm'
    }, Boolean(shop.is_verified)))
    .filter(Boolean);
  const builtInShops = liveShops.slice();
  let submittedShops = readStoredArray('atelier_submitted_tailors');
  let verifiedShops = readStoredArray('atelier_verified_tailors');
  let reviews = readStoredArray('atelier_tailor_reviews');
  let requestId = 0;
  let activeRequestController = null;
  let hoverTimeout = 0;

  function readStoredArray(key) {
    try {
      const stored = window.localStorage.getItem(key);
      if (!stored) return [];
      const value = JSON.parse(stored);
      if (!Array.isArray(value)) {
        throw new Error(`Stored value for ${key} is not a list.`);
      }
      return value;
    } catch (error) {
      console.error(`Unable to read ${key} from localStorage.`, error);
      showTailorsToast(`Could not load saved ${key.replace('atelier_', '').replace(/_/g, ' ')}.`, 'error');
      return [];
    }
  }

  function saveStoredArray(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Unable to save ${key} to localStorage.`, error);
      showTailorsToast('Could not save your change. Check browser storage and try again.', 'error');
      return false;
    }
  }

  function escapeHTML(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeImageUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return 'assets/sewing-repair.jpg';
    try {
      const imageUrl = new URL(value, window.location.href);
      if (imageUrl.protocol === 'https:' || imageUrl.origin === window.location.origin) {
        return imageUrl.href;
      }
    } catch (error) {
      console.error('Ignoring an invalid tailor photo URL.', error);
    }
    return 'assets/sewing-repair.jpg';
  }

  function toTelHref(value) {
    if (typeof value !== 'string') return '';
    const phone = value.replace(/[^\d+]/g, '');
    return /^\+?\d{5,15}$/.test(phone) ? `tel:${phone}` : '';
  }

  function normalizeStoredShop(raw, verified) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const name = String(raw.name || raw.shopName || raw.shop || '').trim();
    const lat = Number(raw.lat);
    const lng = Number(raw.lng == null ? raw.lon : raw.lng);
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    const phone = String(raw.phone || raw.contact_info || raw.contact || raw.contactPhone || '').trim();
    const rawServices = raw.services || raw.specialties || raw.specialty || raw.specialization;
    const services = [...new Set((Array.isArray(rawServices) ? rawServices : [rawServices])
      .flatMap((service) => String(service || '').split(/[,;|]/))
      .map((service) => service.trim())
      .filter((service) => service && service.length <= 60))];
    const type = String(raw.osmType || raw.osm_type || '');
    const osmId = raw.osmId == null ? raw.osm_id : raw.osmId;
    const id = String(raw.id || (osmId != null
      ? `osm-${type || 'node'}-${osmId}`
      : `local-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${lat.toFixed(4)}-${lng.toFixed(4)}`));

    return {
      id,
      name,
      lat,
      lng,
      area: String(raw.area || raw.neighborhood || raw['addr:suburb'] || raw['addr:street'] || 'Hyderabad'),
      street: String(raw.street || raw.address || raw['addr:street'] || ''),
      phone: phone || 'Call for inquiry',
      phoneHref: toTelHref(phone),
      priceRange: String(raw.price_range || raw.priceRange || '').trim(),
      is_verified: Boolean(verified),
      rating: Number.isFinite(Number(raw.rating)) ? Math.max(0, Math.min(5, Number(raw.rating))) : 0,
      reviewCount: Number.isFinite(Number(raw.reviewCount)) ? Math.max(0, Number(raw.reviewCount)) : 0,
      price: Number.isFinite(Number(raw.price)) && Number(raw.price) > 0 ? Number(raw.price) : null,
      bio: String(raw.bio || 'A local tailor listed by the Atelier community.'),
      services,
      menu: String(raw.menu || ''),
      image: safeImageUrl(raw.image),
      gallery: Array.isArray(raw.gallery) ? raw.gallery.map(safeImageUrl) : [],
      userId: String(raw.user_id || raw.userId || ''),
      username: String(raw.username || raw.handle || raw.profile_username || ''),
      osmType: type,
      osmId: osmId == null ? '' : String(osmId),
      source: String(raw.source || (osmId != null ? 'osm' : 'community'))
    };
  }

  function mapDatabaseTailor(row, profile) {
    const area = String(row.neighborhood || row.area || profile && profile.neighborhood || 'Hyderabad');
    const center = areaCenters[area] || DEFAULT_CENTER;
    const latitude = Number(row.lat == null ? row.latitude : row.lat);
    const longitude = Number(row.lng == null ? (row.lon == null ? row.longitude : row.lon) : row.lng);
    return {
      ...row,
      id: String(row.id || `tailor-${row.user_id || row.name}`),
      name: String(row.name || row.display_name || row.studio_name || 'Atelier Tailor'),
      username: String(row.username || row.handle || profile && profile.username || ''),
      lat: Number.isFinite(latitude) ? latitude : center[0],
      lng: Number.isFinite(longitude) ? longitude : center[1],
      area,
      street: String(row.address || row.street || ''),
      services: row.services || row.specialties || row.specialty || row.specialization || [],
      phone: String(row.phone || row.contact_info || row.contact || row.contact_phone || ''),
      priceRange: String(row.price_range || row.priceRange || ''),
      bio: String(row.bio || 'Tailor / designer in the Atelier directory.'),
      image: row.image || row.avatar_url || row.image_url || 'assets/sewing-repair.jpg',
      is_verified: Boolean(row.is_verified || row.verified),
      source: 'supabase',
      user_id: String(row.user_id || '')
    };
  }

  function profileUrlForShop(shop) {
    const username = String(shop.username || '').trim().replace(/^@/, '');
    if (username) return `profile.html?user=${encodeURIComponent(username)}`;
    const userId = String(shop.userId || shop.user_id || '').trim();
    return userId ? `profile.html?id=${encodeURIComponent(userId)}` : '';
  }

  async function loadRemoteTailors() {
    try {
      if (!window.atelierSupabase) throw new Error('Supabase is unavailable.');
      supabaseClient = window.atelierSupabase.getClient();
      const { data, error } = await supabaseClient
        .from('tailors')
        .select('*');
      if (error) throw error;

      const userIds = [...new Set((data || []).map((row) => row.user_id).filter(Boolean).map(String))];
      const profilesById = new Map();
      if (userIds.length) {
        const { data: profiles, error: profileError } = await supabaseClient
          .from('profiles')
          .select('id, username, display_name')
          .in('id', userIds);
        if (profileError) {
          console.warn('Tailor profile usernames could not be loaded.', profileError);
        } else {
          (profiles || []).forEach((profile) => profilesById.set(String(profile.id), profile));
        }
      }

      remoteTailors = (data || []).map((row) => (
        mapDatabaseTailor(row, profilesById.get(String(row.user_id || '')))
      ));
      refreshServiceFilter();
      renderShops();
    } catch (error) {
      console.error('Unable to load Atelier tailors from Supabase.', error);
      showTailorsToast('Atelier directory profiles could not be loaded. Showing local and map listings.', 'error');
    }
  }

  function refreshServiceFilter() {
    const selected = serviceFilter.value;
    const options = new Set([
      ...SERVICES,
      ...getAllShops().flatMap((shop) => shop.services)
    ]);
    options.forEach((service) => {
      if ([...serviceFilter.options].some((option) => option.value === service)) return;
      const option = document.createElement('option');
      option.value = service;
      option.textContent = service;
      serviceFilter.append(option);
    });
    serviceFilter.value = [...serviceFilter.options].some((option) => option.value === selected)
      ? selected
      : 'all';
  }

  function normalizeOsmElement(element) {
    const tags = element && element.tags;
    const name = typeof (tags && tags.name) === 'string' ? tags.name.trim() : '';
    if (!name || GENERIC_OSM_SHOP_NAMES.has(name.toLocaleLowerCase().replace(/\s+/g, ' '))) return null;
    const lat = Number(element.lat == null ? element.center && element.center.lat : element.lat);
    const lng = Number(element.lon == null ? element.center && element.center.lon : element.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    const description = String(tags.description || tags.services || tags.service || '').toLowerCase();
    const serviceKeywords = {
      Alterations: /alter|hemm?ing|fit(?:ting)?/,
      Embroidery: /embroider|stitch work/,
      'Custom Upcycling': /upcycl|redesign|refashion/,
      'Zipper Repair': /zipper|zip repair/,
      'Denim Revival': /denim|jeans|patch/
    };
    const services = SERVICES.filter((service) => serviceKeywords[service].test(description));
    const phone = String(tags.phone || tags['contact:phone'] || tags['contact:mobile'] || '').trim();
    const tagsRating = Number(tags.rating);
    const osmType = String(element.type || 'node');

    return {
      id: `osm-${osmType}-${element.id}`,
      name,
      lat,
      lng,
      area: String(tags['addr:suburb'] || tags['addr:street'] || 'Hyderabad'),
      street: String(tags['addr:street'] || ''),
      phone: phone || 'Call for inquiry',
      phoneHref: toTelHref(phone),
      is_verified: false,
      rating: Number.isFinite(tagsRating) ? Math.max(0, Math.min(5, tagsRating)) : 0,
      reviewCount: 0,
      price: null,
      bio: String(tags.description || 'Local tailor listed on OpenStreetMap.'),
      services,
      menu: '',
      image: 'assets/sewing-repair.jpg',
      gallery: [],
      osmType,
      osmId: String(element.id),
      source: 'osm'
    };
  }

  function getRating(shop) {
    const shopReviews = reviews.filter((review) => (
      review && (review.shopId === shop.id || review.shop_id === shop.id)
    ));
    const baseCount = shop.reviewCount || (shop.rating > 0 ? 1 : 0);
    const baseTotal = shop.rating * baseCount;
    const reviewTotal = shopReviews.reduce((sum, review) => {
      const rating = Number(review.rating);
      return sum + (Number.isFinite(rating) ? Math.max(1, Math.min(5, rating)) : 0);
    }, 0);
    const count = baseCount + shopReviews.length;
    return {
      value: count ? (baseTotal + reviewTotal) / count : 0,
      count,
      photos: shopReviews.map((review) => review.photoUrl).filter(Boolean)
    };
  }

  function getAllShops() {
    const shops = [];
    const addShop = (shop) => {
      const existingIndex = shops.findIndex((existing) => (
        existing.id === shop.id
        || (
          existing.osmId
          && shop.osmId
          && existing.osmId === shop.osmId
          && (!existing.osmType || !shop.osmType || existing.osmType === shop.osmType)
        )
        || (
          existing.name.trim().toLocaleLowerCase() === shop.name.trim().toLocaleLowerCase()
          && distanceMeters([existing.lat, existing.lng], [shop.lat, shop.lng]) <= 100
        )
      ));

      if (existingIndex === -1) {
        shops.push(shop);
        return;
      }

      const existing = shops[existingIndex];
      const preferred = shop.is_verified || !existing.is_verified ? shop : existing;
      const secondary = preferred === shop ? existing : shop;
      shops[existingIndex] = {
        ...secondary,
        ...preferred,
        id: existing.id,
        is_verified: existing.is_verified || shop.is_verified,
        phone: preferred.phoneHref ? preferred.phone : secondary.phone,
        phoneHref: preferred.phoneHref || secondary.phoneHref,
        services: preferred.services.length ? preferred.services : secondary.services,
        priceRange: preferred.priceRange || secondary.priceRange,
        price: preferred.price || secondary.price,
        bio: preferred.bio === 'A local tailor listed by the Atelier community.'
          ? secondary.bio
          : preferred.bio,
        image: preferred.image === new URL('assets/sewing-repair.jpg', window.location.href).href
          ? secondary.image
          : preferred.image,
        gallery: preferred.gallery.length ? preferred.gallery : secondary.gallery
      };
    };

    liveShops.forEach(addShop);
    remoteTailors
      .map((shop) => normalizeStoredShop(shop, Boolean(shop.is_verified)))
      .filter(Boolean)
      .forEach(addShop);
    submittedShops
      .map((shop) => normalizeStoredShop(shop, false))
      .filter(Boolean)
      .forEach(addShop);
    verifiedShops
      .map((shop) => normalizeStoredShop(shop, true))
      .filter(Boolean)
      .forEach(addShop);
    return shops;
  }

  function distanceMeters(pointA, pointB) {
    const radians = (degrees) => degrees * Math.PI / 180;
    const latitudeDelta = radians(pointB[0] - pointA[0]);
    const longitudeDelta = radians(pointB[1] - pointA[1]);
    const value = Math.sin(latitudeDelta / 2) ** 2
      + Math.cos(radians(pointA[0])) * Math.cos(radians(pointB[0]))
      * Math.sin(longitudeDelta / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  }

  function matchesArea(shop) {
    if (currentArea === 'all') return true;
    const center = areaCenters[currentArea];
    if (!center) return true;
    if (shop.area.toLowerCase().includes(currentArea.toLowerCase())) return true;
    return distanceMeters(center, [shop.lat, shop.lng]) <= AREA_RADIUS;
  }

  function claimUrl(shop) {
    const params = new URLSearchParams({
      role: 'tailor',
      shop: shop.name,
      lat: String(shop.lat),
      lng: String(shop.lng),
      area: shop.area,
      phone: shop.phoneHref ? shop.phone : ''
    });
    if (shop.osmId) {
      params.set('osm_type', shop.osmType);
      params.set('osm_id', shop.osmId);
    }
    return `signup.html?${params.toString()}`;
  }

  function statusBadge(shop) {
    return shop.is_verified
      ? '<span class="tailor-verified"><span aria-hidden="true">✓</span> Verified Partner</span>'
      : '<span class="tailor-community-badge">Community Listed</span>';
  }

  function ratingMarkup(rating) {
    return rating.value
      ? `<span class="tailor-rating">★ ${rating.value.toFixed(1)}</span><span>${rating.count} ${rating.count === 1 ? 'review' : 'reviews'}</span>`
      : '<span class="tailor-rating tailor-rating--empty">☆ No reviews yet</span>';
  }

  function photoGalleryMarkup(shop, rating) {
    const photos = [...shop.gallery, ...rating.photos]
      .map(safeImageUrl)
      .filter((photo, index, list) => list.indexOf(photo) === index)
      .slice(0, 5);
    if (!photos.length) return '';
    return `<div class="tailor-card__gallery" aria-label="Community review photos">${photos.map((photo, index) => (
      `<img src="${escapeHTML(photo)}" alt="Review photo ${index + 1} for ${escapeHTML(shop.name)}" loading="lazy">`
    )).join('')}</div>`;
  }

  function reviewTextMarkup(shop) {
    const latestReview = reviews.filter((review) => (
      review && (review.shopId === shop.id || review.shop_id === shop.id)
    )).slice(-1)[0];
    if (!latestReview || !latestReview.text) return '';
    return `<blockquote class="tailor-card__community-review">${escapeHTML(latestReview.text)}</blockquote>`;
  }

  function serviceTags(shop) {
    if (!shop.services.length) {
      return '<span class="tailors-tag tailors-tag--muted">Specialties not listed</span>';
    }
    return shop.services.map((service) => `<span class="tailors-tag">${escapeHTML(service)}</span>`).join('');
  }

  function phoneMarkup(shop, buttonLabel) {
    if (!shop.phoneHref) return '';
    return `<a class="tailors-button tailors-button--quiet" href="${escapeHTML(shop.phoneHref)}">${buttonLabel}</a>`;
  }

  function cardMarkup(shop) {
    const rating = getRating(shop);
    const profileUrl = profileUrlForShop(shop);
    const profileLink = profileUrl
      ? `<a class="tailor-profile-link" href="${escapeHTML(profileUrl)}">View Atelier profile →</a>`
      : '';
    const address = shop.is_verified && shop.street
      ? `<address class="tailor-card__address">${escapeHTML(shop.street)}</address>`
      : '';
    const phone = shop.phoneHref
      ? `<a href="${escapeHTML(shop.phoneHref)}">${escapeHTML(shop.phone)}</a>`
      : escapeHTML(shop.phone || 'Call for inquiry');
    const verifiedDetails = shop.is_verified
      ? `<div class="tailor-card__details">
          <p><span>STARTING</span><strong>${shop.price ? `₹${escapeHTML(shop.price)}` : 'Ask for a quote'}</strong></p>
          <p><span>PHONE</span>${phone}</p>
        </div>
        ${shop.menu ? `<p class="tailor-card__menu"><span>MENU HIGHLIGHT</span>${escapeHTML(shop.menu)}</p>` : ''}`
      : `<div class="tailor-card__details tailor-card__details--community">
          <p><span>NEIGHBORHOOD</span><strong>${escapeHTML(shop.area)}</strong></p>
          ${shop.priceRange ? `<p><span>PRICE RANGE</span><strong>${escapeHTML(shop.priceRange)}</strong></p>` : ''}
          <p><span>CONTACT</span>${phone}</p>
        </div>`;
    const nameMarkup = profileUrl
      ? `<a href="${escapeHTML(profileUrl)}">${escapeHTML(shop.name)}</a>`
      : escapeHTML(shop.name);
    const actions = shop.is_verified
      ? `<div class="tailor-card__actions">
          <button class="tailors-button tailors-button--primary" type="button" data-book-shop="${escapeHTML(shop.id)}">Book Repair</button>
          ${phoneMarkup(shop, 'Call')}
          <button class="tailors-button tailors-button--review" type="button" data-review-shop="${escapeHTML(shop.id)}">+ Review &amp; Photo</button>
        </div>`
      : `<div class="tailor-card__actions tailor-card__actions--community">
          ${phoneMarkup(shop, 'Call')}
          <button class="tailors-button tailors-button--review" type="button" data-review-shop="${escapeHTML(shop.id)}">+ Review &amp; Photo</button>
        </div>
        <a class="tailor-claim-link" href="${escapeHTML(claimUrl(shop))}">Are you this tailor? Claim &amp; get verified →</a>`;

    return `
      <article class="tailor-card" data-shop-id="${escapeHTML(shop.id)}" tabindex="0">
        <img class="tailor-card__image" src="${escapeHTML(safeImageUrl(shop.image))}" alt="" loading="lazy">
        <div class="tailor-card__body">
          <div class="tailor-card__title-row">
            <h2>${nameMarkup}</h2>
            ${statusBadge(shop)}
          </div>
          <div class="tailor-card__meta">${ratingMarkup(rating)}<span>${escapeHTML(shop.area)}</span></div>
          ${address}
          <p class="tailor-card__bio">${escapeHTML(shop.bio)}</p>
          <div class="tailors-tags">${serviceTags(shop)}</div>
          ${profileLink}
          ${reviewTextMarkup(shop)}
          ${verifiedDetails}
          ${photoGalleryMarkup(shop, rating)}
          ${actions}
        </div>
      </article>`;
  }

  function popupMarkup(shop) {
    const rating = getRating(shop);
    const verifiedContent = shop.is_verified
      ? `<p class="tailor-popup__price">Starting at <strong>${shop.price ? `₹${escapeHTML(shop.price)}` : 'Ask for a quote'}</strong></p>
          <div class="tailor-popup__actions">
            <button class="tailors-button tailors-button--primary" type="button" data-book-shop="${escapeHTML(shop.id)}">Book Repair</button>
            ${phoneMarkup(shop, 'Call')}
          </div>`
      : `<div class="tailor-popup__actions">${phoneMarkup(shop, 'Call')}</div>
          <a class="tailor-claim-link" href="${escapeHTML(claimUrl(shop))}">Are you this tailor? Claim &amp; get verified →</a>`;
    return `
      <div class="tailor-popup">
        <img class="tailor-popup__image" src="${escapeHTML(safeImageUrl(shop.image))}" alt="">
        <div class="tailor-popup__content">
          <div class="tailor-popup__title"><strong>${escapeHTML(shop.name)}</strong>${statusBadge(shop)}</div>
          <p class="tailor-popup__rating">${rating.value ? `★ ${rating.value.toFixed(1)} · ${rating.count} ${rating.count === 1 ? 'review' : 'reviews'}` : '☆ No reviews yet'} <span>· ${escapeHTML(shop.area)}</span></p>
          ${shop.is_verified && shop.street ? `<address class="tailor-popup__address">${escapeHTML(shop.street)}</address>` : ''}
          <div class="tailors-tags">${serviceTags(shop)}</div>
          ${verifiedContent}
        </div>
      </div>`;
  }

  function makePin(shop) {
    const rating = getRating(shop);
    const label = shop.is_verified
      ? (rating.value && shop.price
        ? `★ ${rating.value.toFixed(1)} • ₹${shop.price}`
        : 'Verified Partner')
      : (shop.name.length > 16 ? `${shop.name.slice(0, 13).trimEnd()}...` : shop.name);
    return L.divIcon({
      className: 'atelier-map-pin-shell',
      html: `<span class="atelier-map-pin ${shop.is_verified ? 'atelier-map-pin--verified' : 'atelier-map-pin--community'}" title="${escapeHTML(shop.name)}"><strong>${escapeHTML(label)}</strong></span>`,
      iconSize: [140, 40],
      iconAnchor: [70, 40],
      popupAnchor: [0, -42]
    });
  }

  const map = L.map(mapElement, {
    center: DEFAULT_CENTER,
    zoom: 12,
    scrollWheelZoom: true
  });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const markerById = new Map();
  const markerLayer = L.featureGroup().addTo(map);
  let visibleShops = [];

  function highlightShop(shopId, shouldScroll) {
    cardList.querySelectorAll('.tailor-card').forEach((card) => {
      const active = card.dataset.shopId === shopId;
      card.classList.toggle('is-active', active);
      if (active && shouldScroll) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    markerById.forEach((marker, id) => {
      const active = id === shopId;
      marker.setZIndexOffset(active ? 1000 : 0);
      const pin = marker.getElement() && marker.getElement().querySelector('.atelier-map-pin');
      if (pin) pin.classList.toggle('atelier-map-pin--active', active);
    });
  }

  function clearHighlight(shopId) {
    const card = cardList.querySelector(`[data-shop-id="${shopId}"]`);
    if (card) card.classList.remove('is-active');
    const marker = markerById.get(shopId);
    if (marker && !marker.isPopupOpen()) {
      marker.setZIndexOffset(0);
      const pin = marker.getElement() && marker.getElement().querySelector('.atelier-map-pin');
      if (pin) pin.classList.remove('atelier-map-pin--active');
    }
  }

  function openShopPopup(shop) {
    const marker = markerById.get(shop.id);
    if (!marker) return;
    marker.openPopup();
    highlightShop(shop.id, true);
  }

  function renderShops() {
    const selectedService = serviceFilter.value;
    const minimumRating = Number(ratingFilter.value);
    visibleShops = getAllShops().filter((shop) => {
      const rating = getRating(shop).value;
      return matchesArea(shop)
        && (!selectedService || selectedService === 'all' || shop.services.includes(selectedService))
        && rating >= minimumRating;
    });
    cardList.innerHTML = visibleShops.map(cardMarkup).join('');
    const resultArea = currentArea === 'all' ? 'Hyderabad' : currentArea;
    resultsLabel.textContent = `Showing ${visibleShops.length} ${resultArea} tailors`;
    emptyMessage.textContent = fetchStatus.hidden
      ? 'No nearby tailor listings match these filters. Try another area or service.'
      : 'Looking for tailor listings nearby...';
    emptyMessage.hidden = visibleShops.length > 0;
    cardList.hidden = visibleShops.length === 0;

    markerLayer.clearLayers();
    markerById.clear();
    visibleShops.forEach((shop) => {
      const marker = L.marker([shop.lat, shop.lng], { icon: makePin(shop), riseOnHover: true });
      marker.bindPopup(popupMarkup(shop), { closeButton: true, minWidth: 280, maxWidth: 310 });
      marker.on('mouseover', () => {
        window.clearTimeout(hoverTimeout);
        marker.openPopup();
        highlightShop(shop.id, false);
      });
      marker.on('mouseout', () => {
        hoverTimeout = window.setTimeout(() => {
          if (!marker.isPopupOpen()) clearHighlight(shop.id);
        }, 500);
      });
      marker.on('popupclose', () => clearHighlight(shop.id));
      marker.on('click', () => {
        window.clearTimeout(hoverTimeout);
        openShopPopup(shop);
      });
      marker.addTo(markerLayer);
      markerById.set(shop.id, marker);
    });
  }

  function cacheKey() {
    return 'atelier_overpass_hyderabad_17.34_78.34_17.50_78.55_v1';
  }

  function mergeByShopName(additionalShops) {
    const shopsByName = new Map();
    [...builtInShops, ...additionalShops].forEach((shop) => {
      const key = shop.name.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
      const existing = shopsByName.get(key);
      if (!existing) {
        shopsByName.set(key, shop);
        return;
      }

      shopsByName.set(key, {
        ...existing,
        ...shop,
        id: existing.id,
        name: existing.name,
        is_verified: existing.is_verified || shop.is_verified,
        area: shop.area === 'Hyderabad' ? existing.area : shop.area,
        street: shop.street || existing.street,
        phone: shop.phoneHref ? shop.phone : existing.phone,
        phoneHref: shop.phoneHref || existing.phoneHref,
        services: shop.services.length ? shop.services : existing.services,
        priceRange: shop.priceRange || existing.priceRange,
        price: shop.price || existing.price,
        rating: shop.rating || existing.rating,
        reviewCount: shop.reviewCount || existing.reviewCount,
        bio: shop.bio === 'Local tailor listed on OpenStreetMap.' ? existing.bio : shop.bio,
        image: shop.image === new URL('assets/sewing-repair.jpg', window.location.href).href
          ? existing.image
          : shop.image,
        gallery: shop.gallery.length ? shop.gallery : existing.gallery
      });
    });
    return [...shopsByName.values()];
  }

  function getCachedShops(key) {
    try {
      const cached = window.sessionStorage.getItem(key);
      if (!cached) return null;
      const entries = JSON.parse(cached);
      if (!Array.isArray(entries)) throw new Error('Cached Overpass results are not a list.');
      return entries.map((entry) => normalizeStoredShop(entry, false))
        .filter((shop) => shop && !GENERIC_OSM_SHOP_NAMES.has(
          shop.name.toLocaleLowerCase().replace(/\s+/g, ' ')
        ));
    } catch (error) {
      console.error('Unable to read the cached OpenStreetMap tailor results.', error);
      showTailorsToast('Could not read cached map results. Fetching fresh listings.', 'error');
      return null;
    }
  }

  async function fetchLiveTailors(forceRefresh = false) {
    const currentRequestId = ++requestId;
    if (activeRequestController) activeRequestController.abort();
    const cache = cacheKey();
    const cachedShops = forceRefresh ? null : getCachedShops(cache);
    if (cachedShops) {
      liveShops = mergeByShopName(cachedShops);
      fetchStatus.hidden = true;
      renderShops();
      return;
    }

    fetchStatus.textContent = 'Discovering local tailors...';
    fetchStatus.dataset.kind = 'loading';
    fetchStatus.hidden = false;
    renderShops();

    const bounds = `(${HYDERABAD_BOUNDS})`;
    const query = `[out:json][timeout:25];(node["shop"="tailor"]${bounds};way["shop"="tailor"]${bounds};node["craft"="tailor"]${bounds};way["craft"="tailor"]${bounds};);out center;`;
    const endpointErrors = [];

    try {
      for (const endpoint of OVERPASS_ENDPOINTS) {
        if (currentRequestId !== requestId) return;

        const controller = new AbortController();
        activeRequestController = controller;
        const timeout = window.setTimeout(() => controller.abort(), 25000);
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(query)}`,
            signal: controller.signal
          });
          if (!response.ok) {
            throw new Error(`${endpoint} returned ${response.status}.`);
          }
          const data = await response.json();
          if (!Array.isArray(data.elements)) {
            throw new Error(`${endpoint} returned an unexpected tailor listing response.`);
          }
          if (currentRequestId !== requestId) return;

          const liveResults = data.elements.map(normalizeOsmElement).filter(Boolean);
          liveShops = mergeByShopName(liveResults);
          try {
            window.sessionStorage.setItem(cache, JSON.stringify(liveResults));
          } catch (error) {
            console.error('Unable to cache OpenStreetMap tailor results.', error);
            showTailorsToast('Live listings loaded, but could not be cached for this session.', 'error');
          }
          return;
        } catch (error) {
          if (currentRequestId !== requestId) return;
          endpointErrors.push(error);
        } finally {
          window.clearTimeout(timeout);
          if (activeRequestController === controller) activeRequestController = null;
        }
      }

      if (currentRequestId !== requestId) return;
      console.error('All OpenStreetMap tailor endpoints failed; keeping the built-in listings.', endpointErrors);
    } finally {
      if (currentRequestId === requestId) {
        activeRequestController = null;
        fetchStatus.hidden = true;
        renderShops();
      }
    }
  }

  [serviceFilter, ratingFilter].forEach((filter) => {
    filter.addEventListener('change', renderShops);
  });
  areaFilter.addEventListener('change', () => {
    currentArea = areaFilter.value;
    const center = areaCenters[currentArea] || DEFAULT_CENTER;
    map.flyTo(center, currentArea === 'all' ? 12 : 14, { duration: 0.8 });
    renderShops();
  });
  document.getElementById('search-map-area').addEventListener('click', () => {
    currentArea = 'all';
    areaFilter.value = 'all';
    fetchLiveTailors(true);
  });

  cardList.addEventListener('pointerover', (event) => {
    const card = event.target.closest('.tailor-card');
    if (card && !card.contains(event.relatedTarget)) {
      highlightShop(card.dataset.shopId, false);
    }
  });
  cardList.addEventListener('pointerout', (event) => {
    const card = event.target.closest('.tailor-card');
    if (card && !card.contains(event.relatedTarget)) {
      card.classList.remove('is-active');
      const marker = markerById.get(card.dataset.shopId);
      if (marker && !marker.isPopupOpen()) clearHighlight(card.dataset.shopId);
    }
  });

  function openBooking(shopId) {
    activeBookingShop = visibleShops.find((shop) => shop.id === shopId) || null;
    if (!activeBookingShop || !activeBookingShop.is_verified) return;
    document.getElementById('booking-shop-name').textContent = activeBookingShop.name;
    bookingConfirmation.hidden = true;
    bookingForm.reset();
    const today = new Date();
    const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    document.getElementById('booking-date').min = localDate;
    bookingDialog.showModal();
  }

  cardList.addEventListener('click', (event) => {
    const reviewButton = event.target.closest('[data-review-shop]');
    if (reviewButton) {
      event.stopPropagation();
      openReview(reviewButton.dataset.reviewShop);
      return;
    }
    const bookingButton = event.target.closest('[data-book-shop]');
    if (bookingButton) {
      event.stopPropagation();
      openBooking(bookingButton.dataset.bookShop);
      return;
    }
    if (event.target.closest('a')) return;
    const card = event.target.closest('.tailor-card');
    const shop = card && visibleShops.find((item) => item.id === card.dataset.shopId);
    if (shop) {
      map.flyTo([shop.lat, shop.lng], 15, { duration: 0.7 });
      openShopPopup(shop);
    }
  });
  cardList.addEventListener('keydown', (event) => {
    const card = event.target.closest('.tailor-card');
    if (card && event.target === card && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      const shop = visibleShops.find((item) => item.id === card.dataset.shopId);
      if (shop) {
        map.flyTo([shop.lat, shop.lng], 15, { duration: 0.7 });
        openShopPopup(shop);
      }
    }
  });
  mapElement.addEventListener('click', (event) => {
    const bookingButton = event.target.closest('[data-book-shop]');
    if (bookingButton) {
      openBooking(bookingButton.dataset.bookShop);
      return;
    }
    const reviewButton = event.target.closest('[data-review-shop]');
    if (reviewButton) openReview(reviewButton.dataset.reviewShop);
  });

  bookingForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!activeBookingShop || !bookingForm.reportValidity()) return;

    const formData = new FormData(bookingForm);
    const booking = {
      shop: activeBookingShop.name,
      shopId: activeBookingShop.id,
      garment: String(formData.get('garment')),
      service: String(formData.get('service')),
      date: String(formData.get('date')),
      createdAt: new Date().toISOString()
    };
    try {
      window.localStorage.setItem('atelierLastDemoBooking', JSON.stringify(booking));
    } catch (error) {
      console.error('Unable to save the demo tailor booking.', error);
      showTailorsToast('Could not save your demo request. Check browser storage and try again.', 'error');
      return;
    }
    bookingConfirmation.textContent = `Demo request saved for ${booking.shop} on ${booking.date}. The tailor has not been contacted.`;
    bookingConfirmation.hidden = false;
    bookingForm.querySelector('.tailors-booking-actions').hidden = true;
  });

  function closeDialogOnBackdrop(dialog, form) {
    dialog.querySelectorAll('[data-close-booking], [data-close-suggest], [data-close-register], [data-close-review]').forEach((button) => {
      button.addEventListener('click', () => dialog.close());
    });
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', () => {
      if (form) {
        const actions = form.querySelector('.tailors-booking-actions');
        if (actions) actions.hidden = false;
      }
    });
  }
  closeDialogOnBackdrop(bookingDialog, bookingForm);
  closeDialogOnBackdrop(suggestDialog, suggestForm);
  closeDialogOnBackdrop(registerDialog, registerForm);
  closeDialogOnBackdrop(reviewDialog, reviewForm);

  document.getElementById('near-me-button').addEventListener('click', () => {
    if (!navigator.geolocation) {
      showTailorsToast('Location is not available in this browser. You can still explore the map.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const you = [position.coords.latitude, position.coords.longitude];
        map.flyTo(you, 15, { duration: 0.8 });
        currentArea = 'all';
        areaFilter.value = 'all';
        if (map.youMarker) map.removeLayer(map.youMarker);
        map.youMarker = L.circleMarker(you, {
          radius: 9,
          color: '#FAF8F2',
          weight: 3,
          fillColor: '#F7D8DC',
          fillOpacity: 1
        }).addTo(map).bindTooltip('You are here');
        showTailorsToast('Showing your location. Hyderabad tailor listings remain visible.');
      },
      () => showTailorsToast('We could not access your location. You can still explore the map.'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  });

  document.getElementById('open-suggest-dialog').addEventListener('click', () => {
    suggestMessage.hidden = true;
    suggestForm.reset();
    suggestDialog.showModal();
  });

  async function getCurrentRegistrationUser() {
    if (!window.atelierSupabase) throw new Error('Supabase authentication is unavailable.');
    supabaseClient = window.atelierSupabase.getClient();
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    const user = data.session && data.session.user;
    if (!user) return null;
    let profile = window.atelierSupabase.readCachedProfile();
    if (!profile || profile.id !== user.id) profile = null;
    const metadata = user.user_metadata || {};
    const rawUsername = String(profile && profile.username || metadata.username || metadata.user_name || user.email || '');
    return {
      id: user.id,
      username: rawUsername.replace(/^@/, '').split('@')[0],
      name: String(profile && profile.display_name || metadata.display_name || metadata.full_name || user.email || 'Atelier Member')
    };
  }

  document.getElementById('open-register-dialog').addEventListener('click', async () => {
    try {
      currentUserData = await getCurrentRegistrationUser();
      if (!currentUserData) {
        window.atelierAuth.prepareLoginRedirect();
        window.location.assign('login.html');
        return;
      }
      registerForm.reset();
      document.getElementById('register-name').value = currentUserData.name;
      registerMessage.hidden = true;
      registerMessage.replaceChildren();
      registerDialog.showModal();
    } catch (error) {
      console.error('Unable to verify the Atelier account for tailor registration.', error);
      showTailorsToast(`Could not open registration: ${error.message}`, 'error');
    }
  });

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!registerForm.reportValidity()) return;
    const submitButton = registerForm.querySelector('[type="submit"]');
    const formData = new FormData(registerForm);
    submitButton.disabled = true;
    submitButton.textContent = 'Saving profile...';
    registerMessage.hidden = true;

    try {
      currentUserData = await getCurrentRegistrationUser();
      if (!currentUserData) throw new Error('Your sign-in has expired. Log in again before registering.');
      const neighborhood = String(formData.get('neighborhood') || '');
      const specialty = String(formData.get('specialty') || '').trim();
      const row = {
        user_id: currentUserData.id,
        name: String(formData.get('name') || '').trim(),
        specialty,
        neighborhood,
        bio: String(formData.get('bio') || '').trim()
      };
      const { data, error } = await supabaseClient
        .from('tailors')
        .insert(row)
        .select('*')
        .single();
      if (error) throw error;
      if (!data) throw new Error('Supabase did not return the registered tailor profile.');

      const registered = mapDatabaseTailor({
        ...data,
        username: data.username || currentUserData.username,
        name: data.name || row.name,
        specialty: data.specialty || specialty,
        neighborhood: data.neighborhood || neighborhood,
        bio: data.bio || row.bio
      }, currentUserData);
      remoteTailors = [registered, ...remoteTailors.filter((shop) => shop.id !== registered.id)];
      refreshServiceFilter();
      areaFilter.value = neighborhood;
      currentArea = neighborhood;
      map.flyTo([registered.lat, registered.lng], 14, { duration: 0.7 });
      renderShops();

      const profileLink = document.createElement('a');
      profileLink.href = profileUrlForShop(registered) || 'profile.html';
      profileLink.textContent = 'View your Atelier profile';
      profileLink.className = 'tailor-profile-link';
      registerMessage.replaceChildren(
        document.createTextNode('Your profile was added to the tailor directory. '),
        profileLink
      );
      registerMessage.dataset.kind = 'success';
      registerMessage.hidden = false;
      showTailorsToast('Your tailor / designer profile was registered.');
    } catch (error) {
      console.error('Unable to register the Atelier tailor profile.', error);
      registerMessage.textContent = `Your profile could not be registered: ${error.message || 'Please try again.'}`;
      registerMessage.dataset.kind = 'error';
      registerMessage.hidden = false;
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Add my profile';
    }
  });

  suggestForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!suggestForm.reportValidity()) return;
    const formData = new FormData(suggestForm);
    const name = String(formData.get('name') || '').trim();
    const area = String(formData.get('area') || '');
    const center = areaCenters[area];
    if (!name || !center) return;

    const sameAreaCount = submittedShops.filter((shop) => shop && shop.area === area).length;
    const phone = String(formData.get('phone') || '').trim();
    const shop = {
      id: `submitted-${Date.now()}`,
      name,
      area,
      street: String(formData.get('street') || '').trim(),
      lat: center[0] + (sameAreaCount * 0.0007),
      lng: center[1] + (sameAreaCount * 0.0007),
      phone: phone || 'Call for inquiry',
      services: formData.getAll('services').map(String).filter((service) => SERVICES.includes(service)),
      bio: 'A tailor suggested by the Atelier community.',
      is_verified: false,
      rating: 0,
      reviewCount: 0,
      price: null,
      image: 'assets/sewing-repair.jpg',
      source: 'community'
    };
    const nextSubmissions = [...submittedShops, shop];
    if (!saveStoredArray('atelier_submitted_tailors', nextSubmissions)) return;
    submittedShops = nextSubmissions;
    suggestDialog.close();
    areaFilter.value = area;
    currentArea = area;
    map.flyTo([shop.lat, shop.lng], 14, { duration: 0.7 });
    renderShops();
    showTailorsToast(`${name} was added to the community map.`);
  });

  function openReview(shopId) {
    activeReviewShop = visibleShops.find((shop) => shop.id === shopId) || null;
    if (!activeReviewShop) return;
    document.getElementById('review-shop-name').textContent = activeReviewShop.name;
    reviewMessage.hidden = true;
    reviewForm.reset();
    reviewDialog.showModal();
  }

  reviewForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!activeReviewShop || !reviewForm.reportValidity()) return;
    const submitButton = reviewForm.querySelector('[type="submit"]');
    const formData = new FormData(reviewForm);
    const rating = Number(formData.get('rating'));
    const reviewText = String(formData.get('review') || '').trim();
    const photoFile = formData.get('photo');
    let photoUrl = '';

    if (photoFile && photoFile.size > 0) {
      if (!photoFile.type.startsWith('image/')) {
        reviewMessage.textContent = 'Choose an image file for your review photo.';
        reviewMessage.hidden = false;
        return;
      }
      submitButton.disabled = true;
      submitButton.textContent = 'Uploading photo...';
      try {
        photoUrl = await uploadToCloudinary(photoFile);
      } catch (error) {
        console.error('Unable to upload the tailor review photo.', error);
        submitButton.disabled = false;
        submitButton.textContent = 'Post review';
        reviewMessage.textContent = 'The photo could not be uploaded. You can retry or remove it and post without a photo.';
        reviewMessage.hidden = false;
        return;
      }
    }

    const review = {
      shopId: activeReviewShop.id,
      rating,
      text: reviewText,
      photoUrl,
      createdAt: new Date().toISOString()
    };
    const nextReviews = [...reviews, review];
    if (!saveStoredArray('atelier_tailor_reviews', nextReviews)) {
      submitButton.disabled = false;
      submitButton.textContent = 'Post review';
      return;
    }

    reviews = nextReviews;
    const reviewedShopName = activeReviewShop.name;
    renderShops();
    reviewDialog.close();
    submitButton.disabled = false;
    submitButton.textContent = 'Post review';
    showTailorsToast(`Your review for ${reviewedShopName} was added.`);
  });

  window.addEventListener('storage', (event) => {
    if (event.key === 'atelier_submitted_tailors') {
      submittedShops = readStoredArray('atelier_submitted_tailors');
      renderShops();
    } else if (event.key === 'atelier_verified_tailors') {
      verifiedShops = readStoredArray('atelier_verified_tailors');
      renderShops();
    } else if (event.key === 'atelier_tailor_reviews') {
      reviews = readStoredArray('atelier_tailor_reviews');
      renderShops();
    }
  });

  renderShops();
  window.requestAnimationFrame(() => map.invalidateSize());
  window.addEventListener('resize', () => map.invalidateSize());
  fetchLiveTailors();
  loadRemoteTailors();
});

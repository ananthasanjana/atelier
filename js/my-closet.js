(() => {
  'use strict';

  const SAVED_OUTFITS_KEY = 'atelier_saved_outfits';
  const LOOKBOOK_KEY = 'atelier_lookbook_entries';
  const CIRCULAR_LOOK_ENDPOINT = 'http://localhost:3000/api/circular/generate-look';
  const PRIVATE_STARTER_OWNER = 'sanjs4n';
  const PRIVATE_STARTER_ITEMS = [
    { id: 'starter-black-jacket', nickname: 'black button jacket', category: 'Tops & Shirts', fabric: 'Fabric unconfirmed', condition: 'Great', image_url: 'images/closet/closet-item-01.png' },
    { id: 'starter-rust-top', nickname: 'rust floral wrap top', category: 'Tops & Shirts', fabric: 'Fabric unconfirmed', condition: 'Great', image_url: 'images/closet/closet-item-02.png' },
    { id: 'starter-striped-top', nickname: 'striped sleeveless top', category: 'Tops & Shirts', fabric: 'Fabric unconfirmed', condition: 'Great', image_url: 'images/closet/closet-item-03.png' },
    { id: 'starter-blue-top', nickname: 'powder blue ruffle top', category: 'Tops & Shirts', fabric: 'Fabric unconfirmed', condition: 'Great', image_url: 'images/closet/closet-item-04.png' },
    { id: 'starter-espresso-top', nickname: 'espresso lace blouse', category: 'Tops & Shirts', fabric: 'Fabric unconfirmed', condition: 'Great', image_url: 'images/closet/closet-item-05.png' },
    { id: 'starter-polka-cami', nickname: 'black polka dot cami', category: 'Tops & Shirts', fabric: 'Fabric unconfirmed', condition: 'Great', image_url: 'images/closet/closet-item-07.png' },
    { id: 'starter-lace-cami', nickname: 'white lace cami', category: 'Tops & Shirts', fabric: 'Fabric unconfirmed', condition: 'Great', image_url: 'images/closet/closet-item-08.png' },
    { id: 'starter-black-dress', nickname: 'black floral mini dress', category: 'Dresses', fabric: 'Fabric unconfirmed', condition: 'Great', image_url: 'images/closet/closet-item-06.png' },
    { id: 'starter-embroidered-jeans', nickname: 'embroidered blue jeans', category: 'Bottoms', fabric: 'Denim', condition: 'Great', image_url: 'images/closet/closet-bottom-01.png' },
    { id: 'starter-dark-jeans', nickname: 'dark wash jeans', category: 'Bottoms', fabric: 'Denim', condition: 'Great', image_url: 'images/closet/closet-bottom-02.png' },
    { id: 'starter-denim-skirt', nickname: 'denim A-line skirt', category: 'Bottoms', fabric: 'Denim', condition: 'Great', image_url: 'images/closet/closet-bottom-03.png' },
    { id: 'starter-corduroy-skirt', nickname: 'brown corduroy mini skirt', category: 'Bottoms', fabric: 'Cotton', condition: 'Great', image_url: 'images/closet/closet-bottom-04.png' },
    { id: 'starter-flare-jeans', nickname: 'light wash flared jeans', category: 'Bottoms', fabric: 'Denim', condition: 'Great', image_url: 'images/closet/closet-bottom-05.png' },
    { id: 'starter-polka-dot-dress', nickname: 'polka dot halter dress', category: 'Dresses', fabric: 'Fabric unconfirmed', condition: 'Great', image_url: 'images/closet/closet-dress-01.png' },
    { id: 'starter-floral-ruffle-dress', nickname: 'floral ruffle dress', category: 'Dresses', fabric: 'Fabric unconfirmed', condition: 'Great', image_url: 'images/closet/closet-dress-02.png' },
    { id: 'starter-plaid-slip-dress', nickname: 'brown plaid slip dress', category: 'Dresses', fabric: 'Fabric unconfirmed', condition: 'Great', image_url: 'images/closet/closet-dress-03.png' },
    { id: 'starter-burgundy-striped-dress', nickname: 'burgundy striped dress', category: 'Dresses', fabric: 'Fabric unconfirmed', condition: 'Great', image_url: 'images/closet/closet-dress-04.png' },
    { id: 'starter-denim-jacket', nickname: 'dark denim jacket', category: 'Outerwear', fabric: 'Fabric unconfirmed', condition: 'Great', image_url: 'images/closet/closet-outerwear-01.png' },
    { id: 'starter-striped-hoodie', nickname: 'striped hooded cardigan', category: 'Outerwear', fabric: 'Fabric unconfirmed', condition: 'Great', image_url: 'images/closet/closet-outerwear-02.png' },
    { id: 'starter-pink-track-jacket', nickname: 'blush track jacket', category: 'Outerwear', fabric: 'Fabric unconfirmed', condition: 'Great', image_url: 'images/closet/closet-outerwear-03.png' },
    { id: 'starter-camo-hoodie', nickname: 'camo zip hoodie', category: 'Outerwear', fabric: 'Fabric unconfirmed', condition: 'Great', image_url: 'images/closet/closet-outerwear-04.png' },
    { id: 'starter-charm-bracelet', nickname: 'colorful charm bracelet', category: 'Accessories', fabric: 'Fabric unconfirmed', condition: 'Great', image_url: 'images/closet/closet-accessory-01.png' },
    { id: 'starter-vintage-watch', nickname: 'vintage leather watch', category: 'Accessories', fabric: 'Fabric unconfirmed', condition: 'Great', image_url: 'images/closet/closet-accessory-02.png' },
    { id: 'starter-silver-hoops', nickname: 'silver hoop earrings', category: 'Accessories', fabric: 'Fabric unconfirmed', condition: 'Great', image_url: 'images/closet/closet-accessory-03.png' },
    { id: 'starter-plaid-shoulder-bag', nickname: 'plaid shoulder bag', category: 'Accessories', fabric: 'Fabric unconfirmed', condition: 'Great', image_url: 'images/closet/closet-accessory-04.png' },
    { id: 'starter-polka-dot-handbag', nickname: 'polka dot handbag', category: 'Accessories', fabric: 'Fabric unconfirmed', condition: 'Great', image_url: 'images/closet/closet-accessory-05.png' },
    { id: 'starter-heart-pendant', nickname: 'silver heart pendant', category: 'Accessories', fabric: 'Fabric unconfirmed', condition: 'Great', image_url: 'images/closet/closet-accessory-06.png' },
    { id: 'starter-star-pendant', nickname: 'pearl star pendant', category: 'Accessories', fabric: 'Fabric unconfirmed', condition: 'Great', image_url: 'images/closet/closet-accessory-07.png' },
    { id: 'starter-butterfly-clips', nickname: 'butterfly hair clips', category: 'Accessories', fabric: 'Fabric unconfirmed', condition: 'Great', image_url: 'images/closet/closet-accessory-08.png' },
    { id: 'starter-brown-sneakers', nickname: 'dark brown lace-up sneakers', category: 'Footwear', fabric: 'Fabric unconfirmed', condition: 'Great', image_url: 'images/closet/closet-footwear-01.png' },
    { id: 'starter-gray-sneakers', nickname: 'gray suede sneakers', category: 'Footwear', fabric: 'Fabric unconfirmed', condition: 'Great', image_url: 'images/closet/closet-footwear-02.png' },
    { id: 'starter-black-heels', nickname: 'black kitten heels', category: 'Footwear', fabric: 'Fabric unconfirmed', condition: 'Great', image_url: 'images/closet/closet-footwear-03.png' },
    { id: 'starter-pants', nickname: 'fun pants', category: 'Bottoms', fabric: 'Denim', condition: 'Great', image_url: 'images/marketplace/item11.png' },
    { id: 'starter-loafers', nickname: 'everyday loafers', category: 'Footwear', fabric: 'Leather', condition: 'Great', image_url: 'images/marketplace/item10.png' },
    { id: 'starter-pouch', nickname: 'patchwork pouch', category: 'Accessories', fabric: 'Denim', condition: 'Great', image_url: 'images/marketplace/item3.png' }
  ];
  const FABRIC_GUIDES = {
    Denim: 'Wash cold and inside-out with a mild detergent. Skip fabric softener; line dry in the shade and avoid the tumble dryer to protect the color and shape.',
    Cotton: 'Wash cool (around 30°C) with a gentle detergent. Wash similar colors together and line dry when possible; use low heat only if the care label allows.',
    Wool: 'Cold hand-wash with mild wool wash. Press water out gently, never wring, then lay flat on a towel so the knit does not stretch.',
    Silk: 'Use a cold gentle hand-wash with a silk-safe detergent or choose eco dry-cleaning. Never wring; roll in a towel and dry flat away from direct sun.',
    Linen: 'Wash cool on a gentle cycle with mild detergent. Air-dry on a hanger or flat; remove while slightly damp for easier, low-heat pressing.',
    Leather: 'Do not machine-wash. Wipe with a barely damp cloth and a material-safe cleaner, then air-dry away from heat and direct sunlight.',
    Polyester: 'Wash cool (around 30°C) on a gentle cycle with mild detergent. Turn inside-out, skip high heat, and line dry to reduce wear and microfibre shedding.'
  };
  const FIX_TIPS = {
    fray: 'Trim only loose threads, fold the hem inward, and secure it with small, even blanket stitches. For a valuable piece, ask a local tailor to reinforce the seam.',
    tear: 'For denim or sturdy cotton, place a fabric patch behind the tear and use small sashiko-style running stitches. Use matching thread and test on a hidden area first.',
    stain: 'Blot—never rub—with a clean cloth, then dab a little cool water and mild detergent from the back of the stain. Spot-test first; avoid baking soda or vinegar on silk, wool, and delicate dyes.',
    button: 'For a loose button, sew through the original holes with doubled thread and knot securely. A damaged zip slider or teeth are best repaired by a tailor before the fabric tears.',
    fade: 'Wash gently inside-out and air-dry in shade. If you want more color, try a fabric-safe dye only after checking the care label and testing a hidden seam.'
  };
  const CATEGORY_ALIASES = {
    top: 'Tops & Shirts',
    tops: 'Tops & Shirts',
    shirt: 'Tops & Shirts',
    shirts: 'Tops & Shirts',
    'tops & shirts': 'Tops & Shirts',
    bottom: 'Bottoms',
    bottoms: 'Bottoms',
    pants: 'Bottoms',
    trousers: 'Bottoms',
    skirt: 'Bottoms',
    dress: 'Dresses',
    dresses: 'Dresses',
    outerwear: 'Outerwear',
    accessory: 'Accessories',
    accessories: 'Accessories',
    footwear: 'Footwear',
    shoes: 'Footwear'
  };

  const elements = {
    gate: document.getElementById('closet-auth-gate'),
    loginLink: document.getElementById('closet-login-link'),
    loading: document.getElementById('closet-loading'),
    app: document.getElementById('closet-app'),
    grid: document.getElementById('closet-grid'),
    itemCount: document.getElementById('closet-item-count'),
    storageStatus: document.getElementById('closet-storage-status'),
    categoryTabs: document.getElementById('closet-category-tabs'),
    uploadDialog: document.getElementById('closet-upload-dialog'),
    uploadForm: document.getElementById('closet-upload-form'),
    uploadStatus: document.getElementById('closet-upload-status'),
    uploadButton: document.getElementById('save-closet-item'),
    uploadTitle: document.getElementById('closet-upload-title'),
    nickname: document.getElementById('closet-nickname'),
    category: document.getElementById('closet-category'),
    fabricInput: document.getElementById('closet-new-fabric'),
    conditionInput: document.getElementById('closet-new-condition'),
    photo: document.getElementById('closet-photo'),
    photoLabel: document.getElementById('closet-photo-label'),
    photoPreview: document.getElementById('closet-photo-preview'),
    outfitPreview: document.getElementById('outfit-preview'),
    outfitNote: document.getElementById('outfit-note'),
    saveOutfit: document.getElementById('save-outfit'),
    savedCount: document.getElementById('saved-outfits-count'),
    savedList: document.getElementById('saved-outfits-list'),
    viewButtons: document.querySelectorAll('[data-closet-view]'),
    viewPanels: document.querySelectorAll('[data-closet-view-panel]'),
    lookbookGrid: document.getElementById('closet-lookbook-grid'),
    lookbookStatus: document.getElementById('lookbook-status'),
    lookbookDialog: document.getElementById('lookbook-upload-dialog'),
    lookbookForm: document.getElementById('lookbook-upload-form'),
    lookbookPhoto: document.getElementById('lookbook-photo'),
    lookbookPhotoLabel: document.getElementById('lookbook-photo-label'),
    lookbookPhotoPreview: document.getElementById('lookbook-photo-preview'),
    lookbookUploadStatus: document.getElementById('lookbook-upload-status'),
    lookbookUploadButton: document.getElementById('save-lookbook-entry'),
    lookbookTitle: document.getElementById('lookbook-outfit-title'),
    lookbookVibe: document.getElementById('lookbook-vibe'),
    lookbookCaption: document.getElementById('lookbook-caption'),
    toast: document.getElementById('closet-toast'),
    generateOutfit: document.getElementById('generate-outfit'),
    chatLauncher: document.getElementById('closet-chat-launcher'),
    chat: document.getElementById('closet-chat'),
    chatPicker: document.getElementById('closet-chat-picker'),
    chatMessages: document.getElementById('closet-chat-messages'),
    chatForm: document.getElementById('closet-chat-form'),
    chatInput: document.getElementById('closet-chat-input')
  };
  const state = {
    user: null,
    username: '',
    items: [],
    lookbookEntries: [],
    category: 'All',
    vibe: 'All Vibes',
    chatItemId: '',
    lastOutfitSignature: '',
    currentOutfit: [],
    currentNote: '',
    lockedItemIds: new Set(),
    editingItemId: null,
    generationId: 0
  };
  let photoPreviewUrl = '';
  let lookbookPhotoPreviewUrl = '';
  let toastTimeout = 0;

  function readArray(key) {
    try {
      const value = JSON.parse(window.localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.error(`Unable to read ${key} from local storage.`, error);
      return [];
    }
  }

  function writeArray(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Unable to save ${key} to local storage.`, error);
      return false;
    }
  }

  function closetStorageKey() {
    return state.user && state.user.id
      ? `atelier_closet_${state.user.id}`
      : '';
  }

  function writeClosetItems(items) {
    const userId = state.user && String(state.user.id);
    const storageKey = closetStorageKey();
    if (!userId || !storageKey) return false;
    return writeArray(storageKey, items.filter((item) => item && String(item.user_id) === userId));
  }

  function normalizeCategory(value) {
    const key = String(value || '').trim().toLowerCase();
    return CATEGORY_ALIASES[key] || 'Accessories';
  }

  function normalizeFabric(value) {
    const fabric = String(value || '').trim().toLowerCase();
    if (fabric.includes('denim')) return 'Denim';
    if (fabric.includes('wool') || fabric.includes('knit')) return 'Wool';
    if (fabric.includes('silk') || fabric.includes('satin')) return 'Silk';
    if (fabric.includes('leather')) return 'Leather';
    if (fabric.includes('linen')) return 'Linen';
    if (fabric.includes('polyester')) return 'Polyester';
    if (fabric.includes('cotton')) return 'Cotton';
    return String(value || 'Cotton');
  }

  function setStorageStatus(message, kind) {
    elements.storageStatus.textContent = message || '';
    elements.storageStatus.dataset.kind = kind || 'info';
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => {
      elements.toast.hidden = true;
    }, 2400);
  }

  function readSavedOutfits() {
    return readArray(SAVED_OUTFITS_KEY).filter((entry) => (
      entry
      && typeof entry === 'object'
      && typeof entry.id === 'string'
      && Array.isArray(entry.itemIds)
      && typeof entry.vibe === 'string'
    ));
  }

  function savedOutfitSignature(entry) {
    return `${entry.vibe}::${entry.itemIds.map(String).sort().join('|')}`;
  }

  function currentOutfitKey() {
    return `${state.vibe}::${outfitSignature(state.currentOutfit)}`;
  }

  function updateSaveOutfitButton() {
    const hasOutfit = state.currentOutfit.length > 0;
    const isSaved = hasOutfit && readSavedOutfits().some((entry) => savedOutfitSignature(entry) === currentOutfitKey());
    elements.saveOutfit.textContent = isSaved ? '♥ Saved!' : '♡ Save Outfit';
    elements.saveOutfit.disabled = !hasOutfit || isSaved || elements.generateOutfit.disabled;
    elements.saveOutfit.setAttribute('aria-pressed', String(Boolean(isSaved)));
  }

  function renderSavedOutfits() {
    const savedOutfits = readSavedOutfits();
    elements.savedCount.textContent = String(savedOutfits.length);
    elements.savedList.replaceChildren();
    if (!savedOutfits.length) {
      const empty = document.createElement('p');
      empty.className = 'closet-empty';
      empty.textContent = 'Your saved combinations will live here. Generate a look and save it to start your private collection.';
      elements.savedList.append(empty);
    }

    savedOutfits.forEach((entry) => {
      const card = document.createElement('article');
      card.className = 'closet-saved-card';
      const thumbnails = document.createElement('div');
      thumbnails.className = 'closet-saved-card__thumbnails';
      entry.itemIds.slice(0, 4).forEach((id) => {
        const item = state.items.find((candidate) => String(candidate.id) === String(id));
        if (!item) return;
        const image = document.createElement('img');
        image.src = item.image_url || 'images/marketplace/item8.png';
        image.alt = item.nickname;
        image.title = item.nickname;
        thumbnails.append(image);
      });

      const meta = document.createElement('div');
      meta.className = 'closet-saved-card__meta';
      const vibe = document.createElement('strong');
      vibe.textContent = entry.vibe;
      const date = document.createElement('time');
      const savedDate = new Date(entry.savedAt);
      date.textContent = Number.isNaN(savedDate.getTime())
        ? 'Saved outfit'
        : savedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      meta.append(vibe, date);

      const actions = document.createElement('div');
      actions.className = 'closet-saved-card__actions';
      const wear = document.createElement('button');
      wear.type = 'button';
      wear.className = 'closet-saved-card__wear';
      wear.textContent = 'Wear / Preview';
      wear.addEventListener('click', () => previewSavedOutfit(entry));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'closet-saved-card__remove';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `Delete saved ${entry.vibe} outfit`);
      remove.addEventListener('click', () => deleteSavedOutfit(entry.id));
      actions.append(wear, remove);
      card.append(thumbnails, meta, actions);
      elements.savedList.append(card);
    });

    updateSaveOutfitButton();
  }

  function saveCurrentOutfit() {
    if (!state.currentOutfit.length) return;
    const savedOutfits = readSavedOutfits();
    if (savedOutfits.some((entry) => savedOutfitSignature(entry) === currentOutfitKey())) {
      showToast('This outfit is already in your private lookbook.');
      updateSaveOutfitButton();
      return;
    }

    const entry = {
      id: `outfit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      vibe: state.vibe,
      itemIds: state.currentOutfit.map((item) => String(item.id)),
      note: state.currentNote,
      savedAt: new Date().toISOString()
    };
    if (!writeArray(SAVED_OUTFITS_KEY, [entry, ...savedOutfits])) {
      showToast('Could not save this outfit. Check your browser storage and try again.');
      return;
    }
    renderSavedOutfits();
    showToast('Saved to your private outfit lookbook.');
  }

  function previewSavedOutfit(entry) {
    const items = entry.itemIds
      .map((id) => state.items.find((item) => String(item.id) === String(id)))
      .filter(Boolean);
    if (!items.length || items.length !== entry.itemIds.length) {
      showToast('Those pieces are no longer in your closet.');
      return;
    }
    state.vibe = entry.vibe;
    document.querySelectorAll('[data-vibe]').forEach((button) => {
      const active = button.dataset.vibe === state.vibe;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    state.lockedItemIds.clear();
    renderOutfit(items, entry.note || outfitNote(items));
    setClosetView('generator');
    document.getElementById('outfit-title').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function deleteSavedOutfit(id) {
    const remaining = readSavedOutfits().filter((entry) => entry.id !== id);
    if (!writeArray(SAVED_OUTFITS_KEY, remaining)) {
      showToast('Could not remove this saved outfit. Check your browser storage and try again.');
      return;
    }
    renderSavedOutfits();
    showToast('Removed from your private lookbook.');
  }

  function setClosetView(view) {
    elements.viewButtons.forEach((button) => {
      const selected = button.dataset.closetView === view;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    elements.viewPanels.forEach((panel) => {
      panel.hidden = panel.dataset.closetViewPanel !== view;
    });
    if (view === 'lookbook') loadLookbookEntries();
  }

  function normalizeUsername(value) {
    return String(value || '').trim().replace(/^@/, '').toLowerCase();
  }

  function mapLookbookRow(row, localOnly) {
    return {
      id: String(row.id || `lookbook-local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      user_id: String(row.user_id || ''),
      username: normalizeUsername(row.username),
      title: String(row.title || row.outfit_title || 'Atelier outfit'),
      vibe: String(row.vibe || 'Styled look'),
      caption: String(row.caption || ''),
      image_url: String(row.image_url || row.photo_url || ''),
      created_at: row.created_at || row.saved_at || new Date().toISOString(),
      localOnly: Boolean(localOnly)
    };
  }

  function lookbookEntryBelongsToCurrentUser(entry) {
    const sameId = state.user && entry.user_id && String(entry.user_id) === String(state.user.id);
    const sameUsername = state.username && entry.username
      && normalizeUsername(entry.username) === normalizeUsername(state.username);
    return Boolean(sameId || sameUsername);
  }

  function cachedLookbookEntries() {
    return readArray(LOOKBOOK_KEY)
      .filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry))
      .map((entry) => mapLookbookRow(entry, entry.localOnly !== false))
      .filter(lookbookEntryBelongsToCurrentUser);
  }

  function renderLookbookEntries() {
    elements.lookbookGrid.replaceChildren();
    if (!state.lookbookEntries.length) {
      const empty = document.createElement('p');
      empty.className = 'closet-empty closet-lookbook-empty';
      empty.textContent = 'Your outfit photos will appear here and on your Atelier profile.';
      elements.lookbookGrid.append(empty);
      return;
    }

    state.lookbookEntries.forEach((entry) => {
      const card = document.createElement('article');
      card.className = 'closet-lookbook-card';
      const image = document.createElement('img');
      image.src = entry.image_url || 'images/marketplace/item8.png';
      image.alt = entry.title;
      image.loading = 'lazy';
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'closet-lookbook-card__remove';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `Delete ${entry.title} from your lookbook`);
      remove.addEventListener('click', () => deleteLookbookEntry(entry));
      const title = document.createElement('h3');
      title.textContent = entry.title;
      const vibe = document.createElement('span');
      vibe.className = 'closet-lookbook-card__vibe';
      vibe.textContent = entry.vibe;
      const caption = document.createElement('p');
      caption.textContent = entry.caption;
      caption.hidden = !entry.caption;
      const date = document.createElement('time');
      date.dateTime = entry.created_at;
      const createdDate = new Date(entry.created_at);
      date.textContent = Number.isNaN(createdDate.getTime())
        ? 'Recently added'
        : createdDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      card.append(image, remove, title, vibe, caption, date);
      elements.lookbookGrid.append(card);
    });
  }

  async function loadLookbookEntries() {
    const localEntries = cachedLookbookEntries();
    let remoteEntries = [];
    let remoteError = null;
    if (state.user && window.atelierSupabase) {
      try {
        const { data, error } = await window.atelierSupabase.getClient()
          .from('lookbook_entries')
          .select('*')
          .eq('user_id', state.user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        remoteEntries = (data || []).map((entry) => mapLookbookRow(entry, false));
      } catch (error) {
        remoteError = error;
        console.warn('Lookbook entries could not be loaded from Supabase; showing this device’s saved photos.', error);
      }
    }

    const merged = new Map();
    [...localEntries, ...remoteEntries].forEach((entry) => {
      if (lookbookEntryBelongsToCurrentUser(entry)) merged.set(entry.id, entry);
    });
    state.lookbookEntries = [...merged.values()].sort((left, right) => (
      new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    ));
    renderLookbookEntries();
    if (remoteError) {
      elements.lookbookStatus.textContent = `Cloud lookbook is unavailable: ${remoteError.message}. Showing photos cached on this device.`;
      elements.lookbookStatus.dataset.kind = 'warning';
    } else {
      elements.lookbookStatus.textContent = '';
      elements.lookbookStatus.removeAttribute('data-kind');
    }
  }

  function clearLookbookPhotoPreview() {
    if (lookbookPhotoPreviewUrl) URL.revokeObjectURL(lookbookPhotoPreviewUrl);
    lookbookPhotoPreviewUrl = '';
    elements.lookbookPhotoPreview.removeAttribute('src');
    elements.lookbookPhotoPreview.hidden = true;
    elements.lookbookPhotoLabel.textContent = 'Choose an outfit photo';
  }

  async function saveLookbookEntry(event) {
    event.preventDefault();
    const file = elements.lookbookPhoto.files && elements.lookbookPhoto.files[0];
    if (!file || !file.type.startsWith('image/')) {
      elements.lookbookUploadStatus.textContent = 'Choose an image file for your outfit photo.';
      return;
    }
    elements.lookbookUploadButton.disabled = true;
    elements.lookbookUploadButton.textContent = 'Saving your look…';
    elements.lookbookUploadStatus.textContent = 'Preparing your outfit photo…';

    let uploaded;
    try {
      uploaded = await uploadClosetPhoto(file);
    } catch (error) {
      console.error('The lookbook photo could not be prepared.', error);
      elements.lookbookUploadStatus.textContent = `Could not prepare this photo: ${error.message}`;
      elements.lookbookUploadButton.disabled = false;
      elements.lookbookUploadButton.textContent = 'Save to My Lookbook';
      return;
    }

    const newEntry = {
      id: `lookbook-local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      user_id: String(state.user.id),
      username: normalizeUsername(state.username),
      title: elements.lookbookTitle.value.trim(),
      vibe: elements.lookbookVibe.value,
      caption: elements.lookbookCaption.value.trim(),
      image_url: uploaded.imageUrl,
      created_at: new Date().toISOString(),
      localOnly: true
    };
    let remoteEntry = null;
    let remoteError = null;
    try {
      const { data, error } = await window.atelierSupabase.getClient()
        .from('lookbook_entries')
        .insert({
          user_id: state.user.id,
          username: newEntry.username,
          title: newEntry.title,
          vibe: newEntry.vibe,
          caption: newEntry.caption,
          image_url: newEntry.image_url
        })
        .select('*')
        .single();
      if (error) throw error;
      remoteEntry = mapLookbookRow(data, false);
    } catch (error) {
      remoteError = error;
      console.warn('Lookbook entry could not be synced to Supabase; keeping a local copy.', error);
    }

    const savedEntry = remoteEntry || newEntry;
    const otherEntries = readArray(LOOKBOOK_KEY).filter((entry) => (
      entry && String(entry.id) !== String(savedEntry.id)
    ));
    const savedLocally = writeArray(LOOKBOOK_KEY, [savedEntry, ...otherEntries]);
    if (!savedLocally && !remoteEntry) {
      elements.lookbookUploadStatus.textContent = 'Could not save your outfit locally or online. Check browser storage and try again.';
      elements.lookbookUploadButton.disabled = false;
      elements.lookbookUploadButton.textContent = 'Save to My Lookbook';
      return;
    }

    state.lookbookEntries = [
      savedEntry,
      ...state.lookbookEntries.filter((entry) => entry.id !== savedEntry.id)
    ];
    renderLookbookEntries();
    elements.lookbookDialog.close();
    elements.lookbookForm.reset();
    clearLookbookPhotoPreview();
    const warnings = [];
    if (remoteError) warnings.push(`Cloud sync failed: ${remoteError.message}`);
    if (!savedLocally) warnings.push('This browser could not cache the photo.');
    if (uploaded.cloudinaryError) warnings.push(`Cloudinary upload failed: ${uploaded.cloudinaryError.message}; a local photo preview was saved.`);
    elements.lookbookStatus.textContent = warnings.length
      ? `Your outfit was saved with a fallback. ${warnings.join(' ')}`
      : 'Your outfit is saved to your lookbook and Atelier profile.';
    elements.lookbookStatus.dataset.kind = warnings.length ? 'warning' : 'success';
    elements.lookbookUploadButton.disabled = false;
    elements.lookbookUploadButton.textContent = 'Save to My Lookbook';
  }

  async function deleteLookbookEntry(entry) {
    if (!entry.localOnly) {
      try {
        const { error } = await window.atelierSupabase.getClient()
          .from('lookbook_entries')
          .delete()
          .eq('id', entry.id)
          .eq('user_id', state.user.id);
        if (error) throw error;
      } catch (error) {
        console.error('Could not delete the lookbook entry from Supabase.', error);
        elements.lookbookStatus.textContent = `Could not delete this outfit from cloud storage: ${error.message}`;
        elements.lookbookStatus.dataset.kind = 'warning';
        return;
      }
    }
    const remaining = readArray(LOOKBOOK_KEY).filter((cached) => String(cached.id) !== entry.id);
    const savedLocally = writeArray(LOOKBOOK_KEY, remaining);
    state.lookbookEntries = state.lookbookEntries.filter((candidate) => candidate.id !== entry.id);
    renderLookbookEntries();
    if (!savedLocally) {
      elements.lookbookStatus.textContent = 'The outfit was removed, but this browser could not update its local cache.';
      elements.lookbookStatus.dataset.kind = 'warning';
    } else {
      elements.lookbookStatus.textContent = 'Outfit removed from your lookbook.';
      elements.lookbookStatus.dataset.kind = 'success';
    }
  }

  function mapClosetRow(row) {
    return {
      id: String(row.id || row.item_id || `closet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      user_id: row.user_id || '',
      nickname: String(row.nickname || row.item_name || row.name || row.title || 'Closet favorite'),
      category: normalizeCategory(row.category),
      fabric: normalizeFabric(row.fabric),
      condition: String(row.condition || 'Great'),
      updated_at: row.updated_at || row.created_at || '',
      image_url: String(row.image_url || row.photo_url || row.image || '')
    };
  }

  function storedItems() {
    const storageKey = closetStorageKey();
    const userId = state.user && String(state.user.id);
    if (!storageKey || !userId) return [];
    return readArray(storageKey).filter((item) => (
      item
      && typeof item === 'object'
      && !Array.isArray(item)
      && String(item.user_id) === userId
    ));
  }

  function mergeItems(localItems, remoteItems) {
    const merged = new Map();
    [...localItems, ...remoteItems].forEach((item) => {
      if (!item || !item.id) return;
      const current = merged.get(String(item.id));
      if (current && current.local_pending && !item.local_pending) {
        const remoteTime = Date.parse(item.updated_at || '');
        const pendingTime = Date.parse(current.local_pending_at || '');
        if (!remoteTime || !pendingTime || remoteTime < pendingTime) return;
      }
      merged.set(String(item.id), item);
    });
    return [...merged.values()];
  }

  function closetItemSignature(item) {
    return `${String(item.nickname || '').trim().toLowerCase()}::${String(item.image_url || '').trim().toLowerCase()}`;
  }

  function markPrivateStarterRestoreComplete(userId) {
    try {
      window.localStorage.setItem(`atelier_closet_${userId}_starter_restore_complete`, 'true');
    } catch (error) {
      console.error('Could not remember the private closet restore state.', error);
    }
  }

  async function restorePrivateStarterItems(localItems, remoteItems) {
    const userId = state.user && String(state.user.id);
    if (!userId || normalizeUsername(state.username) !== PRIVATE_STARTER_OWNER) {
      return { localItems, remoteItems };
    }

    const remoteSignatures = new Set(remoteItems.map(closetItemSignature));
    const alreadySyncedLocal = localItems.filter((item) => (
      item.local_pending && remoteSignatures.has(closetItemSignature(item))
    ));
    if (alreadySyncedLocal.length) {
      const syncedSignatures = new Set(alreadySyncedLocal.map(closetItemSignature));
      localItems = localItems.filter((item) => !(
        item.local_pending && syncedSignatures.has(closetItemSignature(item))
      ));
      localItems = mergeItems(
        localItems,
        remoteItems.filter((item) => syncedSignatures.has(closetItemSignature(item)))
      );
      if (!writeClosetItems(localItems)) {
        setStorageStatus('Your cloud closet is restored, but its local cache could not be updated.', 'warning');
      }
    }

    try {
      if (window.localStorage.getItem(`atelier_closet_${userId}_starter_restore_complete`) === 'true') {
        return { localItems, remoteItems };
      }
    } catch (error) {
      console.error('Could not check the private closet restore state.', error);
    }

    const localSignatures = new Set(localItems.map(closetItemSignature));
    const localPendingSignatures = new Set(
      localItems.filter((item) => item.local_pending).map(closetItemSignature)
    );
    const itemsToRestore = PRIVATE_STARTER_ITEMS.filter((item) => {
      const signature = closetItemSignature(item);
      return !remoteSignatures.has(signature)
        && (!localSignatures.has(signature) || localPendingSignatures.has(signature));
    });

    if (!itemsToRestore.length) {
      markPrivateStarterRestoreComplete(userId);
      return { localItems, remoteItems };
    }

    try {
      const { data, error } = await window.atelierSupabase.getClient()
        .from('closet_items')
        .insert(itemsToRestore.map((item) => ({
          user_id: userId,
          nickname: item.nickname,
          category: item.category,
          fabric: item.fabric,
          condition: item.condition,
          image_url: item.image_url
        })))
        .select('*');
      if (error) throw error;
      if (!Array.isArray(data) || data.length !== itemsToRestore.length) {
        throw new Error('The restored garments were not all confirmed by the closet service.');
      }

      const restoredRows = data.map(mapClosetRow);
      const restoredSignatures = new Set(restoredRows.map(closetItemSignature));
      localItems = localItems.filter((item) => !(
        item.local_pending && restoredSignatures.has(closetItemSignature(item))
      ));
      localItems = mergeItems(localItems, restoredRows);
      remoteItems = mergeItems(remoteItems, restoredRows);
      if (!writeClosetItems(localItems)) {
        setStorageStatus('Your previous garments are restored to your account, but this device could not cache them.', 'warning');
      } else {
        setStorageStatus(`Restored ${restoredRows.length} previous pieces to your private closet.`, 'success');
      }
      markPrivateStarterRestoreComplete(userId);
      return { localItems, remoteItems };
    } catch (error) {
      console.error('The previous garments could not be restored to the cloud closet.', error);
      const localRestoredItems = itemsToRestore.map((item) => ({
        ...item,
        id: `private-${item.id}`,
        user_id: userId,
        local_pending: true,
        local_pending_at: new Date().toISOString()
      }));
      localItems = mergeItems(localItems, localRestoredItems);
      if (writeClosetItems(localItems)) {
        setStorageStatus('Your previous garments are saved privately on this device; cloud sync will retry when available.', 'warning');
      } else {
        setStorageStatus('Your previous garments could not be saved. Check browser storage and try again.', 'warning');
      }
      return { localItems, remoteItems };
    }
  }

  async function loadClosetItems() {
    let localItems = storedItems();
    let remoteItems = [];
    if (state.user && window.atelierSupabase) {
      try {
        const { data, error } = await window.atelierSupabase.getClient()
          .from('closet_items')
          .select('*')
          .eq('user_id', state.user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        remoteItems = (data || []).map(mapClosetRow);
      } catch (error) {
        console.warn('Closet items could not be loaded from Supabase; using this device’s saved closet.', error.message);
        setStorageStatus(`Cloud closet is unavailable: ${error.message}. Your saved pieces on this device are still here.`, 'warning');
      }
    }

    const restored = await restorePrivateStarterItems(localItems, remoteItems);
    localItems = restored.localItems;
    remoteItems = restored.remoteItems;

    state.items = mergeItems(localItems, remoteItems)
      .filter((item) => String(item.user_id) === String(state.user.id))
      .map((item) => ({
        ...item,
        category: normalizeCategory(item.category),
        fabric: normalizeFabric(item.fabric)
      }));

    if (!elements.storageStatus.textContent && remoteItems.length) {
      setStorageStatus('Your closet is synced with your Atelier account.', 'info');
    } else if (!elements.storageStatus.textContent && localItems.length) {
      setStorageStatus('Showing your saved closet from this device.', 'info');
    }

    state.category = 'All';
    state.chatItemId = '';
    renderCloset();
    renderChatPicker();
    renderSavedOutfits();
    generateOutfit();
  }

  function filteredItems() {
    return state.category === 'All'
      ? state.items
      : state.items.filter((item) => normalizeCategory(item.category) === state.category);
  }

  function updateItemCount() {
    const count = state.items.length;
    elements.itemCount.textContent = `${count} ${count === 1 ? 'piece' : 'pieces'}`;
  }

  function renderCloset() {
    updateItemCount();
    elements.grid.replaceChildren();
    const items = filteredItems();
    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'closet-empty';
      empty.textContent = state.items.length
        ? `No ${state.category.toLowerCase()} in your closet yet. Add a piece to start this collection.`
        : 'Your closet is empty — click + Add Piece to upload your first garment!';
      elements.grid.append(empty);
      return;
    }

    items.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'closet-polaroid';
      const cornerActions = document.createElement('div');
      cornerActions.className = 'closet-polaroid__corner-actions';
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'closet-polaroid__edit';
      edit.textContent = '✎';
      edit.title = 'Edit piece';
      edit.setAttribute('aria-label', `Edit ${item.nickname}`);
      edit.addEventListener('click', () => openEdit(item));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'closet-polaroid__remove';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `Delete ${item.nickname}`);
      remove.addEventListener('click', () => removeItem(item));
      cornerActions.append(edit, remove);

      const image = document.createElement('img');
      image.src = item.image_url || 'images/marketplace/item8.png';
      image.alt = item.nickname;
      image.loading = 'lazy';

      const details = document.createElement('div');
      details.className = 'closet-polaroid__details';
      const caption = document.createElement('strong');
      caption.className = 'closet-polaroid__caption';
      caption.textContent = item.nickname;
      const fabric = document.createElement('span');
      fabric.className = 'closet-fabric-badge';
      fabric.textContent = item.fabric;
      details.append(caption, fabric);

      const actions = document.createElement('div');
      actions.className = 'closet-polaroid__actions';
      const ask = document.createElement('button');
      ask.type = 'button';
      ask.className = 'closet-ask-care';
      ask.setAttribute('aria-label', `Ask AI Care about ${item.nickname}`);
      ask.title = 'Ask AI Care';
      ask.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.9L4 20l3.8-.9A8.5 8.5 0 1 0 12 3.5Z"></path><path d="M9.5 9.5a2.5 2.5 0 1 1 4.4 1.6c-1.1 1.1-1.9 1.4-1.9 3"></path><path d="M12 17.5v.1"></path></svg><span>Ask AI Care</span>';
      ask.addEventListener('click', () => openChat(item.id));
      actions.append(ask);

      card.append(cornerActions, image, details, actions);
      elements.grid.append(card);
    });
  }

  async function removeItem(item) {
    const nextItems = state.items.filter((candidate) => String(candidate.id) !== String(item.id));
    const localItems = storedItems().filter((candidate) => String(candidate.id) !== String(item.id));
    const localSaved = writeClosetItems(localItems);
    let remoteDeleteError = null;
    if (item.id && state.user && window.atelierSupabase) {
      try {
        const { error } = await window.atelierSupabase.getClient()
          .from('closet_items')
          .delete()
          .eq('id', item.id)
          .eq('user_id', state.user.id);
        if (error) throw error;
      } catch (error) {
        console.error('Unable to delete the closet item from Supabase.', error);
        remoteDeleteError = error;
      }
    }

    state.items = nextItems;
    if (!localSaved) {
      setStorageStatus('This item was removed from the view, but local storage could not be updated.', 'warning');
    } else if (remoteDeleteError) {
      setStorageStatus(`Removed this piece here, but cloud deletion failed: ${remoteDeleteError.message}`, 'warning');
    } else if (!nextItems.length) {
      setStorageStatus('Your closet is empty. Add a piece whenever you’re ready.', 'info');
    }
    state.items = state.items.map((entry) => ({
      ...entry,
      category: normalizeCategory(entry.category),
      fabric: normalizeFabric(entry.fabric)
    }));
    if (String(state.chatItemId) === String(item.id)) state.chatItemId = '';
    state.lockedItemIds.delete(String(item.id));
    renderCloset();
    renderChatPicker();
    renderSavedOutfits();
    generateOutfit();
  }

  function showGate() {
    elements.loading.hidden = true;
    elements.app.hidden = true;
    elements.gate.hidden = false;
    elements.loginLink.addEventListener('click', () => {
      if (window.atelierAuth) window.atelierAuth.prepareLoginRedirect();
    });
  }

  async function checkAuthentication() {
    try {
      const session = await window.atelierSupabase.getSession();
      if (session && session.user) {
        state.user = session.user;
        const cached = window.atelierSupabase.readCachedProfile();
        const metadata = session.user.user_metadata || {};
        const emailUsername = String(session.user.email || '').split('@')[0];
        state.username = normalizeUsername(
          (cached && cached.username) || metadata.username || metadata.user_name || emailUsername
        );
        return true;
      }
      const cached = window.atelierSupabase.readCachedProfile();
      if (cached && cached.id) {
        state.user = { id: cached.id };
        state.username = normalizeUsername(cached.username);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Unable to check the Atelier closet session.', error);
      const cached = window.atelierSupabase.readCachedProfile();
      if (cached && cached.id) {
        state.user = { id: cached.id };
        state.username = normalizeUsername(cached.username);
        setStorageStatus(`Could not verify the cloud session: ${error.message}. Showing your cached closet only.`, 'warning');
        return true;
      }
      return false;
    }
  }

  function fileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error('The selected photo could not be read.'));
      }, { once: true });
      reader.addEventListener('error', () => reject(reader.error || new Error('The selected photo could not be read.')), { once: true });
      reader.addEventListener('abort', () => reject(new Error('Reading the selected photo was canceled.')), { once: true });
      reader.readAsDataURL(file);
    });
  }

  function clearPhotoPreview() {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    photoPreviewUrl = '';
    elements.photoPreview.removeAttribute('src');
    elements.photoPreview.hidden = true;
    elements.photoLabel.textContent = 'Choose a clothing photo';
  }

  function showAddModal() {
    state.editingItemId = null;
    elements.uploadForm.reset();
    clearPhotoPreview();
    elements.uploadTitle.textContent = 'Add a piece to your closet';
    elements.uploadButton.textContent = 'Save to My Closet';
    elements.uploadStatus.textContent = '';
    elements.uploadDialog.showModal();
  }

  function showEditModal(item) {
    state.editingItemId = String(item.id);
    elements.uploadForm.reset();
    clearPhotoPreview();
    elements.uploadTitle.textContent = 'Edit Piece';
    elements.uploadButton.textContent = 'Save Changes';
    elements.uploadStatus.textContent = '';
    elements.nickname.value = item.nickname || item.item_name || '';
    elements.category.value = normalizeCategory(item.category);
    const fabric = normalizeFabric(item.fabric);
    elements.fabricInput.value = Array.from(elements.fabricInput.options).some((option) => option.value === fabric)
      ? fabric
      : 'Fabric unconfirmed';
    elements.conditionInput.value = Array.from(elements.conditionInput.options).some((option) => option.value === item.condition)
      ? item.condition
      : 'Great';
    if (item.image_url) {
      elements.photoPreview.src = item.image_url;
      elements.photoPreview.hidden = false;
      elements.photoLabel.textContent = 'Current photo · choose a new photo to replace it';
    }
    elements.uploadDialog.showModal();
  }

  function openEdit(item) {
    showEditModal(item);
  }

  async function uploadClosetPhoto(file) {
    let cloudinaryError = null;
    try {
      return { imageUrl: await window.atelierSupabase.uploadImage(file), cloudinaryError };
    } catch (error) {
      cloudinaryError = error;
      console.warn('Cloudinary upload failed; saving a local photo preview instead.', error);
      return { imageUrl: await fileAsDataUrl(file), cloudinaryError };
    }
  }

  async function saveEditedItem(item, file) {
    let imageUrl = item.image_url || '';
    let cloudinaryError = null;
    if (file) {
      elements.uploadStatus.textContent = 'Uploading the new photo…';
      try {
        const uploaded = await uploadClosetPhoto(file);
        imageUrl = uploaded.imageUrl;
        cloudinaryError = uploaded.cloudinaryError;
      } catch (error) {
        console.error('The replacement closet photo could not be prepared.', error);
        elements.uploadStatus.textContent = `Could not prepare this photo: ${error.message}`;
        return false;
      }
    }

    const updatedItem = {
      ...item,
      nickname: elements.nickname.value.trim(),
      item_name: elements.nickname.value.trim(),
      category: normalizeCategory(elements.category.value),
      fabric: normalizeFabric(elements.fabricInput.value),
      condition: elements.conditionInput.value,
      image_url: imageUrl
    };
    let savedRemotely = false;
    let remoteError = null;
    if (state.user && window.atelierSupabase) {
      try {
        const { data, error } = await window.atelierSupabase.getClient()
          .from('closet_items')
          .update({
            item_name: updatedItem.nickname,
            category: updatedItem.category,
            fabric: updatedItem.fabric,
            condition: updatedItem.condition,
            image_url: updatedItem.image_url
          })
          .eq('id', item.id)
          .eq('user_id', state.user.id)
          .select('id')
          .limit(1);
        if (error) throw error;
        if (!data || !data.length) throw new Error('Supabase did not update this closet item.');
        savedRemotely = true;
      } catch (error) {
        remoteError = error;
        console.warn('Closet item could not be updated in Supabase; trying the local closet.', error);
      }
    }

    if (!savedRemotely) {
      updatedItem.local_pending = true;
      updatedItem.local_pending_at = new Date().toISOString();
    } else {
      delete updatedItem.local_pending;
      delete updatedItem.local_pending_at;
    }

    const updatedItems = state.items.map((entry) => (
      String(entry.id) === String(item.id) ? updatedItem : entry
    ));
    const savedLocally = writeClosetItems(updatedItems);
    if (!savedRemotely && !savedLocally) {
      elements.uploadStatus.textContent = `Could not save your changes. ${remoteError ? remoteError.message : 'Browser storage is unavailable.'}`;
      return false;
    }
    state.items = updatedItems;
    state.lockedItemIds = new Set([...state.lockedItemIds].map((id) => (
      String(id) === String(item.id) ? String(updatedItem.id) : String(id)
    )));
    renderCloset();
    renderChatPicker();
    renderSavedOutfits();
    void generateOutfit();
    elements.uploadDialog.close();
    elements.uploadForm.reset();
    clearPhotoPreview();

    const warnings = [];
    if (remoteError) warnings.push(`Supabase update failed: ${remoteError.message}`);
    else if (!savedRemotely) warnings.push('Cloud closet is unavailable; changes were saved only on this device.');
    if (!savedLocally) warnings.push('Browser storage could not cache the changes.');
    if (cloudinaryError) warnings.push(`Cloudinary upload failed: ${cloudinaryError.message}; the photo is stored locally.`);
    setStorageStatus(
      warnings.length ? `Changes saved with a fallback. ${warnings.join(' ')}` : 'Closet piece updated.',
      warnings.length ? 'warning' : 'success'
    );
    return true;
  }

  function renderChatPicker() {
    const selected = state.chatItemId;
    elements.chatPicker.replaceChildren();
    const prompt = document.createElement('option');
    prompt.value = '';
    prompt.textContent = 'Pick a closet piece (optional)';
    elements.chatPicker.append(prompt);
    state.items.forEach((item) => {
      const option = document.createElement('option');
      option.value = String(item.id);
      option.textContent = `${item.nickname} · ${item.fabric}`;
      elements.chatPicker.append(option);
    });
    if (selected && state.items.some((item) => String(item.id) === String(selected))) {
      elements.chatPicker.value = String(selected);
    }
  }

  function selectedChatItem() {
    return state.items.find((item) => String(item.id) === String(state.chatItemId)) || null;
  }

  function openChat(itemId) {
    if (itemId) state.chatItemId = String(itemId);
    renderChatPicker();
    elements.chat.hidden = false;
    elements.chatLauncher.setAttribute('aria-expanded', 'true');
    const item = selectedChatItem();
    if (item) elements.chatInput.value = `How should I care for my ${item.nickname} made of ${item.fabric}?`;
    elements.chatInput.focus();
  }

  function closeChat() {
    elements.chat.hidden = true;
    elements.chatLauncher.setAttribute('aria-expanded', 'false');
    elements.chatLauncher.focus();
  }

  function appendUserMessage(text) {
    const bubble = document.createElement('p');
    bubble.className = 'closet-chat__bubble closet-chat__bubble--user';
    bubble.textContent = text;
    elements.chatMessages.append(bubble);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  }

  function inferFabric(question, item) {
    const value = question.toLowerCase();
    const fabrics = [
      ['denim', 'Denim'],
      ['wool', 'Wool'],
      ['knit', 'Wool'],
      ['silk', 'Silk'],
      ['satin', 'Silk'],
      ['linen', 'Linen'],
      ['leather', 'Leather'],
      ['polyester', 'Polyester'],
      ['cotton', 'Cotton']
    ];
    const match = fabrics.find(([name]) => value.includes(name));
    if (match) return match[1];
    if (!item) return '';
    const itemFabric = normalizeFabric(item.fabric);
    return FABRIC_GUIDES[itemFabric] ? itemFabric : '';
  }

  function issueTip(question, item) {
    const findTips = (value) => {
      const tips = [];
      if (/fray|fraying|cuff|hem/.test(value)) tips.push(FIX_TIPS.fray);
      if (/tear|hole|rip/.test(value)) tips.push(FIX_TIPS.tear);
      if (/stain|spill|mark/.test(value)) tips.push(FIX_TIPS.stain);
      if (/button|zip|zipper|fastener/.test(value)) tips.push(FIX_TIPS.button);
      if (/fade|faded|refresh/.test(value)) tips.push(FIX_TIPS.fade);
      return tips;
    };
    const questionTips = findTips(question.toLowerCase());
    return (questionTips.length ? questionTips : findTips(String(item ? item.condition : '').toLowerCase())).join(' ');
  }

  function appendAssistantMessage(question) {
    const item = selectedChatItem();
    const fabric = inferFabric(question, item);
    const wrapper = document.createElement('article');
    wrapper.className = 'closet-chat__reply';
    const intro = document.createElement('p');
    intro.className = 'closet-chat__bubble closet-chat__bubble--assistant';

    if (fabric) {
      const guide = FABRIC_GUIDES[fabric];
      const itemMatchesFabric = item && normalizeFabric(item.fabric) === fabric;
      intro.textContent = `${itemMatchesFabric ? `For your ${item.nickname}, ` : `For ${fabric.toLowerCase()}, `}${guide}`;
    } else {
      intro.textContent = 'Pick a closet piece above or tell me its fabric, and I can give you a specific wash and drying guide. Always check the garment care label first.';
    }
    wrapper.append(intro);

    const tip = issueTip(question, item);
    if (tip) {
      const fix = document.createElement('p');
      fix.className = 'closet-chat__bubble closet-chat__bubble--assistant';
      fix.textContent = `For the repair: ${tip}`;
      wrapper.append(fix);
    } else if (/repair|upcycle|donate|circular|next step/.test(question.toLowerCase())) {
      const next = document.createElement('p');
      next.className = 'closet-chat__bubble closet-chat__bubble--assistant';
      next.textContent = 'If you love the piece, repair it first. If it no longer fits your life, try an upcycle or pass it on so it can be worn again.';
      wrapper.append(next);
    }

    const links = document.createElement('nav');
    links.className = 'closet-chat__next-steps';
    links.setAttribute('aria-label', 'Circular next steps');
    [
      ['Find a Tailor →', 'tailors.html'],
      ['Upcycle Ideas →', 'community.html'],
      ['List on Marketplace →', 'marketplace.html']
    ].forEach(([label, href]) => {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      links.append(link);
    });
    wrapper.append(links);
    elements.chatMessages.append(wrapper);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  }

  function sendMessage(text) {
    const question = String(text || '').trim();
    if (!question) return;
    appendUserMessage(question);
    appendAssistantMessage(question);
    elements.chatInput.value = '';
  }

  function outfitSignature(outfit) {
    return outfit.map((item) => String(item.id)).sort().join('|');
  }

  function buildOutfits() {
    const categoryItems = (category) => state.items.filter((item) => normalizeCategory(item.category) === category);
    const tops = categoryItems('Tops & Shirts');
    const bottoms = categoryItems('Bottoms');
    const dresses = categoryItems('Dresses');
    const outerwear = categoryItems('Outerwear');
    const accessories = categoryItems('Accessories');
    const footwear = categoryItems('Footwear');
    const outfits = [];

    const addWithExtras = (base) => {
      const layers = [null, ...outerwear];
      const finishing = [null, ...accessories];
      const shoes = [null, ...footwear];
      layers.forEach((layer) => finishing.forEach((accessory) => shoes.forEach((shoe) => {
        outfits.push([...base, layer, accessory, shoe].filter(Boolean));
      })));
    };

    dresses.forEach((dress) => addWithExtras([dress]));
    tops.forEach((top) => bottoms.forEach((bottom) => addWithExtras([top, bottom])));

    let lockedIds = [...state.lockedItemIds].map(String);
    const lockedItems = lockedIds.map((id) => state.items.find((item) => String(item.id) === id));
    if (lockedItems.some((item) => !item)) {
      state.lockedItemIds = new Set(lockedItems.filter(Boolean).map((item) => String(item.id)));
      lockedIds = [...state.lockedItemIds];
    }

    return outfits.filter((outfit) => {
      const categories = outfit.map((item) => normalizeCategory(item.category));
      if (categories.filter((category) => category === 'Tops & Shirts').length > 1
        || categories.filter((category) => category === 'Bottoms').length > 1
        || categories.filter((category) => category === 'Dresses').length > 1
        || categories.filter((category) => category === 'Outerwear').length > 1
        || categories.filter((category) => category === 'Accessories').length > 1
        || categories.filter((category) => category === 'Footwear').length > 1) return false;
      if (!lockedIds.every((id) => outfit.some((item) => String(item.id) === id))) return false;
      if (state.vibe === 'Rainy Day' && outfit.some((item) => normalizeFabric(item.fabric) === 'Silk')) return false;
      return true;
    });
  }

  function scoreOutfit(outfit) {
    const fabrics = outfit.map((item) => normalizeFabric(item.fabric));
    const categories = outfit.map((item) => normalizeCategory(item.category));
    let score = Math.random() * 0.35;
    if (state.vibe === 'College Casual') {
      score += fabrics.filter((fabric) => ['Cotton', 'Denim', 'Linen', 'Wool'].includes(fabric)).length * 3;
      if (categories.includes('Outerwear')) score += 1.7;
      if (categories.includes('Footwear')) score += 1.1;
    } else if (state.vibe === 'Rainy Day') {
      score += fabrics.filter((fabric) => ['Denim', 'Polyester', 'Cotton'].includes(fabric)).length * 3;
      if (categories.includes('Outerwear')) score += 4;
      if (categories.includes('Footwear')) score += 1.5;
    } else if (state.vibe === 'Festive / Brunch') {
      if (categories.includes('Dresses')) score += 5;
      score += fabrics.filter((fabric) => ['Silk', 'Linen'].includes(fabric)).length * 3;
      if (categories.includes('Accessories')) score += 3;
      if (categories.includes('Footwear')) score += 1;
    } else {
      score += outfit.length * 0.5;
    }
    return score;
  }

  function outfitNote(outfit, stylistNote) {
    const names = outfit.map((item) => item.nickname).join(' + ');
    const fabrics = [...new Set(outfit
      .map((item) => normalizeFabric(item.fabric))
      .filter((fabric) => Object.prototype.hasOwnProperty.call(FABRIC_GUIDES, fabric)))];
    const fabricText = fabrics.length
      ? `${fabrics.join(' and ')} work well together; ${fabrics[0].toLowerCase()} care: ${FABRIC_GUIDES[fabrics[0]]}`
      : 'Fabric details are unconfirmed, so check each care label and keep the layers comfortable for the weather.';
    const comfort = state.vibe === 'Rainy Day'
      ? 'The look avoids delicate silk and favors practical layers for damp weather.'
      : state.vibe === 'Festive / Brunch'
        ? 'This combination leans polished and lets the statement pieces stand out.'
        : state.vibe === 'College Casual'
          ? 'This is an easy everyday combination with comfortable pieces for a full campus day.'
          : 'This mix is easy to adapt to the day and the weather.';
    const aiNote = stylistNote ? ` ${stylistNote.trim()}` : '';
    return `${names}. ${fabricText} ${comfort}${aiNote}`;
  }

  function renderOutfit(outfit, note) {
    state.currentOutfit = outfit;
    state.currentNote = note;
    state.lastOutfitSignature = outfitSignature(outfit);
    elements.outfitPreview.replaceChildren();
    outfit.forEach((item, index) => {
      const frame = document.createElement('figure');
      frame.className = `closet-outfit-frame closet-outfit-frame--${Math.min(index + 1, 4)}`;
      const image = document.createElement('img');
      image.src = item.image_url || 'images/marketplace/item8.png';
      image.alt = item.nickname;
      const caption = document.createElement('figcaption');
      caption.textContent = item.nickname;
      const lock = document.createElement('button');
      lock.type = 'button';
      lock.className = 'closet-outfit-lock';
      const isLocked = state.lockedItemIds.has(String(item.id));
      lock.setAttribute('aria-pressed', String(isLocked));
      lock.setAttribute('aria-label', `${isLocked ? 'Unlock' : 'Lock'} ${item.nickname} in the next outfit`);
      lock.textContent = isLocked ? '📌 Locked' : '📌 Lock';
      lock.addEventListener('click', () => {
        if (state.lockedItemIds.has(String(item.id))) state.lockedItemIds.delete(String(item.id));
        else state.lockedItemIds.add(String(item.id));
        if (elements.generateOutfit.disabled) {
          state.generationId += 1;
          elements.generateOutfit.disabled = false;
          elements.generateOutfit.textContent = 'Generate New Look!';
        }
        renderOutfit(state.currentOutfit, state.currentNote);
      });
      frame.append(image, caption, lock);
      elements.outfitPreview.append(frame);
    });
    elements.outfitNote.textContent = note;
    updateSaveOutfitButton();
  }

  function selectedSmartOutfit(candidates) {
    const unique = candidates.filter((outfit) => outfitSignature(outfit) !== state.lastOutfitSignature);
    const choices = unique.length ? unique : candidates;
    if (!choices.length) return null;
    const ranked = choices
      .map((outfit) => ({ outfit, score: scoreOutfit(outfit) }))
      .sort((left, right) => right.score - left.score);
    const highest = ranked[0].score;
    const preferred = ranked.filter((candidate) => candidate.score >= highest - 1.25);
    return preferred[Math.floor(Math.random() * preferred.length)].outfit;
  }

  function parseAIOutfit(payload, candidates) {
    let result = payload;
    if (typeof result === 'string') {
      try {
        result = JSON.parse(result);
      } catch {
        return null;
      }
    }
    if (!result || typeof result !== 'object') return null;
    const data = result.result && typeof result.result === 'object' ? result.result : result;
    const outfitData = data.outfit && !Array.isArray(data.outfit) ? data.outfit : data;
    const rawItems = Array.isArray(data.selectedItemIds) ? data.selectedItemIds
      : Array.isArray(data.itemIds) ? data.itemIds
      : Array.isArray(outfitData.itemIds) ? outfitData.itemIds
        : Array.isArray(data.items) ? data.items
          : Array.isArray(data.outfit) ? data.outfit
            : null;
    if (!rawItems) return null;
    const ids = rawItems.map((item) => String(item && typeof item === 'object' ? item.id : item));
    const found = candidates.find((candidate) => outfitSignature(candidate) === ids.slice().sort().join('|'));
    if (!found) return null;
    const note = typeof data.note === 'string' ? data.note
      : typeof data.stylingNote === 'string' ? data.stylingNote
        : typeof outfitData.note === 'string' ? outfitData.note
          : '';
    return { outfit: found, note };
  }

  async function requestAIOutfit(candidates, generationId) {
    const response = await fetch(CIRCULAR_LOOK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vibe: state.vibe,
        items: state.items.map((item) => ({
          id: String(item.id),
          item_name: item.nickname,
          category: normalizeCategory(item.category),
          fabric: item.fabric,
          condition: item.condition
        })),
      }),
      signal: AbortSignal.timeout(20000)
    });
    if (!response.ok) throw new Error(`Stylist API returned ${response.status}.`);
    const result = parseAIOutfit(await response.json(), candidates);
    if (!result) throw new Error('Stylist API did not return a valid outfit from your closet.');
    if (generationId !== state.generationId) return null;
    if (outfitSignature(result.outfit) === state.lastOutfitSignature && candidates.some((candidate) => outfitSignature(candidate) !== state.lastOutfitSignature)) {
      throw new Error('Stylist API repeated the previous outfit.');
    }
    return result;
  }

  async function generateOutfit() {
    const generationId = ++state.generationId;
    const candidates = buildOutfits();
    if (!candidates.length) {
      state.currentOutfit = [];
      elements.outfitPreview.replaceChildren();
      elements.outfitNote.textContent = state.lockedItemIds.size
        ? 'Those locked pieces cannot form a complete outfit together. Unlock a piece and try again.'
        : 'Add a top and a bottom, or a dress, to start making outfit combinations.';
      updateSaveOutfitButton();
      elements.generateOutfit.disabled = false;
      elements.generateOutfit.textContent = 'Generate New Look!';
      return;
    }

    elements.generateOutfit.disabled = true;
    elements.saveOutfit.disabled = true;
    elements.generateOutfit.textContent = 'Generating AI Look...';
    let chosen = null;
    try {
      chosen = await requestAIOutfit(candidates, generationId);
    } catch (error) {
      console.warn('The local circular AI server is unavailable; using the smart local stylist.', error);
    }
    if (generationId !== state.generationId) return;

    if (!chosen) {
      const outfit = selectedSmartOutfit(candidates);
      if (!outfit) {
        elements.outfitNote.textContent = 'No new combination is available with the currently locked pieces. Unlock a piece to try a different look.';
      } else {
        chosen = { outfit, note: '' };
      }
    }

    if (chosen) {
      const note = outfitNote(chosen.outfit, chosen.note);
      renderOutfit(chosen.outfit, note);
    }
    elements.generateOutfit.disabled = false;
    elements.generateOutfit.textContent = 'Generate New Look!';
    updateSaveOutfitButton();
  }

  function updateCategory(category) {
    state.category = category;
    elements.categoryTabs.querySelectorAll('[data-category]').forEach((button) => {
      const active = button.dataset.category === category;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    renderCloset();
  }

  function clearPhotoPreview() {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    photoPreviewUrl = '';
    elements.photoPreview.removeAttribute('src');
    elements.photoPreview.hidden = true;
    elements.photoLabel.textContent = 'Choose a clothing photo';
  }

  function bindEvents() {
    elements.loginLink.addEventListener('click', () => {
      if (window.atelierAuth) window.atelierAuth.prepareLoginRedirect();
    });
    elements.categoryTabs.addEventListener('click', (event) => {
      const button = event.target.closest('[data-category]');
      if (button) updateCategory(button.dataset.category);
    });
    elements.viewButtons.forEach((button) => {
      button.addEventListener('click', () => setClosetView(button.dataset.closetView));
    });

    document.getElementById('open-closet-upload').addEventListener('click', showAddModal);
    document.getElementById('close-closet-upload').addEventListener('click', () => elements.uploadDialog.close());
    elements.uploadDialog.addEventListener('close', () => {
      state.editingItemId = null;
      elements.uploadTitle.textContent = 'Add a piece to your closet';
      elements.uploadButton.textContent = 'Save to My Closet';
      elements.uploadButton.disabled = false;
      elements.uploadForm.reset();
      clearPhotoPreview();
    });
    elements.uploadDialog.addEventListener('click', (event) => {
      if (event.target === elements.uploadDialog) elements.uploadDialog.close();
    });
    document.getElementById('open-lookbook-upload').addEventListener('click', () => {
      elements.lookbookForm.reset();
      clearLookbookPhotoPreview();
      elements.lookbookUploadStatus.textContent = '';
      elements.lookbookUploadButton.disabled = false;
      elements.lookbookUploadButton.textContent = 'Save to My Lookbook';
      elements.lookbookDialog.showModal();
    });
    document.getElementById('close-lookbook-upload').addEventListener('click', () => elements.lookbookDialog.close());
    elements.lookbookDialog.addEventListener('close', () => {
      elements.lookbookForm.reset();
      clearLookbookPhotoPreview();
      elements.lookbookUploadButton.disabled = false;
      elements.lookbookUploadButton.textContent = 'Save to My Lookbook';
    });
    elements.lookbookDialog.addEventListener('click', (event) => {
      if (event.target === elements.lookbookDialog) elements.lookbookDialog.close();
    });
    elements.lookbookPhoto.addEventListener('change', () => {
      const file = elements.lookbookPhoto.files && elements.lookbookPhoto.files[0];
      clearLookbookPhotoPreview();
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        elements.lookbookPhoto.value = '';
        elements.lookbookUploadStatus.textContent = 'Choose an image file for your outfit photo.';
        return;
      }
      lookbookPhotoPreviewUrl = URL.createObjectURL(file);
      elements.lookbookPhotoPreview.src = lookbookPhotoPreviewUrl;
      elements.lookbookPhotoPreview.hidden = false;
      elements.lookbookPhotoLabel.textContent = file.name;
      elements.lookbookUploadStatus.textContent = '';
    });
    elements.lookbookForm.addEventListener('submit', saveLookbookEntry);

    elements.photo.addEventListener('change', () => {
      const file = elements.photo.files && elements.photo.files[0];
      if (!file) {
        clearPhotoPreview();
        const editingItem = state.items.find((item) => String(item.id) === String(state.editingItemId));
        if (editingItem && editingItem.image_url) {
          elements.photoPreview.src = editingItem.image_url;
          elements.photoPreview.hidden = false;
          elements.photoLabel.textContent = 'Current photo · choose a new photo to replace it';
        }
        return;
      }
      if (!file.type.startsWith('image/')) {
        elements.photo.value = '';
        elements.uploadStatus.textContent = 'Choose an image file to add a closet piece.';
        return;
      }
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
      photoPreviewUrl = URL.createObjectURL(file);
      elements.photoPreview.src = photoPreviewUrl;
      elements.photoPreview.hidden = false;
      elements.photoLabel.textContent = file.name;
      elements.uploadStatus.textContent = '';
    });

    elements.uploadForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const file = elements.photo.files && elements.photo.files[0];
      const editingItem = state.editingItemId
        ? state.items.find((item) => String(item.id) === String(state.editingItemId))
        : null;
      if (state.editingItemId && !editingItem) {
        elements.uploadStatus.textContent = 'This closet piece is no longer available. Close the form and try again.';
        return;
      }
      if (!editingItem && !file) {
        elements.uploadStatus.textContent = 'Choose a clothing photo before saving.';
        return;
      }

      const submitLabel = elements.uploadButton.textContent;
      elements.uploadButton.disabled = true;
      elements.uploadButton.textContent = editingItem ? 'Saving changes…' : 'Saving your piece…';
      if (editingItem) {
        try {
          const saved = await saveEditedItem(editingItem, file);
          if (!saved) {
            elements.uploadButton.disabled = false;
            elements.uploadButton.textContent = submitLabel;
            return;
          }
        } catch (error) {
          console.error('Could not update the closet piece.', error);
          elements.uploadStatus.textContent = `Could not update this piece: ${error.message}`;
          elements.uploadButton.disabled = false;
          elements.uploadButton.textContent = submitLabel;
          return;
        }
        elements.uploadButton.disabled = false;
        elements.uploadButton.textContent = submitLabel;
        return;
      }

      elements.uploadStatus.textContent = 'Preparing your photo…';
      let imageUrl;
      let cloudinaryError = null;
      try {
        const uploaded = await uploadClosetPhoto(file);
        imageUrl = uploaded.imageUrl;
        cloudinaryError = uploaded.cloudinaryError;
      } catch (error) {
        console.error('The selected closet photo could not be prepared.', error);
        elements.uploadStatus.textContent = `Could not prepare this photo: ${error.message}`;
        elements.uploadButton.disabled = false;
        elements.uploadButton.textContent = submitLabel;
        return;
      }

      const newItem = {
        id: `closet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        user_id: state.user && state.user.id,
        nickname: elements.nickname.value.trim(),
        category: normalizeCategory(elements.category.value),
        fabric: normalizeFabric(elements.fabricInput.value),
        condition: elements.conditionInput.value,
        image_url: imageUrl,
        created_at: new Date().toISOString()
      };
      let savedRemotely = false;
      let remoteError = null;
      try {
        const { data, error } = await window.atelierSupabase.getClient()
          .from('closet_items')
          .insert({
            user_id: state.user.id,
            nickname: newItem.nickname,
            category: newItem.category,
            fabric: newItem.fabric,
            condition: newItem.condition,
            image_url: newItem.image_url
          })
          .select('*')
          .single();
        if (error) throw error;
        Object.assign(newItem, mapClosetRow(data));
        newItem.user_id = String(state.user.id);
        savedRemotely = true;
      } catch (error) {
        remoteError = error;
        console.warn('Closet item could not be saved to Supabase; keeping a local copy.', error);
      }

      const localItems = storedItems().filter((item) => String(item.id) !== String(newItem.id));
      localItems.unshift(newItem);
      const savedLocally = writeClosetItems(localItems);
      if (!savedLocally && !savedRemotely) {
        elements.uploadStatus.textContent = `Could not save your closet item locally or online. ${remoteError ? remoteError.message : ''}`;
        elements.uploadButton.disabled = false;
        elements.uploadButton.textContent = submitLabel;
        return;
      }

      state.items = mergeItems([...state.items, ...storedItems()], [newItem]);
      state.category = 'All';
      state.chatItemId = newItem.id;
      updateCategory('All');
      renderChatPicker();
      renderSavedOutfits();
      generateOutfit();
      elements.uploadDialog.close();
      const saveWarnings = [];
      if (!savedRemotely) {
        saveWarnings.push(`Supabase closet storage failed: ${remoteError.message}`);
      }
      if (!savedLocally) {
        saveWarnings.push('This browser could not cache the item locally.');
      }
      if (cloudinaryError) {
        saveWarnings.push(`Cloudinary failed: ${cloudinaryError.message}; its photo is stored as a local preview.`);
      }
      setStorageStatus(
        saveWarnings.length ? `Your piece was saved with a fallback. ${saveWarnings.join(' ')}` : 'Your new piece is saved to your Atelier closet.',
        saveWarnings.length ? 'warning' : 'success'
      );
      elements.uploadButton.disabled = false;
      elements.uploadButton.textContent = submitLabel;
    });

    document.querySelectorAll('[data-vibe]').forEach((button) => {
      button.addEventListener('click', () => {
        state.vibe = button.dataset.vibe;
        document.querySelectorAll('[data-vibe]').forEach((option) => {
          const active = option === button;
          option.classList.toggle('is-selected', active);
          option.setAttribute('aria-pressed', String(active));
        });
        updateSaveOutfitButton();
        generateOutfit();
      });
    });
    document.getElementById('generate-outfit').addEventListener('click', generateOutfit);
    elements.saveOutfit.addEventListener('click', saveCurrentOutfit);

    elements.chatLauncher.addEventListener('click', () => {
      if (elements.chat.hidden) openChat();
      else closeChat();
    });
    document.getElementById('closet-chat-close').addEventListener('click', closeChat);
    elements.chatPicker.addEventListener('change', () => {
      state.chatItemId = elements.chatPicker.value;
      const item = selectedChatItem();
      if (item) elements.chatInput.value = `How should I care for my ${item.nickname} made of ${item.fabric}?`;
    });
    document.querySelectorAll('[data-prompt]').forEach((button) => {
      button.addEventListener('click', () => sendMessage(button.dataset.prompt));
    });
    elements.chatForm.addEventListener('submit', (event) => {
      event.preventDefault();
      sendMessage(elements.chatInput.value);
    });
    elements.chatInput.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeChat();
    });
  }

  async function initialize() {
    bindEvents();
    const authenticated = await checkAuthentication();
    if (!authenticated) {
      showGate();
      return;
    }
    elements.loading.hidden = true;
    elements.gate.hidden = true;
    elements.app.hidden = false;
    elements.chatLauncher.hidden = false;
    await loadClosetItems();
  }

  document.addEventListener('DOMContentLoaded', initialize);
})();

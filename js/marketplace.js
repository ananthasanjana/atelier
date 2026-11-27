(() => {
  'use strict';

  const products = window.atelierMarketplaceProducts;

  const key = {
    cart: 'atelier_cart',
    wishlist: 'atelier_wishlist',
    bought: 'atelier_bought_items',
    listings: 'atelier_marketplace_items',
    legacyListings: 'atelier_marketplace_listings'
  };
  const grid = document.getElementById('marketplace-grid');
  const quickDialog = document.getElementById('quick-view-dialog');
  const listingDialog = document.getElementById('listing-dialog');
  const authPrompt = document.getElementById('market-auth-prompt');
  const authLoginLink = document.getElementById('market-auth-login');
  const authTrackLink = document.getElementById('market-auth-track');
  const checkedFilters = new Set();
  const state = { activity: 'all', search: '', quickCategory: 'all', price: '', category: '', condition: '' };
  let previewObjectUrl = '';
  let quickViewProductId = null;
  let remoteListings = null;

  function readArray(storageKey) {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.error(`Unable to read ${storageKey} from local storage.`, error);
      return [];
    }
  }

  function saveArray(storageKey, values) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(values));
      return true;
    } catch (error) {
      console.error(`Unable to save ${storageKey} to local storage.`, error);
      window.alert('Your browser could not save this change. Check available storage and try again.');
      return false;
    }
  }

  window.ensureAtelierMarketplaceItemsStored();

  function listings() {
    const savedListings = readArray(key.listings);
    const savedIds = new Set(savedListings.map((item) => item.id));
    const legacyListings = readArray(key.legacyListings).filter((item) => !savedIds.has(item.id));
    return [...legacyListings, ...savedListings];
  }

  function getSupabaseClient() {
    if (!window.atelierSupabase) throw new Error('Supabase is unavailable. Refresh the page and try again.');
    return window.atelierSupabase.getClient();
  }

  function currentSeller() {
    try {
      const profile = window.atelierSupabase.readCachedProfile();
      if (profile && profile.username) return profile.username;
      return 'atelier-maker';
    } catch (error) {
      console.error('Unable to read the current Atelier username.', error);
      return 'atelier-maker';
    }
  }

  function myListings() {
    return inventory().filter((item) => item.seller === currentSeller());
  }

  function inventory() {
    if (remoteListings && remoteListings.length) return remoteListings;
    const savedItems = listings();
    const savedById = new Map(savedItems.map((item) => [item.id, item]));
    const seededIds = new Set(products.map((product) => product.id));
    const seededProducts = products.map((product) => ({ ...product, ...savedById.get(product.id) }));
    return [...seededProducts, ...savedItems.filter((item) => !seededIds.has(item.id))]
      .filter((item) => String(item.status || 'available').toLowerCase() !== 'sold');
  }

  async function loadMarketplaceListings() {
    const status = document.getElementById('marketplace-data-status');
    status.textContent = 'Loading available listings…';
    try {
      const { data, error } = await getSupabaseClient()
        .from('marketplace_listings')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });
      if (error) throw error;
      remoteListings = (data || [])
        .map(window.normalizeAtelierMarketplaceListing)
        .filter((item) => item.id);
      status.textContent = '';
    } catch (error) {
      console.error('Unable to load marketplace listings from Supabase.', error);
      remoteListings = [];
      status.textContent = 'Live listings could not be loaded. Showing sample finds for now.';
    }
    updateFilterOptions();
    updateCounts();
    render();
  }

  function isAuthenticated() {
    return window.atelierAuth.isAuthenticated();
  }

  function showAuthPrompt(message) {
    document.getElementById('market-auth-message').textContent = message;
    authPrompt.hidden = false;
  }

  function requireLogin() {
    if (isAuthenticated()) return true;
    if (!window.atelierAuth.prepareLoginRedirect()) {
      showAuthPrompt('Log in to add items to your bag, wishlist pieces, or list an item! Allow session storage to return here after login.');
      return false;
    }
    showAuthPrompt('Log in to add items to your bag, wishlist pieces, or list an item!');
    return false;
  }

  function updateAuthControls() {
    const loggedIn = isAuthenticated();
    document.querySelectorAll('[data-auth-only]').forEach((control) => {
      control.hidden = !loggedIn;
    });
    authTrackLink.hidden = loggedIn;
    if (loggedIn) authPrompt.hidden = true;
    if (!loggedIn && state.activity !== 'all') {
      state.activity = 'all';
      document.querySelectorAll('[data-activity]').forEach((button) => {
        button.classList.toggle('is-active', button.dataset.activity === 'all');
      });
    }
  }

  function money(price) {
    return `₹${Number(price).toLocaleString('en-IN')}`;
  }

  function isWishlisted(id) {
    return isAuthenticated() && readArray(key.wishlist).includes(id);
  }

  function addToCart(product) {
    if (!requireLogin()) return;
    const cart = readArray(key.cart);
    const item = cart.find((entry) => entry.id === product.id);
    if (item) item.quantity = Math.min(99, Math.max(1, Number(item.quantity) || 1) + 1);
    else cart.push({ ...product, quantity: 1 });
    if (saveArray(key.cart, cart)) syncCartUI();
  }

  function cartQuantity(id) {
    if (!isAuthenticated()) return 0;
    const item = readArray(key.cart).find((entry) => entry.id === id);
    return item ? Math.min(99, Math.max(1, Number(item.quantity) || 1)) : 0;
  }

  function cartControl(product, buttonClass) {
    const quantity = cartQuantity(product.id);
    if (!quantity) {
      return `<button class="${buttonClass}" type="button" data-add-cart="${escapeHtml(product.id)}">Add to Cart</button>`;
    }

    return `
      <div class="marketplace-quantity-control cart-quantity" role="group" aria-label="${escapeHtml(product.title)} quantity">
        <button type="button" data-cart-step="-1" data-cart-id="${escapeHtml(product.id)}" aria-label="Decrease ${escapeHtml(product.title)} quantity">−</button>
        <span aria-live="polite">${quantity}</span>
        <button type="button" data-cart-step="1" data-cart-id="${escapeHtml(product.id)}" aria-label="Increase ${escapeHtml(product.title)} quantity"${quantity >= 99 ? ' disabled' : ''}>+</button>
      </div>`;
  }

  function changeCartQuantity(id, amount) {
    if (!requireLogin()) return;
    const cart = readArray(key.cart);
    const item = cart.find((entry) => entry.id === id);
    if (!item) return;

    const quantity = Math.min(99, Math.max(1, Number(item.quantity) || 1)) + amount;
    const nextCart = quantity > 0
      ? cart.map((entry) => entry.id === id ? { ...entry, quantity } : entry)
      : cart.filter((entry) => entry.id !== id);
    if (saveArray(key.cart, nextCart)) syncCartUI();
  }

  function syncCartUI() {
    render();
    updateCounts();
    if (quickDialog.open && quickViewProductId) renderQuickView(quickViewProductId);
  }

  function toggleWishlist(product) {
    if (!requireLogin()) return;
    const wishlist = readArray(key.wishlist);
    const next = wishlist.includes(product.id)
      ? wishlist.filter((id) => id !== product.id)
      : [...wishlist, product.id];
    if (saveArray(key.wishlist, next)) {
      render();
      updateCounts();
      const dialogWishlistButton = quickDialog.querySelector('[data-wishlist]');
      if (dialogWishlistButton) {
        const saved = isWishlisted(dialogWishlistButton.dataset.wishlist);
        dialogWishlistButton.textContent = saved ? '♥ Wishlisted' : '♡ Wishlist';
        dialogWishlistButton.setAttribute('aria-pressed', String(saved));
      }
    }
  }

  function matchesPrice(product) {
    if (!state.price) return true;
    if (state.price === '0-300') return product.price < 300;
    if (state.price === '300-600') return product.price >= 300 && product.price <= 600;
    if (state.price === '600-1000') return product.price > 600 && product.price <= 1000;
    return product.price > 1000;
  }

  function productMatches(product) {
    const searchText = `${product.title} ${product.seller} ${product.tags.join(' ')} ${product.sellerType} ${product.category || ''} ${product.condition || ''}`.toLowerCase();
    if (state.search && !searchText.includes(state.search.toLowerCase())) return false;
    if (!matchesPrice(product)) return false;
    if (state.category && String(product.category || product.tags[0] || '').toLowerCase() !== state.category.toLowerCase()) return false;
    if (state.condition && String(product.condition || 'Good').toLowerCase() !== state.condition) return false;

    const selected = [...checkedFilters];
    const sellerFilters = selected.filter((filter) => filter.type === 'seller');
    const tagFilters = selected.filter((filter) => filter.type === 'tag');
    if (sellerFilters.length && !sellerFilters.some((filter) => product.sellerType === filter.value)) return false;
    if (tagFilters.length && !tagFilters.some((filter) => product.tags.some((tag) => tag.toLowerCase().includes(filter.value)))) return false;

    if (state.quickCategory !== 'all') {
      const categoryMatches = state.quickCategory === 'small-business'
        ? product.sellerType === 'small-business'
        : state.quickCategory === 'local-artisan'
          ? product.sellerType === 'local-artisan'
          : product.tags.some((tag) => tag.toLowerCase().includes(state.quickCategory));
      if (!categoryMatches) return false;
    }

    if (state.activity === 'wishlist' && !isWishlisted(product.id)) return false;
    if (state.activity === 'bought' && !readArray(key.bought).some((item) => item.id === product.id)) return false;
    if (state.activity === 'listings' && !myListings().some((item) => item.id === product.id)) return false;
    return true;
  }

  function productCard(product) {
    const card = document.createElement('article');
    card.className = `marketplace-card marketplace-card--${product.color || 'cream'}`;
    card.innerHTML = `
      <div class="marketplace-card__tags">${product.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
      <button class="marketplace-heart${isWishlisted(product.id) ? ' is-saved' : ''}" type="button" data-wishlist="${escapeHtml(product.id)}" aria-label="${isWishlisted(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}" aria-pressed="${isWishlisted(product.id)}">${isWishlisted(product.id) ? '♥' : '♡'}</button>
      <button class="marketplace-card__image-button" type="button" data-quick-view="${escapeHtml(product.id)}" aria-label="View ${escapeHtml(product.title)}">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}" loading="lazy">
        <span class="marketplace-doodle" aria-hidden="true">✧ ♡</span>
      </button>
      <div class="marketplace-card__info">
        <button class="marketplace-card__title" type="button" data-quick-view="${escapeHtml(product.id)}">${escapeHtml(product.title)}</button>
        <a class="marketplace-seller" href="profile.html?user=${encodeURIComponent(product.seller)}">@${escapeHtml(product.seller)}</a>
        <div class="marketplace-card__bottom"><strong>${money(product.price)}</strong>${cartControl(product, 'marketplace-add-button')}</div>
      </div>`;
    return card;
  }

  function render() {
    updateAuthControls();
    updateFilterOptions();
    const visible = inventory().filter(productMatches);
    grid.replaceChildren(...visible.map(productCard));
    document.getElementById('marketplace-empty').hidden = visible.length > 0;
    document.getElementById('marketplace-result-count').textContent = `${visible.length} ${visible.length === 1 ? 'find' : 'finds'}`;
  }

  function updateFilterOptions() {
    const categorySelect = document.getElementById('market-category-filter');
    const conditionSelect = document.getElementById('market-condition-filter');
    const categories = [...new Set(inventory().map((item) => String(item.category || item.tags[0] || '').trim()).filter(Boolean))]
      .sort((left, right) => left.localeCompare(right));
    const categoryOptions = ['<option value="">All categories</option>', ...categories.map((category) => (
      `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`
    ))].join('');
    if (categorySelect.innerHTML !== categoryOptions) {
      categorySelect.innerHTML = categoryOptions;
      categorySelect.value = categories.find((category) => category.toLowerCase() === state.category.toLowerCase()) || '';
      state.category = categorySelect.value;
    }

    const conditions = [...new Set(inventory().map((item) => String(item.condition || 'Good').trim()).filter(Boolean))]
      .sort((left, right) => left.localeCompare(right));
    const conditionOptions = ['<option value="">All conditions</option>', ...conditions.map((condition) => (
      `<option value="${escapeHtml(condition.toLowerCase())}">${escapeHtml(condition)}</option>`
    ))].join('');
    if (conditionSelect.innerHTML !== conditionOptions) {
      conditionSelect.innerHTML = conditionOptions;
      conditionSelect.value = conditions.find((condition) => condition.toLowerCase() === state.condition) || '';
      state.condition = conditionSelect.value;
    }
  }

  function updateCounts() {
    const loggedIn = isAuthenticated();
    const cart = readArray(key.cart);
    const wishlist = loggedIn ? readArray(key.wishlist) : [];
    const bought = loggedIn ? readArray(key.bought) : [];
    const listed = loggedIn ? myListings() : [];
    document.getElementById('nav-cart-count').textContent = cart.reduce((total, item) => total + (Number(item.quantity) || 1), 0);
    document.getElementById('nav-wishlist-count').textContent = wishlist.length;
    document.getElementById('count-all').textContent = inventory().length;
    document.getElementById('count-wishlist').textContent = wishlist.length;
    document.getElementById('count-bought').textContent = bought.length;
    document.getElementById('count-listings').textContent = listed.length;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function renderQuickView(id) {
    const product = inventory().find((item) => item.id === id);
    if (!product) return;
    quickViewProductId = id;
    document.getElementById('quick-view-content').innerHTML = `
      <div class="marketplace-quick-view">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}">
        <div><p class="marketplace-eyebrow">${product.tags.map(escapeHtml).join(' · ')}</p>
          <h2 id="quick-view-title">${escapeHtml(product.title)}</h2>
          <a class="marketplace-seller" href="profile.html?user=${encodeURIComponent(product.seller)}">@${escapeHtml(product.seller)}</a>
          <p>${escapeHtml(product.description)}</p><strong class="marketplace-quick-price">${money(product.price)}</strong>
          <div class="marketplace-quick-actions">
            ${cartControl(product, 'marketplace-primary-button')}
            <button type="button" class="marketplace-secondary-button" data-wishlist="${escapeHtml(product.id)}">${isWishlisted(product.id) ? '♥ Wishlisted' : '♡ Wishlist'}</button>
          </div>
        </div>
      </div>`;
  }

  function showQuickView(id) {
    renderQuickView(id);
    if (!quickDialog.open) quickDialog.showModal();
  }

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const quantityButton = target.closest('[data-cart-step]');
    if (quantityButton) {
      changeCartQuantity(quantityButton.dataset.cartId, Number(quantityButton.dataset.cartStep));
      return;
    }
    const wishlistButton = target.closest('[data-wishlist]');
    if (wishlistButton) {
      if (!requireLogin()) return;
      const product = inventory().find((item) => item.id === wishlistButton.dataset.wishlist);
      if (product) toggleWishlist(product);
      return;
    }
    const addButton = target.closest('[data-add-cart]');
    if (addButton) {
      const product = inventory().find((item) => item.id === addButton.dataset.addCart);
      if (product) addToCart(product);
      return;
    }
    const quickViewButton = target.closest('[data-quick-view]');
    if (quickViewButton) showQuickView(quickViewButton.dataset.quickView);
  });

  document.querySelectorAll('[data-quick-category]').forEach((button) => {
    button.addEventListener('click', () => {
      state.quickCategory = button.dataset.quickCategory;
      document.querySelectorAll('[data-quick-category]').forEach((item) => item.classList.toggle('is-active', item === button));
      render();
    });
  });
  document.getElementById('market-search').addEventListener('input', (event) => {
    state.search = event.target.value.trim();
    render();
  });
  document.getElementById('market-category-filter').addEventListener('change', (event) => {
    state.category = event.target.value;
    render();
  });
  document.getElementById('market-condition-filter').addEventListener('change', (event) => {
    state.condition = event.target.value;
    render();
  });
  document.querySelectorAll('[data-filter]').forEach((input) => {
    input.addEventListener('change', () => {
      const filter = `${input.dataset.filter}:${input.value}`;
      if (input.checked) checkedFilters.add({ key: filter, type: input.dataset.filter, value: input.value });
      else {
        for (const entry of checkedFilters) if (entry.key === filter) checkedFilters.delete(entry);
      }
      render();
    });
  });
  document.querySelectorAll('[data-activity]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.activity !== 'all' && !requireLogin()) return;
      state.activity = button.dataset.activity;
      document.querySelectorAll('[data-activity]').forEach((item) => item.classList.toggle('is-active', item === button));
      render();
    });
  });
  document.querySelectorAll('[data-price]').forEach((button) => {
    button.addEventListener('click', () => {
      state.price = state.price === button.dataset.price ? '' : button.dataset.price;
      document.querySelectorAll('[data-price]').forEach((item) => item.classList.toggle('is-active', item === button && state.price !== ''));
      render();
    });
  });
  document.getElementById('open-listing').addEventListener('click', () => {
    if (requireLogin()) listingDialog.showModal();
  });
  document.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => button.closest('dialog').close());
  });
  document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  });
  document.querySelector('.marketplace-nav-icon[href="#wishlist"]').addEventListener('click', (event) => {
    event.preventDefault();
    if (!requireLogin()) return;
    state.activity = 'wishlist';
    document.querySelectorAll('[data-activity]').forEach((item) => item.classList.toggle('is-active', item.dataset.activity === 'wishlist'));
    render();
    document.getElementById('marketplace-result-count').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  document.getElementById('close-market-auth-prompt').addEventListener('click', () => {
    authPrompt.hidden = true;
  });
  [authLoginLink, authTrackLink].forEach((link) => {
    link.addEventListener('click', (event) => {
      if (!window.atelierAuth.prepareLoginRedirect()) {
        event.preventDefault();
        showAuthPrompt('We could not save your place. Please allow session storage before logging in.');
      }
    });
  });

  const photoInput = document.getElementById('listing-photo');
  photoInput.addEventListener('change', () => {
    const file = photoInput.files && photoInput.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      document.getElementById('listing-message').textContent = 'Please choose an image file.';
      photoInput.value = '';
      return;
    }
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = URL.createObjectURL(file);
    const preview = document.getElementById('listing-preview');
    preview.src = previewObjectUrl;
    preview.hidden = false;
    document.getElementById('listing-photo-label').textContent = file.name;
  });
  document.getElementById('listing-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!requireLogin()) {
      listingDialog.close();
      return;
    }
    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get('photo');
    const submit = form.querySelector('[type="submit"]');
    const message = document.getElementById('listing-message');
    submit.disabled = true;
    message.textContent = 'Preparing your listing…';
    let session;
    try {
      session = await window.atelierSupabase.getSession();
    } catch (error) {
      console.error('Unable to verify the seller session.', error);
      message.textContent = 'Your sign-in could not be verified. Please refresh and try again.';
      submit.disabled = false;
      return;
    }
    if (!session) {
      message.textContent = 'Please log in again before listing an item.';
      submit.disabled = false;
      return;
    }
    let image = '';
    if (file instanceof File && file.size > 0) {
      try {
        image = await window.atelierSupabase.uploadImage(file);
      } catch (error) {
        console.error('Cloudinary listing photo upload failed.', error);
        message.textContent = `Photo upload failed: ${error.message || 'Please try again.'}`;
        submit.disabled = false;
        return;
      }
    }
    const profile = window.atelierSupabase.readCachedProfile();
    const metadata = session.user.user_metadata || {};
    const seller = profile && profile.id === session.user.id
      ? profile.username
      : window.atelierSupabase.normalizeUsername(metadata.username || metadata.user_name || session.user.email?.split('@')[0]) || `member_${session.user.id.slice(0, 8)}`;
    const category = String(formData.get('category'));
    const newProduct = {
      title: String(formData.get('title')).trim(),
      price: Number(formData.get('price')),
      category,
      condition: String(formData.get('condition')),
      tags: [category.toLowerCase()],
      seller,
      seller_id: session.user.id,
      sellerType: String(formData.get('sellerType')).toLowerCase().replace(/\s+/g, '-'),
      upiId: String(formData.get('upiId')).trim(),
      contact: String(formData.get('contact')).trim(),
      image,
      description: String(formData.get('description')).trim(),
      color: 'cream'
    };
    if (
      !newProduct.title
      || !Number.isFinite(newProduct.price)
      || newProduct.price < 1
      || !newProduct.description
      || !newProduct.upiId
      || !newProduct.contact
      || !image
    ) {
      message.textContent = 'Please complete each field and choose a photo.';
      submit.disabled = false;
      return;
    }
    try {
      const listingRow = {
        seller_id: newProduct.seller_id,
        seller_username: newProduct.seller,
        item_name: newProduct.title,
        category: newProduct.category,
        condition: newProduct.condition,
        seller_type: newProduct.sellerType,
        price: newProduct.price,
        upi_id: newProduct.upiId,
        image_url: newProduct.image,
        description: newProduct.description,
        status: 'available'
      };
      const { data, error } = await getSupabaseClient()
        .from('marketplace_listings')
        .insert(listingRow)
        .select('*')
        .single();
      if (error) throw error;
      const savedProduct = window.normalizeAtelierMarketplaceListing(data);
      const next = [...readArray(key.listings), savedProduct];
      try {
        localStorage.setItem(key.listings, JSON.stringify(next));
      } catch (storageError) {
        console.warn('Listing was saved to Supabase but could not be cached locally.', storageError);
      }
      remoteListings = [savedProduct, ...(remoteListings || []).filter((item) => item.id !== savedProduct.id)];
      form.reset();
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
      previewObjectUrl = '';
      document.getElementById('listing-preview').hidden = true;
      document.getElementById('listing-photo-label').textContent = 'Choose a photo';
      message.textContent = 'Your item is listed!';
      state.activity = 'listings';
      document.querySelectorAll('[data-activity]').forEach((item) => item.classList.toggle('is-active', item.dataset.activity === 'listings'));
      updateCounts();
      render();
      window.setTimeout(() => listingDialog.close(), 900);
    } catch (error) {
      console.error('Unable to create marketplace listing in Supabase.', error);
      message.textContent = `Your listing could not be saved: ${error.message || 'Please try again.'}`;
    }
    submit.disabled = false;
  });

  window.addEventListener('storage', () => {
    updateAuthControls();
    updateCounts();
    render();
  });
  window.addEventListener('atelier:profile-updated', render);
  function applyActivityFromHash() {
    if (window.location.hash !== '#wishlist' && window.location.hash !== '#bought') return;
    if (!isAuthenticated()) {
      state.activity = 'all';
      updateAuthControls();
      showAuthPrompt(window.location.hash === '#wishlist'
        ? 'Log in to add items to your bag, wishlist pieces, or list an item!'
        : 'Log in to track your orders & wishlist.');
      render();
      return;
    }
    state.activity = window.location.hash === '#bought' ? 'bought' : 'wishlist';
    document.querySelectorAll('[data-activity]').forEach((item) => item.classList.toggle('is-active', item.dataset.activity === state.activity));
    render();
  }
  window.addEventListener('hashchange', applyActivityFromHash);
  applyActivityFromHash();
  updateCounts();
  render();
  loadMarketplaceListings();
})();

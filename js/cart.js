(() => {
  'use strict';

  const cartKey = 'atelier_cart';
  const wishlistKey = 'atelier_wishlist';
  const boughtKey = 'atelier_bought_items';
  const listingsKey = 'atelier_marketplace_items';
  const legacyListingsKey = 'atelier_marketplace_listings';
  const cartItems = document.getElementById('cart-items');
  const wishlistItems = document.getElementById('wishlist-items');
  const orderSellerPayments = document.getElementById('order-seller-payments');
  const cartMessage = document.getElementById('cart-message');
  const cartLayout = document.querySelector('.cart-layout');
  const wishlistTab = document.getElementById('wishlist-tab');
  const wishlistPanel = document.getElementById('wishlist-panel');
  const cartLoginLink = document.getElementById('cart-login-link');
  const purchaseButton = document.getElementById('complete-purchase');
  let orderPlaced = false;
  let remoteListings = null;
  window.ensureAtelierMarketplaceItemsStored();

  function readArray(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.error(`Unable to read ${key} from local storage.`, error);
      cartMessage.textContent = 'Some saved shopping data could not be read. Check your browser storage and reload this page.';
      return [];
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Unable to save ${key} to local storage.`, error);
      cartMessage.textContent = 'Your browser could not save this change. Check available storage and try again.';
      return false;
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function itemId(entry) {
    return typeof entry === 'string' ? entry : entry && typeof entry.id === 'string' ? entry.id : '';
  }

  function inventory() {
    if (remoteListings && remoteListings.length) return remoteListings;
    const savedItems = readArray(listingsKey);
    const savedById = new Map(savedItems.map((item) => [item.id, item]));
    const seededProducts = (window.atelierMarketplaceProducts || [])
      .map((product) => ({ ...product, ...savedById.get(product.id) }));
    const seededIds = new Set(seededProducts.map((item) => item.id));
    const savedListings = readArray(listingsKey);
    const savedIds = new Set(savedItems.map((item) => item.id));
    const legacyListings = readArray(legacyListingsKey).filter((item) => !savedIds.has(item.id));
    return [...seededProducts, ...savedListings.filter((item) => !seededIds.has(item.id)), ...legacyListings]
      .filter((item) => String(item.status || 'available').toLowerCase() !== 'sold');
  }

  async function loadMarketplaceListings() {
    try {
      const { data, error } = await window.atelierSupabase.getClient()
        .from('marketplace_listings')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });
      if (error) throw error;
      remoteListings = (data || []).map(window.normalizeAtelierMarketplaceListing).filter((item) => item.id);
      render();
    } catch (error) {
      console.error('Unable to load marketplace listings for the cart.', error);
      remoteListings = [];
      cartMessage.textContent = 'Live listing details could not be loaded. Your saved bag is still available; please try again before ordering.';
      render();
    }
  }

  function productFor(id) {
    return inventory().find((item) => item.id === id);
  }

  function displayTags(item) {
    const tags = Array.isArray(item.tags) ? item.tags : item.category ? [item.category] : [];
    return tags.length ? tags.join(' · ') : 'Atelier find';
  }

  function currency(value) {
    return `₹${Number(value || 0).toLocaleString('en-IN')}`;
  }

  function quantityFor(item) {
    return Math.max(1, Math.min(99, Number.parseInt(item.quantity, 10) || 1));
  }

  function isAuthenticated() {
    return window.atelierAuth.isAuthenticated();
  }

  function updateAuthControls() {
    const loggedIn = isAuthenticated();
    document.getElementById('cart-login-gate').hidden = loggedIn;
    wishlistTab.hidden = !loggedIn;
    if (!loggedIn && !wishlistPanel.hidden) {
      document.getElementById('bag-tab').click();
    }
  }

  function renderCart() {
    const items = readArray(cartKey);
    cartItems.replaceChildren();
    let subtotal = 0;
    items.forEach((item) => {
      const quantity = quantityFor(item);
      const price = Number(item.price) || 0;
      const itemSubtotal = price * quantity;
      subtotal += itemSubtotal;
      const row = document.createElement('article');
      row.className = 'cart-item';
      row.innerHTML = `
        <img class="cart-item__image" src="${escapeHtml(item.image || '')}" alt="${escapeHtml(item.title || 'Atelier item')}">
        <div class="cart-item__details">
          <p class="cart-item__category">${escapeHtml(displayTags(item))}</p>
          <h2>${escapeHtml(item.title || 'Atelier find')}</h2>
          <a class="marketplace-seller" href="profile.html?user=${encodeURIComponent(item.seller || '')}">@${escapeHtml(item.seller || 'atelier-maker')}</a>
          <strong class="cart-item__subtotal">${currency(itemSubtotal)}</strong>
        </div>
        <div class="cart-item__actions">
          <div class="cart-quantity" aria-label="Quantity controls for ${escapeHtml(item.title || 'Atelier item')}">
            <button type="button" data-quantity-minus="${escapeHtml(item.id)}" aria-label="Decrease quantity">−</button>
            <span aria-live="polite">${quantity}</span>
            <button type="button" data-quantity-plus="${escapeHtml(item.id)}" aria-label="Increase quantity">+</button>
          </div>
          <button type="button" class="cart-remove" data-remove="${escapeHtml(item.id)}" aria-label="Remove ${escapeHtml(item.title || 'item')}">×</button>
        </div>`;
      cartItems.append(row);
    });

    const count = items.reduce((total, item) => total + quantityFor(item), 0);
    document.getElementById('cart-count').textContent = String(count);
    document.getElementById('nav-cart-count').textContent = String(count);
    document.getElementById('nav-wishlist-count').textContent = String(isAuthenticated() ? readArray(wishlistKey).length : 0);
    document.getElementById('cart-subtotal').textContent = currency(subtotal);
    document.getElementById('cart-empty').hidden = items.length > 0 || orderPlaced;
    document.getElementById('complete-purchase').disabled = items.length === 0 || !isAuthenticated();
    updateTotal(subtotal);
  }

  function wishlistProducts() {
    if (!isAuthenticated()) return [];
    return readArray(wishlistKey).map((entry) => {
      if (entry && typeof entry === 'object' && entry.id && entry.title) return entry;
      return productFor(itemId(entry));
    }).filter(Boolean);
  }

  function renderWishlist() {
    if (!isAuthenticated()) {
      wishlistItems.replaceChildren();
      document.getElementById('wishlist-count').textContent = '0';
      document.getElementById('wishlist-empty').hidden = true;
      return;
    }
    const entries = readArray(wishlistKey);
    const products = wishlistProducts();
    wishlistItems.replaceChildren();
    products.forEach((item) => {
      const row = document.createElement('article');
      row.className = 'cart-item cart-wishlist-item';
      row.innerHTML = `
        <img class="cart-item__image" src="${escapeHtml(item.image || '')}" alt="${escapeHtml(item.title || 'Saved item')}">
        <div class="cart-item__details">
          <p class="cart-item__category">${escapeHtml(displayTags(item))}</p>
          <h2>${escapeHtml(item.title || 'Atelier find')}</h2>
          <a class="marketplace-seller" href="profile.html?user=${encodeURIComponent(item.seller || '')}">@${escapeHtml(item.seller || 'atelier-maker')}</a>
          <strong class="cart-item__subtotal">${currency(item.price)}</strong>
        </div>
        <div class="cart-item__actions cart-wishlist-item__actions">
          <button type="button" class="marketplace-primary-button cart-move-button" data-move-to-bag="${escapeHtml(item.id)}">Move to Bag</button>
          <button type="button" class="cart-remove" data-remove-wishlist="${escapeHtml(item.id)}" aria-label="Remove ${escapeHtml(item.title || 'saved item')} from wishlist">Remove</button>
        </div>`;
      wishlistItems.append(row);
    });

    document.getElementById('wishlist-count').textContent = String(entries.length);
    document.getElementById('wishlist-empty').hidden = entries.length > 0;
    if (products.length !== entries.length) {
      const unavailable = entries.filter((entry) => !products.some((item) => item.id === itemId(entry)));
      unavailable.forEach((entry) => {
        const row = document.createElement('article');
        row.className = 'cart-unavailable-item';
        row.innerHTML = `<span>This saved item is no longer available.</span><button type="button" data-remove-wishlist="${escapeHtml(itemId(entry))}">Remove</button>`;
        wishlistItems.append(row);
      });
    }
  }

  function shippingCost() {
    return document.querySelector('input[name="delivery"]:checked').value === 'courier' ? 50 : 0;
  }

  function updateTotal(subtotal) {
    const total = subtotal + shippingCost();
    document.getElementById('cart-total').textContent = currency(total);
    document.querySelectorAll('.cart-delivery-choice').forEach((choice) => {
      const radio = choice.querySelector('input');
      choice.classList.toggle('is-selected', radio.checked);
    });
  }

  function render() {
    updateAuthControls();
    renderCart();
    renderWishlist();
  }

  function changeQuantity(id, amount) {
    const items = readArray(cartKey);
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    item.quantity = Math.max(1, Math.min(99, quantityFor(item) + amount));
    if (save(cartKey, items)) renderCart();
  }

  function moveToBag(id) {
    if (!isAuthenticated()) {
      window.atelierAuth.prepareLoginRedirect();
      cartMessage.textContent = 'Log in to add items to your bag.';
      document.getElementById('cart-login-gate').hidden = false;
      return;
    }
    const product = productFor(id);
    if (!product) {
      cartMessage.textContent = 'That saved item is no longer available to add.';
      return;
    }
    const oldCart = readArray(cartKey);
    const nextCart = [...oldCart];
    const existing = nextCart.find((item) => item.id === id);
    if (existing) existing.quantity = quantityFor(existing) + 1;
    else nextCart.push({ ...product, quantity: 1 });
    if (!save(cartKey, nextCart)) return;

    const oldWishlist = readArray(wishlistKey);
    const nextWishlist = oldWishlist.filter((entry) => itemId(entry) !== id);
    if (!save(wishlistKey, nextWishlist)) {
      save(cartKey, oldCart);
      return;
    }
    cartMessage.textContent = 'Moved to your Atelier Bag.';
    render();
  }

  function localDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function createOrderId(date) {
    const suffix = window.crypto && typeof window.crypto.randomUUID === 'function'
      ? window.crypto.randomUUID().slice(0, 8).toUpperCase()
      : Math.random().toString(36).slice(2, 10).toUpperCase();
    return `ATL-${date.replace(/-/g, '')}-${suffix}`;
  }

  function sellerDisplayName(handle) {
    return String(handle || 'Atelier seller')
      .replace(/^@/, '')
      .replace(/[._-]+/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  function sellerOrders(items) {
    const sellers = new Map();
    items.forEach((item) => {
      const savedProduct = productFor(item.id) || {};
      const product = { ...savedProduct, ...item };
      const handle = String(product.seller || 'atelier-maker').replace(/^@/, '');
      const group = sellers.get(handle) || {
        handle,
        upiId: product.upiId || '',
        contact: product.contact || '',
        items: [],
        subtotal: 0
      };
      const quantity = quantityFor(product);
      const lineTotal = (Number(product.price) || 0) * quantity;
      group.upiId = product.upiId || group.upiId;
      group.contact = product.contact || group.contact;
      group.items.push({ title: product.title || 'Atelier find', quantity, lineTotal });
      group.subtotal += lineTotal;
      sellers.set(handle, group);
    });
    return [...sellers.values()];
  }

  function whatsappLink(contact, message) {
    const phone = String(contact || '').replace(/\D/g, '');
    if (!/^\d{10,15}$/.test(phone)) return '';
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  function renderSellerPayments(items, orderId, orderTotal) {
    const sellers = sellerOrders(items);
    orderSellerPayments.replaceChildren(...sellers.map((seller) => {
      const card = document.createElement('article');
      card.className = 'cart-order-seller';
      const itemLines = seller.items.map((item) => `
        <li><span>${escapeHtml(item.title)} × ${item.quantity}</span><strong>${currency(item.lineTotal)}</strong></li>
      `).join('');
      const upiLink = `upi://pay?${new URLSearchParams({
        pa: seller.upiId,
        pn: sellerDisplayName(seller.handle),
        am: seller.subtotal.toFixed(2),
        cu: 'INR'
      }).toString()}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiLink)}`;
      const whatsappMessage = `Hi @${seller.handle}, I placed order ${orderId} for ${seller.items.map((item) => item.title).join(', ')}. Seller subtotal: ${currency(seller.subtotal)}. Order total: ${currency(orderTotal)}. I am sharing my payment screenshot here.`;
      const whatsappHref = whatsappLink(seller.contact, whatsappMessage);
      const contactText = String(seller.contact || '').trim();
      const instagramHandle = contactText.match(/^@?([a-zA-Z0-9._]+)$/);
      const screenshotAction = whatsappHref
        ? `<a class="cart-whatsapp-button" href="${whatsappHref}" target="_blank" rel="noopener noreferrer">Send Payment Screenshot on WhatsApp →</a>`
        : instagramHandle
          ? `<a class="cart-whatsapp-button" href="https://www.instagram.com/${encodeURIComponent(instagramHandle[1])}/" target="_blank" rel="noopener noreferrer">Contact @${escapeHtml(instagramHandle[1])} on Instagram →</a>`
          : '<p class="cart-seller-contact-note">Seller contact details are not available.</p>';

      card.innerHTML = `
        <div class="cart-order-seller__header">
          <div><p class="marketplace-eyebrow">Seller</p><h3>@${escapeHtml(seller.handle)}</h3></div>
          <strong>${currency(seller.subtotal)}</strong>
        </div>
        <ul class="cart-order-seller__items">${itemLines}</ul>
        <div class="cart-seller-payment">
          <div class="cart-seller-payment__details">
            <p>Seller UPI ID</p>
            <code>${escapeHtml(seller.upiId || 'Not provided')}</code>
            ${seller.upiId ? `<button type="button" class="cart-copy-upi" data-copy-upi="${escapeHtml(seller.upiId)}">Copy UPI ID</button>` : ''}
          </div>
          ${seller.upiId ? `<img src="${qrUrl}" alt="UPI payment QR for @${escapeHtml(seller.handle)} for ${currency(seller.subtotal)}" loading="lazy">` : '<p class="cart-seller-contact-note">A UPI QR is not available for this seller.</p>'}
        </div>
        ${screenshotAction}`;
      return card;
    }));
  }

  async function placeOrder() {
    if (!isAuthenticated()) {
      window.atelierAuth.prepareLoginRedirect();
      cartMessage.textContent = 'Log in to place your order.';
      document.getElementById('cart-login-gate').hidden = false;
      return;
    }
    const cart = readArray(cartKey);
    if (!cart.length) return;

    purchaseButton.disabled = true;
    cartMessage.textContent = 'Confirming your order…';
    let updatedListingIds = [];
    try {
      const client = window.atelierSupabase.getClient();
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;
      const user = sessionData.session && sessionData.session.user;
      if (!user) {
        window.atelierAuth.prepareLoginRedirect();
        document.getElementById('cart-login-gate').hidden = false;
        throw new Error('Your sign-in has expired. Log in again to confirm this order.');
      }

      const knownListings = new Map(inventory().map((item) => [item.id, item]));
      const requestedListingIds = [...new Set(cart
        .filter((item) => item.supabaseListing || knownListings.get(item.id)?.supabaseListing)
        .map((item) => String(item.id)))];
      let liveRows = [];
      if (requestedListingIds.length) {
        const { data, error } = await client
          .from('marketplace_listings')
          .select('*')
          .in('id', requestedListingIds);
        if (error) throw error;
        liveRows = data || [];
        const liveById = new Map(liveRows.map((row) => [String(row.id), row]));
        const unavailable = requestedListingIds.find((id) => {
          const row = liveById.get(id);
          return !row || String(row.status || '').toLowerCase() !== 'available';
        });
        if (unavailable) {
          throw new Error('A listing in your bag is no longer available. Remove it and refresh the marketplace.');
        }
      }

      const liveById = new Map(liveRows.map((row) => [String(row.id), window.normalizeAtelierMarketplaceListing(row)]));
      const orderItems = cart.map((item) => {
        const live = liveById.get(String(item.id));
        const savedProduct = productFor(item.id) || {};
        return {
          ...savedProduct,
          ...item,
          ...(live || {}),
          id: String(item.id),
          quantity: quantityFor(item),
          upiId: (live && live.upiId) || item.upiId || savedProduct.upiId || '',
          contact: item.contact || savedProduct.contact || '',
          supabaseListing: Boolean(live || item.supabaseListing),
          seller_id: (live && live.seller_id) || item.seller_id || savedProduct.seller_id || ''
        };
      });

      const date = localDate();
      const orderId = createOrderId(date);
      const deliveryMethod = document.querySelector('input[name="delivery"]:checked').value;
      const deliveryNote = document.getElementById('delivery-note').value.trim();
      const orderSubtotal = orderItems.reduce((sum, item) => sum + (Number(item.price) || 0) * quantityFor(item), 0);
      const orderTotal = orderSubtotal + shippingCost();
      const listingIds = requestedListingIds;

      if (listingIds.length) {
        const { data, error } = await client
          .from('marketplace_listings')
          .update({ status: 'sold' })
          .in('id', listingIds)
          .eq('status', 'available')
          .select('id');
        updatedListingIds = (data || []).map((row) => String(row.id));
        if (error) throw error;
        if (updatedListingIds.length !== listingIds.length) {
          throw new Error('One or more listings changed while you were checking out. Please refresh and try again.');
        }
      }

      const orderRows = orderItems.map((item) => ({
        buyer_id: user.id,
        listing_id: item.supabaseListing ? item.id : null,
        seller_id: item.seller_id || null,
        quantity: quantityFor(item),
        total_price: (Number(item.price) || 0) * quantityFor(item),
        status: 'pending'
      }));
      const { error: orderError } = await client.from('orders').insert(orderRows);
      if (orderError) throw orderError;

      const previousBought = readArray(boughtKey);
      const boughtItems = orderItems.map((item) => ({
        ...item,
        purchasedAt: date,
        purchaseDate: date,
        orderId,
        deliveryMethod,
        deliveryNote,
        paymentMethod: 'UPI request'
      }));
      save(boughtKey, [...previousBought, ...boughtItems]);
      const cartCleared = save(cartKey, []);

      orderPlaced = true;
      const delivery = deliveryMethod === 'pickup' ? 'Hyderabad pickup' : 'standard courier';
      document.getElementById('confirmation-detail').textContent = `Your ${delivery} order is recorded. Complete payment using the seller UPI details below.`;
      document.getElementById('confirmation-order').textContent = `Order ${orderId} · ${date}`;
      renderSellerPayments(orderItems, orderId, orderTotal);
      document.getElementById('order-confirmation').hidden = false;
      cartLayout.classList.add('is-complete');
      document.getElementById('bag-tab').click();
      cartMessage.textContent = cartCleared ? '' : 'Your order was recorded, but the browser could not clear the saved bag.';
      render();
    } catch (error) {
      console.error('Unable to confirm the order with Supabase.', error);
      if (updatedListingIds.length) {
        try {
          const { error: restoreError } = await window.atelierSupabase.getClient()
            .from('marketplace_listings')
            .update({ status: 'available' })
            .in('id', updatedListingIds)
            .eq('status', 'sold');
          if (restoreError) console.error('Unable to restore listings after checkout failed.', restoreError);
        } catch (restoreError) {
          console.error('Unable to restore listings after checkout failed.', restoreError);
        }
      }
      cartMessage.textContent = error.message || 'The order could not be saved. Please try again.';
    } finally {
      purchaseButton.disabled = orderPlaced || readArray(cartKey).length === 0 || !isAuthenticated();
    }
  }

  document.getElementById('bag-tab').addEventListener('click', () => {
    document.getElementById('bag-panel').hidden = false;
    document.getElementById('wishlist-panel').hidden = true;
    document.getElementById('bag-tab').classList.add('is-active');
    document.getElementById('wishlist-tab').classList.remove('is-active');
    document.getElementById('bag-tab').setAttribute('aria-selected', 'true');
    document.getElementById('wishlist-tab').setAttribute('aria-selected', 'false');
  });

  document.getElementById('wishlist-tab').addEventListener('click', () => {
    document.getElementById('bag-panel').hidden = true;
    document.getElementById('wishlist-panel').hidden = false;
    document.getElementById('wishlist-tab').classList.add('is-active');
    document.getElementById('bag-tab').classList.remove('is-active');
    document.getElementById('wishlist-tab').setAttribute('aria-selected', 'true');
    document.getElementById('bag-tab').setAttribute('aria-selected', 'false');
  });

  cartItems.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest('button') : null;
    if (!button) return;
    if (button.dataset.quantityMinus) changeQuantity(button.dataset.quantityMinus, -1);
    if (button.dataset.quantityPlus) {
      if (!isAuthenticated()) {
        window.atelierAuth.prepareLoginRedirect();
        cartMessage.textContent = 'Log in to add more items to your bag.';
        return;
      }
      changeQuantity(button.dataset.quantityPlus, 1);
    }
    if (button.dataset.remove) {
      const next = readArray(cartKey).filter((item) => item.id !== button.dataset.remove);
      if (save(cartKey, next)) renderCart();
    }
  });

  wishlistItems.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest('button') : null;
    if (!button) return;
    if (button.dataset.moveToBag) moveToBag(button.dataset.moveToBag);
    if (button.dataset.removeWishlist !== undefined) {
      const id = button.dataset.removeWishlist;
      const next = readArray(wishlistKey).filter((entry) => itemId(entry) !== id);
      if (save(wishlistKey, next)) renderWishlist();
    }
  });

  orderSellerPayments.addEventListener('click', async (event) => {
    const button = event.target instanceof Element ? event.target.closest('[data-copy-upi]') : null;
    if (!button) return;
    const upiId = button.dataset.copyUpi;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(upiId);
      } else {
        const temporaryInput = document.createElement('textarea');
        temporaryInput.value = upiId;
        temporaryInput.setAttribute('readonly', '');
        temporaryInput.style.position = 'fixed';
        temporaryInput.style.opacity = '0';
        document.body.append(temporaryInput);
        temporaryInput.select();
        const copied = document.execCommand('copy');
        temporaryInput.remove();
        if (!copied) throw new Error('The browser did not allow copying to the clipboard.');
      }
      button.textContent = 'Copied!';
    } catch (error) {
      console.error('Unable to copy the seller UPI ID.', error);
      cartMessage.textContent = 'Could not copy the UPI ID. Please select and copy it manually.';
    }
  });

  document.querySelectorAll('input[name="delivery"]').forEach((input) => {
    input.addEventListener('change', () => {
      const items = readArray(cartKey);
      const subtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * quantityFor(item), 0);
      updateTotal(subtotal);
    });
  });
  document.getElementById('complete-purchase').addEventListener('click', placeOrder);
  cartLoginLink.addEventListener('click', (event) => {
    if (!window.atelierAuth.prepareLoginRedirect()) {
      event.preventDefault();
      cartMessage.textContent = 'We could not save your place. Please allow session storage before logging in.';
    }
  });
  window.addEventListener('storage', render);
  window.addEventListener('atelier:profile-updated', render);
  render();
  loadMarketplaceListings();
})();

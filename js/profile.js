let toastTimeout;

function showProfileToast(message, kind) {
  const toast = document.getElementById('profile-toast');
  if (!toast) {
    return;
  }

  window.clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.dataset.kind = kind || 'info';
  toast.classList.add('is-visible');
  if (kind !== 'loading') {
    toastTimeout = window.setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2600);
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('The selected image could not be read.'));
      }
    }, { once: true });
    reader.addEventListener('error', () => {
      reject(reader.error || new Error('The selected image could not be read.'));
    }, { once: true });
    reader.addEventListener('abort', () => {
      reject(new Error('Reading the selected image was canceled.'));
    }, { once: true });
    reader.readAsDataURL(file);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const defaultProfile = {
    name: '',
    id: '',
    username: '',
    bio: '',
    role: 'Member',
    roleDetails: {},
    avatarUrl: '',
    coverUrl: '',
    profileCompleted: null,
    followingCount: 0,
    followersCount: 0
  };
  const supportedRoles = ['Member', 'Student', 'Tailor', 'Tailor / Designer', 'Seller'];
  const elements = {
    name: document.getElementById('profile-display-name'),
    username: document.getElementById('profile-username'),
    bio: document.getElementById('profile-bio'),
    followingCount: document.getElementById('profile-following-count'),
    followerCount: document.getElementById('profile-follower-count'),
    connectionButtons: document.querySelectorAll('[data-open-connections]'),
    connectionsDialog: document.getElementById('profile-connections-dialog'),
    connectionsTabs: document.querySelectorAll('[data-connections-tab]'),
    connectionsStatus: document.getElementById('profile-connections-status'),
    connectionsList: document.getElementById('profile-connections-list'),
    welcomeBanner: document.getElementById('profile-welcome'),
    role: document.getElementById('profile-role'),
    roleIcon: document.getElementById('profile-role-icon'),
    roleDetails: document.getElementById('profile-role-details'),
    tailorStudio: document.getElementById('profile-tailor-studio'),
    tailorLocation: document.getElementById('profile-tailor-location'),
    tailorSpecialty: document.getElementById('profile-tailor-specialty'),
    tailorPriceRange: document.getElementById('profile-tailor-price-range'),
    tailorContact: document.getElementById('profile-tailor-contact'),
    tailorEditButton: document.getElementById('profile-tailor-edit'),
    tailorStudioDialog: document.getElementById('profile-tailor-studio-dialog'),
    tailorStudioForm: document.getElementById('profile-tailor-studio-form'),
    tailorStudioNameInput: document.getElementById('profile-tailor-studio-name'),
    tailorStudioLocationInput: document.getElementById('profile-tailor-studio-location'),
    tailorStudioSpecialtySelect: document.getElementById('profile-tailor-studio-specialty'),
    tailorStudioCustomSpecialtyInput: document.getElementById('profile-tailor-studio-custom-specialty'),
    tailorStudioPriceInput: document.getElementById('profile-tailor-studio-price'),
    tailorStudioContactInput: document.getElementById('profile-tailor-studio-contact'),
    tailorStudioBioInput: document.getElementById('profile-tailor-studio-bio'),
    tailorStudioMessage: document.getElementById('profile-tailor-studio-message'),
    avatar: document.getElementById('profile-avatar-image'),
    avatarFallback: document.getElementById('profile-avatar-fallback'),
    cover: document.getElementById('profile-cover-image'),
    coverFallback: document.getElementById('profile-cover-fallback'),
    editDialog: document.getElementById('profile-edit-dialog'),
    editForm: document.getElementById('profile-edit-form'),
    deleteAccountButton: document.getElementById('profile-delete-account-button'),
    deleteDialog: document.getElementById('profile-delete-dialog'),
    deleteForm: document.getElementById('profile-delete-form'),
    deleteConfirmationInput: document.getElementById('profile-delete-confirmation'),
    deleteMessage: document.getElementById('profile-delete-message'),
    deleteCancelButton: document.getElementById('profile-delete-cancel'),
    deleteSubmitButton: document.getElementById('profile-delete-submit'),
    threadDialog: document.getElementById('post-dialog'),
    threadTitle: document.getElementById('thread-title'),
    threadUsername: document.getElementById('thread-username'),
    threadDate: document.getElementById('thread-date'),
    threadBody: document.getElementById('thread-body'),
    threadComments: document.getElementById('thread-comments'),
    threadCommentCount: document.getElementById('thread-comment-count'),
    threadUpvote: document.getElementById('thread-upvote'),
    threadLikeCount: document.getElementById('thread-like-count'),
    postList: document.getElementById('profile-post-list'),
    listingGrid: document.getElementById('profile-listing-grid'),
    lookbookGrid: document.getElementById('profile-lookbook-grid'),
    lookbookManageLink: document.getElementById('profile-lookbook-manage'),
    profileTabs: document.querySelectorAll('[data-profile-tab]'),
    profilePanels: document.querySelectorAll('[data-profile-panel]'),
    followButton: document.getElementById('profile-follow-button'),
    editButton: document.getElementById('open-profile-editor'),
    logoutButton: document.getElementById('profile-logout-button'),
    bannerEditButton: document.getElementById('edit-banner-button'),
    avatarEditButton: document.getElementById('edit-avatar-button'),
    avatarInput: document.getElementById('edit-avatar-file'),
    bannerInput: document.getElementById('edit-banner-file'),
    avatarPreview: document.getElementById('edit-avatar-preview'),
    bannerPreview: document.getElementById('edit-banner-preview'),
    commentForm: document.getElementById('add-comment-form'),
    commentInput: document.getElementById('new-comment')
  };

  function normalizeRole(value) {
    if (typeof value !== 'string') {
      return 'Member';
    }
    const role = value.trim().toLowerCase();
    if (role === 'member' || role === 'student' || role === 'member / student') return 'Member';
    if (role === 'tailor') return 'Tailor / Designer';
    if (role === 'seller') return 'Seller';
    if (role === 'verified tailor') return 'Verified Tailor';
    return supportedRoles.find((item) => item.toLowerCase() === role) || 'Member';
  }

  function loadProfile() {
    try {
      const storedProfile = window.atelierSupabase.readCachedProfile();
      if (!storedProfile) return { ...defaultProfile };

      return {
        ...defaultProfile,
        ...storedProfile,
        id: String(storedProfile.id || ''),
        name: storedProfile.display_name || defaultProfile.name,
        username: storedProfile.username ? `@${normalizeHandle(storedProfile.username)}` : '',
        bio: typeof storedProfile.bio === 'string' ? storedProfile.bio : defaultProfile.bio,
        role: normalizeRole(storedProfile.role),
        roleDetails: storedProfile.role_details || storedProfile.roleDetails || {},
        avatarUrl: storedProfile.avatar_url || storedProfile.avatarUrl || '',
        coverUrl: storedProfile.banner_url || storedProfile.bannerUrl || storedProfile.coverUrl || '',
        profileCompleted: typeof storedProfile.profile_completed === 'boolean'
          ? storedProfile.profile_completed
          : null,
        followingCount: readCount(storedProfile.followingCount, storedProfile.following, 0),
        followersCount: readCount(storedProfile.followersCount, storedProfile.followerCount, 0)
      };
    } catch (error) {
      console.error('Unable to load the Atelier profile from localStorage.', error);
      showProfileToast('Could not load saved profile details.', 'error');
      return { ...defaultProfile };
    }
  }

  function readCount(primary, secondary, fallback) {
    const value = Number(primary == null ? secondary : primary);
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  }

  function normalizeHandle(value) {
    const text = String(value || '').trim().toLowerCase().replace(/^@/, '');
    return (text.includes('@') ? text.split('@')[0] : text).replace(/[^a-z0-9._-]+/g, '');
  }

  function hasAuthenticatedUser() {
    try {
      const saved = window.atelierSupabase.readCachedProfile();
      return Boolean(saved && saved.id);
    } catch (error) {
      console.error('Unable to verify the Atelier user session.', error);
      return false;
    }
  }

  function readStoredArray(key) {
    try {
      const value = JSON.parse(window.localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.error(`Unable to read ${key} from browser storage.`, error);
      return [];
    }
  }

  function getLocalTailor(handle) {
    const shops = [
      ...readStoredArray('atelier_verified_tailors'),
      ...readStoredArray('atelier_submitted_tailors')
    ];
    return shops.find((shop) => {
      if (!shop || typeof shop !== 'object' || Array.isArray(shop)) {
        return false;
      }
      const candidates = [shop.username, shop.handle, shop.slug, shop.name, shop.id];
      return candidates.some((candidate) => normalizeHandle(candidate) === handle);
    });
  }

  let viewerProfile = loadProfile();
  let viewerIsAuthenticated = hasAuthenticatedUser();
  const requestedUser = new URLSearchParams(window.location.search).get('user');
  const requestedHandle = normalizeHandle(requestedUser);
  const requestedProfileId = new URLSearchParams(window.location.search).get('id') || '';
  let isPublicProfile = Boolean(requestedHandle || requestedProfileId);
  let tailorRecord = null;
  let accountDeletionCompleted = false;
  let accountDeletionInProgress = false;

  function getPublicProfile(handle) {
    if (
      viewerIsAuthenticated
      && normalizeHandle(viewerProfile.username) === handle
    ) {
      return { ...viewerProfile };
    }

    const shop = getLocalTailor(handle);
    if (shop) {
      return {
        ...defaultProfile,
        name: shop.name || handle,
        username: `@${handle}`,
        bio: String(shop.bio || ''),
        role: normalizeRole(shop.role),
        avatarUrl: shop.image || shop.avatar_url || '',
        coverUrl: shop.coverUrl || shop.banner_url || '',
        followingCount: readCount(shop.followingCount, shop.following, 0),
        followersCount: readCount(shop.followersCount, shop.followers, 0)
      };
    }

    return {
      ...defaultProfile,
      name: handle || defaultProfile.name,
      username: `@${handle}`,
      bio: '',
      role: 'Member',
      followingCount: 0,
      followersCount: 0
    };
  }

  let profile = isPublicProfile ? getPublicProfile(requestedHandle) : viewerProfile;
  let publicHandle = isPublicProfile ? normalizeHandle(profile.username) : requestedHandle;
  let supabaseClient = null;
  let currentUserId = '';
  let currentProfileFollowing = false;
  let connectionDataLoaded = false;
  let connectionDataError = false;
  let followActionPending = false;
  let connectionsMode = 'followers';
  let connectionsRequestId = 0;
  let connectionFollowIds = new Set();
  let connectionsPeople = [];

  function updateRoleIcon(role) {
    const icons = {
      Member: '<path d="M3 5h4l3 16h15l4-12H9"></path><circle cx="13" cy="26" r="2"></circle><circle cx="24" cy="26" r="2"></circle>',
      Student: '<path d="m3 11 13-7 13 7-13 7-13-7Z"></path><path d="M8 14v7c4 3 12 3 16 0v-7M29 11v9"></path>',
      'Tailor / Designer': '<path d="m5 5 18 18M19 5a4 4 0 1 0 8 0 4 4 0 0 0-8 0ZM3 27a4 4 0 1 0 8 0 4 4 0 0 0-8 0ZM5 24 24 8"></path>',
      Seller: '<path d="M4 10h24l-2 17H6L4 10Z"></path><path d="M10 10a6 6 0 0 1 12 0"></path>'
    };
    elements.roleIcon.innerHTML = icons[role] || icons.Member;
  }

  function isTailorRole(role) {
    const normalized = String(role || '').trim().toLowerCase();
    return normalized === 'tailor'
      || normalized === 'tailor / designer'
      || normalized === 'verified tailor';
  }

  function isExplicitTailorRole(role) {
    const normalized = String(role || '').trim().toLowerCase();
    return normalized === 'tailor' || normalized === 'tailor / designer';
  }

  function isMissingProfileColumn(error, columns) {
    if (!error || !['42703', 'PGRST204'].includes(error.code)) return false;
    const message = `${error.message || ''} ${error.details || ''}`.toLowerCase();
    return columns.some((column) => message.includes(column));
  }

  function firstTailorValue(source, keys) {
    for (const key of keys) {
      const value = source && source[key];
      if (Array.isArray(value) && value.length) return value.join(', ');
      if (value != null && String(value).trim()) return String(value).trim();
    }
    return '';
  }

  function renderTailorStudio() {
    const isTailor = isExplicitTailorRole(profile.role);
    const canEdit = isTailor
      && !isPublicProfile
      && viewerIsAuthenticated
      && profile.id
      && String(profile.id) === String(viewerProfile.id);
    elements.tailorStudio.hidden = !isTailor;
    elements.tailorEditButton.hidden = !canEdit;
    if (!isTailor) return;

    const details = profile.roleDetails && typeof profile.roleDetails === 'object'
      ? profile.roleDetails
      : {};
    const location = firstTailorValue(tailorRecord, ['neighborhood', 'area'])
      || firstTailorValue(tailorRecord, ['address', 'street', 'studio_address', 'location'])
      || String(details.neighborhood || '');
    const minPrice = firstTailorValue(tailorRecord, ['min_price', 'price_min']);
    const maxPrice = firstTailorValue(tailorRecord, ['max_price', 'price_max']);
    const listedPrice = firstTailorValue(tailorRecord, ['price']);
    let priceRange = firstTailorValue(tailorRecord, ['price_range', 'priceRange', 'pricing']);
    if (!priceRange && (minPrice || maxPrice)) {
      priceRange = [minPrice && `₹${minPrice}`, maxPrice && `₹${maxPrice}`].filter(Boolean).join(' – ');
    } else if (!priceRange && listedPrice) {
      priceRange = Number.isFinite(Number(listedPrice)) ? `Starting at ₹${listedPrice}` : listedPrice;
    }
    priceRange = priceRange || String(details.price_range || '');
    elements.tailorLocation.textContent = location || 'Not listed yet';
    elements.tailorSpecialty.textContent = firstTailorValue(
      tailorRecord,
      ['specialty', 'specialties', 'specialization', 'services']
    ) || String(details.specialty || 'Not listed yet');
    elements.tailorPriceRange.textContent = priceRange || 'Ask for a quote';
    elements.tailorContact.textContent = firstTailorValue(
      tailorRecord,
      ['contact', 'contact_info', 'phone', 'contact_phone', 'whatsapp', 'email']
    ) || String(details.whatsapp || details.contact || 'Not listed yet');
  }

  function renderProfile() {
    elements.name.textContent = profile.name;
    elements.username.textContent = profile.username;
    elements.bio.textContent = profile.bio || 'No bio yet.';
    renderTailorStudio();
    const isOwnProfile = !isPublicProfile
      && viewerIsAuthenticated
      && currentUserId
      && String(profile.id) === currentUserId;
    elements.deleteAccountButton.hidden = !isOwnProfile;
    elements.welcomeBanner.hidden = !(
      isOwnProfile
      && (profile.profileCompleted === false || !String(profile.bio || '').trim())
    );
    const details = profile.roleDetails && typeof profile.roleDetails === 'object'
      ? Object.entries(profile.roleDetails)
        .filter(([, value]) => typeof value === 'string' && value.trim())
        .map(([key, value]) => `${key.replace(/[_-]+/g, ' ')}: ${value.trim()}`)
      : [];
    elements.roleDetails.textContent = details.join(' · ');
    elements.roleDetails.hidden = details.length === 0;
    elements.followingCount.textContent = profile.id ? '…' : '0';
    elements.followerCount.textContent = profile.id ? '…' : '0';
    const displayRole = isExplicitTailorRole(profile.role) ? 'Tailor / Designer' : 'Member';
    elements.role.textContent = displayRole;
    updateRoleIcon(displayRole);
    document.body.classList.toggle('profile-page--public', isPublicProfile);
    document.title = isPublicProfile ? `${profile.name} | Atelier` : 'Profile | Atelier';
    elements.editButton.hidden = isPublicProfile;
    elements.logoutButton.hidden = isPublicProfile;
    elements.bannerEditButton.hidden = isPublicProfile;
    elements.avatarEditButton.hidden = isPublicProfile;
    elements.followButton.hidden = !isPublicProfile;
    elements.lookbookManageLink.hidden = isPublicProfile;
    if (isPublicProfile) {
      elements.followButton.disabled = false;
      elements.followButton.textContent = 'Follow';
      elements.followButton.setAttribute('aria-pressed', 'false');
    }
    if (profile.avatarUrl) {
      elements.avatar.src = profile.avatarUrl;
      elements.avatar.alt = `Profile picture of ${profile.name}`;
      elements.avatar.hidden = false;
      elements.avatarFallback.hidden = true;
    } else {
      elements.avatar.hidden = true;
      elements.avatarFallback.hidden = false;
    }
    if (profile.coverUrl) {
      elements.cover.src = profile.coverUrl;
      elements.cover.hidden = false;
      elements.coverFallback.hidden = true;
    } else {
      elements.cover.hidden = true;
      elements.coverFallback.hidden = false;
    }
  }

  function setProfileTab(tabName) {
    elements.profileTabs.forEach((tab) => {
      const selected = tab.dataset.profileTab === tabName;
      tab.classList.toggle('is-active', selected);
      tab.setAttribute('aria-selected', String(selected));
    });
    elements.profilePanels.forEach((panel) => {
      panel.hidden = panel.dataset.profilePanel !== tabName;
    });
  }

  function cacheProfileForLegacyPages(row) {
    const cached = window.atelierSupabase.cacheProfile(row);
    const roleDetails = cached.role_details && typeof cached.role_details === 'object'
      ? cached.role_details
      : {};
    profile = {
      ...profile,
      id: cached.id,
      name: cached.display_name,
      username: `@${cached.username}`,
      bio: cached.bio || '',
      role: normalizeRole(cached.role),
      roleDetails: {
        ...roleDetails,
        neighborhood: cached.location || roleDetails.neighborhood || '',
        specialty: cached.specialty || roleDetails.specialty || ''
      },
      avatarUrl: cached.avatar_url,
      coverUrl: cached.banner_url,
      profileCompleted: typeof cached.profile_completed === 'boolean' ? cached.profile_completed : null
    };
    viewerProfile = { ...profile };
    return cached;
  }

  function profileFromDatabaseRow(row) {
    const roleDetails = row.role_details && typeof row.role_details === 'object' ? row.role_details : {};
    return {
      id: row.id || '',
      name: String(row.display_name || row.username || 'Atelier Member'),
      username: `@${normalizeHandle(row.username)}`,
      bio: String(row.bio || ''),
      role: normalizeRole(row.role),
      roleDetails: {
        ...roleDetails,
        neighborhood: row.location || roleDetails.neighborhood || '',
        specialty: row.specialty || roleDetails.specialty || ''
      },
      avatarUrl: String(row.avatar_url || ''),
      coverUrl: String(row.banner_url || ''),
      profileCompleted: typeof row.profile_completed === 'boolean' ? row.profile_completed : null,
      followingCount: readCount(row.following_count, row.following, 0),
      followersCount: readCount(row.followers_count, row.follower_count, 0)
    };
  }

  async function loadTailorRecord(client) {
    tailorRecord = null;
    const userId = profile.id || requestedProfileId;
    if (!userId) return;
    try {
      const { data, error } = await client
        .from('tailors')
        .select('*')
        .eq('user_id', userId)
        .limit(1);
      if (error) throw error;
      tailorRecord = data && data.length ? data[0] : null;
    } catch (error) {
      console.error('Unable to load Atelier studio details for this profile.', error);
      showProfileToast(`Studio location details could not be loaded: ${error.message}`, 'error');
    }
  }

  async function loadProfileFromSupabase() {
    let client = null;
    try {
      client = window.atelierSupabase.getClient();
      supabaseClient = client;
      const session = await window.atelierSupabase.getSession();
      viewerIsAuthenticated = Boolean(session && session.user);
      currentUserId = viewerIsAuthenticated ? String(session.user.id || '') : '';
      const oauthCallback = window.location.hash.includes('access_token=')
        || new URLSearchParams(window.location.search).has('code');

      if (viewerIsAuthenticated) {
        let row = await window.atelierSupabase.fetchProfile(session.user, { createIfMissing: true });
        const pendingRole = window.localStorage.getItem('atelierPendingRole');
        if (oauthCallback && ['member', 'tailor', 'seller'].includes(pendingRole)) {
          const { data, error } = await client
            .from('profiles')
            .update({ role: pendingRole })
            .eq('id', session.user.id)
            .select('*')
            .single();
          if (error) throw error;
          row = data;
        }
        const cached = cacheProfileForLegacyPages(row);
        const isViewingSelf = requestedHandle
          ? requestedHandle === normalizeHandle(cached.username)
          : !requestedProfileId || requestedProfileId === String(cached.id);
        if (!requestedHandle || isViewingSelf) {
          if (isViewingSelf) {
            isPublicProfile = false;
            profile = { ...viewerProfile };
            publicHandle = normalizeHandle(profile.username);
          } else {
            isPublicProfile = true;
          }
        } else {
          isPublicProfile = true;
        }
      } else if (!requestedHandle && !requestedProfileId) {
        window.location.assign('login.html');
        return;
      }

      if ((requestedHandle || requestedProfileId) && isPublicProfile) {
        const query = client.from('profiles').select('*');
        const { data, error } = requestedProfileId
          ? await query.eq('id', requestedProfileId).limit(1)
          : await query.ilike('username', requestedHandle).limit(1);
        if (error) throw error;
        if (data && data.length) {
          profile = profileFromDatabaseRow(data[0]);
        } else if (requestedHandle) {
          profile = getPublicProfile(requestedHandle);
        } else {
          profile = {
            ...defaultProfile,
            id: requestedProfileId,
            name: 'Atelier Member',
            username: `@${requestedProfileId}`,
            bio: 'Atelier community member',
            role: 'Member',
            followingCount: 0,
            followersCount: 0
          };
        }
        publicHandle = normalizeHandle(profile.username);
      }

      await loadTailorRecord(client);
      renderProfile();
      await refreshProfileConnections();
      renderFollowButton();
      setProfileTab('posts');
      renderPublicPosts();
      syncConnectionsFromUrl();
      await Promise.all([loadRemotePublicPosts(), loadProfileListings(), loadProfileLookbook()]);

      if (oauthCallback && viewerIsAuthenticated) {
        window.localStorage.removeItem('atelierPendingRole');
        window.atelierAuth.consumeRedirectAfterLogin('profile.html');
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch (error) {
      console.error('Unable to load the Atelier profile from Supabase.', error);
      if (!requestedHandle && !requestedProfileId && !viewerIsAuthenticated) {
        window.location.assign('login.html');
        return;
      }
      showProfileToast(`Could not load the profile from Supabase: ${error.message}`, 'error');
      if (requestedHandle || requestedProfileId) {
        profile = requestedHandle
          ? getPublicProfile(requestedHandle)
          : {
            ...defaultProfile,
            id: requestedProfileId,
            name: 'Atelier Member',
            username: `@${requestedProfileId}`,
            bio: 'Atelier community member',
            role: 'Member',
            followingCount: 0,
            followersCount: 0
          };
        isPublicProfile = true;
        publicHandle = normalizeHandle(profile.username);
        if (client) await loadTailorRecord(client);
        renderProfile();
        await refreshProfileConnections();
        renderFollowButton();
        renderPublicPosts();
        syncConnectionsFromUrl();
        await Promise.all([loadProfileListings(), loadProfileLookbook()]);
      }
    }
  }

  function renderFollowButton() {
    if (!isPublicProfile) {
      return;
    }
    if (!viewerIsAuthenticated) {
      elements.followButton.textContent = 'Log in to follow';
      elements.followButton.setAttribute('aria-pressed', 'false');
      elements.followButton.disabled = false;
      return;
    }
    if ((currentUserId && String(profile.id) === currentUserId)
      || normalizeHandle(viewerProfile.username) === publicHandle) {
      elements.followButton.textContent = 'Your profile';
      elements.followButton.disabled = true;
      elements.followButton.setAttribute('aria-pressed', 'false');
      return;
    }
    if (!profile.id) {
      elements.followButton.textContent = 'Profile unavailable';
      elements.followButton.disabled = true;
      elements.followButton.setAttribute('aria-pressed', 'false');
      return;
    }
    if (!connectionDataLoaded) {
      elements.followButton.textContent = 'Loading…';
      elements.followButton.disabled = true;
      return;
    }
    if (connectionDataError) {
      elements.followButton.textContent = 'Follow unavailable';
      elements.followButton.disabled = true;
      return;
    }
    elements.followButton.disabled = followActionPending;
    elements.followButton.textContent = currentProfileFollowing ? 'Following ✓' : 'Follow';
    elements.followButton.classList.toggle('is-following', currentProfileFollowing);
    elements.followButton.setAttribute('aria-pressed', String(currentProfileFollowing));
  }

  function updateConnectionUrl(tabName) {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('user') && !params.has('id') && profile.username) {
      params.set('user', normalizeHandle(profile.username));
    }
    params.set('tab', tabName);
    window.history.replaceState(window.history.state, '', `${window.location.pathname}?${params.toString()}`);
  }

  function clearConnectionUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') !== 'followers' && params.get('tab') !== 'following') return;
    params.delete('tab');
    if (!requestedHandle && !requestedProfileId) params.delete('user');
    const query = params.toString();
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }

  function updateConnectionsTabs() {
    elements.connectionsTabs.forEach((tab) => {
      const selected = tab.dataset.connectionsTab === connectionsMode;
      tab.setAttribute('aria-selected', String(selected));
    });
  }

  function connectionProfileHref(person) {
    const username = normalizeHandle(person.username);
    return username
      ? `profile.html?user=${encodeURIComponent(username)}`
      : `profile.html?id=${encodeURIComponent(String(person.id || ''))}`;
  }

  function renderConnectionsList() {
    elements.connectionsList.replaceChildren();
    if (!connectionsPeople.length) return;

    connectionsPeople.forEach((person) => {
      const row = document.createElement('article');
      row.className = 'profile-connection-row';
      const link = document.createElement('a');
      link.className = 'profile-connection-row__person';
      link.href = connectionProfileHref(person);
      link.setAttribute('aria-label', `View ${person.name}'s profile`);
      if (person.avatarUrl) {
        const avatar = document.createElement('img');
        avatar.className = 'profile-connection-row__avatar';
        avatar.src = person.avatarUrl;
        avatar.alt = '';
        avatar.loading = 'lazy';
        link.append(avatar);
      } else {
        const fallback = document.createElement('span');
        fallback.className = 'profile-connection-row__avatar profile-connection-row__fallback';
        fallback.textContent = person.name.charAt(0).toUpperCase() || '?';
        fallback.setAttribute('aria-hidden', 'true');
        link.append(fallback);
      }

      const details = document.createElement('span');
      details.className = 'profile-connection-row__details';
      const name = document.createElement('strong');
      name.textContent = person.name;
      const handle = document.createElement('span');
      handle.textContent = person.username ? `@${normalizeHandle(person.username)}` : 'Atelier member';
      const role = document.createElement('span');
      const isTailor = isTailorRole(person.role);
      role.className = `profile-connection-row__role${isTailor ? ' profile-connection-row__role--tailor' : ''}`;
      role.textContent = isTailor ? 'Tailor' : 'Member';
      const viewProfile = document.createElement('span');
      viewProfile.className = 'profile-connection-row__view';
      viewProfile.textContent = 'View Profile →';
      details.append(name, handle, role, viewProfile);
      link.append(details);
      row.append(link);

      if (viewerIsAuthenticated && currentUserId && String(person.id) !== currentUserId) {
        const isFollowing = connectionFollowIds.has(String(person.id));
        const button = document.createElement('button');
        button.className = `profile-connection-row__follow${isFollowing ? ' is-following' : ''}`;
        button.type = 'button';
        button.dataset.personFollow = String(person.id);
        button.disabled = followActionPending;
        button.setAttribute('aria-pressed', String(isFollowing));
        button.textContent = isFollowing ? 'Following ✓' : 'Follow';
        row.append(button);
      }
      elements.connectionsList.append(row);
    });
  }

  async function loadConnectionsList() {
    const requestId = ++connectionsRequestId;
    elements.connectionsStatus.textContent = 'Loading connections…';
    elements.connectionsList.replaceChildren();
    if (!supabaseClient || !profile.id) {
      elements.connectionsStatus.textContent = 'Connections are unavailable for this profile.';
      return;
    }

    try {
      const isFollowers = connectionsMode === 'followers';
      const relationshipColumn = isFollowers ? 'following_id' : 'follower_id';
      const personColumn = isFollowers ? 'follower_id' : 'following_id';
      const { data: relationships, error: relationshipError } = await supabaseClient
        .from('follows')
        .select('follower_id, following_id')
        .eq(relationshipColumn, profile.id);
      if (relationshipError) throw relationshipError;
      const personIds = [...new Set((relationships || []).map((row) => String(row[personColumn])).filter(Boolean))];
      if (!personIds.length) {
        if (requestId === connectionsRequestId) {
          connectionsPeople = [];
          elements.connectionsStatus.textContent = `No ${connectionsMode} yet.`;
        }
        return;
      }

      let { data: profiles, error: profilesError } = await supabaseClient
        .from('profiles')
        .select('id, username, display_name, avatar_url, role')
        .in('id', personIds);
      if (profilesError) {
        console.info('The profiles table has no display_name column; trying full_name.');
        const fullNameResult = await supabaseClient
          .from('profiles')
          .select('id, username, full_name, avatar_url, role')
          .in('id', personIds);
        profiles = fullNameResult.data;
        profilesError = fullNameResult.error;
      }
      if (profilesError) throw profilesError;
      if (requestId !== connectionsRequestId) return;

      const profileById = new Map((profiles || []).map((row) => [String(row.id), row]));
      connectionsPeople = personIds.map((id) => {
        const row = profileById.get(id);
        if (!row) return null;
        return {
          id,
          username: String(row.username || ''),
          name: String(row.full_name || row.display_name || row.username || 'Atelier member'),
          avatarUrl: String(row.avatar_url || ''),
          role: String(row.role || '')
        };
      }).filter(Boolean);

      if (currentUserId && connectionsPeople.length) {
        const { data: followedRows, error: followedError } = await supabaseClient
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentUserId)
          .in('following_id', connectionsPeople.map((person) => person.id));
        if (followedError) throw followedError;
        connectionFollowIds = new Set((followedRows || []).map((row) => String(row.following_id)));
      }
      if (requestId !== connectionsRequestId) return;
      elements.connectionsStatus.textContent = connectionsPeople.length
        ? ''
        : `No visible ${connectionsMode} yet.`;
      renderConnectionsList();
    } catch (error) {
      if (requestId !== connectionsRequestId) return;
      console.error(`Could not load profile ${connectionsMode}.`, error);
      elements.connectionsStatus.textContent = `Could not load ${connectionsMode}: ${error.message || 'Please try again.'}`;
    }
  }

  async function openConnections(tabName, updateUrl) {
    connectionsMode = tabName === 'following' ? 'following' : 'followers';
    updateConnectionsTabs();
    if (updateUrl !== false) updateConnectionUrl(connectionsMode);
    if (!elements.connectionsDialog.open) elements.connectionsDialog.showModal();
    await loadConnectionsList();
  }

  function syncConnectionsFromUrl() {
    const tabName = new URLSearchParams(window.location.search).get('tab');
    if (tabName === 'followers' || tabName === 'following') {
      openConnections(tabName, false);
    } else if (elements.connectionsDialog.open) {
      elements.connectionsDialog.close();
    }
  }

  function applyConnectionFollowState(targetId, isFollowing) {
    const key = String(targetId);
    if (isFollowing) connectionFollowIds.add(key);
    else connectionFollowIds.delete(key);
    if (currentUserId && currentUserId === String(profile.id)) {
      const count = Number(profile.followingCount || 0);
      profile.followingCount = Math.max(0, count + (isFollowing ? 1 : -1));
      elements.followingCount.textContent = String(profile.followingCount);
    } else if (key === String(profile.id)) {
      currentProfileFollowing = isFollowing;
      const count = Number(profile.followersCount || 0);
      profile.followersCount = Math.max(0, count + (isFollowing ? 1 : -1));
      elements.followerCount.textContent = String(profile.followersCount);
      renderFollowButton();
    }
    renderConnectionsList();
  }

  async function toggleConnectionFollow(targetId) {
    if (!viewerIsAuthenticated || !currentUserId) {
      window.location.assign('login.html');
      return;
    }
    const key = String(targetId);
    if (!key || key === currentUserId || followActionPending) return;
    const wasFollowing = connectionFollowIds.has(key);
    const shouldFollow = !wasFollowing;
    followActionPending = true;
    applyConnectionFollowState(key, shouldFollow);
    renderFollowButton();
    try {
      const query = supabaseClient.from('follows');
      const result = shouldFollow
        ? await query.insert({ follower_id: currentUserId, following_id: key })
        : await query.delete().eq('follower_id', currentUserId).eq('following_id', key);
      if (result.error) throw result.error;
      showProfileToast(shouldFollow ? 'You are now following this profile.' : 'You unfollowed this profile.');
    } catch (error) {
      console.error('Could not update the follow relationship.', error);
      applyConnectionFollowState(key, wasFollowing);
      showProfileToast(`Could not update this follow: ${error.message || 'Please try again.'}`, 'error');
    } finally {
      followActionPending = false;
      renderFollowButton();
      renderConnectionsList();
    }
  }

  async function refreshProfileConnections() {
    if (!supabaseClient || !profile.id) return;
    connectionDataLoaded = false;
    connectionDataError = false;
    elements.followingCount.textContent = '…';
    elements.followerCount.textContent = '…';
    renderFollowButton();
    try {
      const followerCountQuery = supabaseClient.from('follows')
        .select('follower_id', { count: 'exact', head: true })
        .eq('following_id', profile.id);
      const followingCountQuery = supabaseClient.from('follows')
        .select('following_id', { count: 'exact', head: true })
        .eq('follower_id', profile.id);
      const ownFollowsQuery = currentUserId
        ? supabaseClient.from('follows').select('following_id').eq('follower_id', currentUserId)
        : Promise.resolve({ data: [], error: null });
      const [followersResult, followingResult, ownFollowsResult] = await Promise.all([
        followerCountQuery,
        followingCountQuery,
        ownFollowsQuery
      ]);
      if (followersResult.error) throw followersResult.error;
      if (followingResult.error) throw followingResult.error;
      if (ownFollowsResult.error) throw ownFollowsResult.error;

      profile.followersCount = Number(followersResult.count || 0);
      profile.followingCount = Number(followingResult.count || 0);
      elements.followerCount.textContent = String(profile.followersCount);
      elements.followingCount.textContent = String(profile.followingCount);
      connectionFollowIds = new Set((ownFollowsResult.data || []).map((row) => String(row.following_id)));
      currentProfileFollowing = connectionFollowIds.has(String(profile.id));
      connectionDataLoaded = true;
      renderFollowButton();
    } catch (error) {
      console.error('Could not load live profile connection counts.', error);
      connectionDataLoaded = true;
      connectionDataError = true;
      elements.followerCount.textContent = '—';
      elements.followingCount.textContent = '—';
      renderFollowButton();
      showProfileToast(`Connection counts could not be loaded: ${error.message || 'Please try again.'}`, 'error');
    }
  }

  function normalizeCommunityPost(post) {
    if (!post || typeof post !== 'object') {
      return null;
    }
    const postHandle = normalizeHandle(post.handle || post.author_handle);
    if (postHandle !== publicHandle) {
      return null;
    }
    return {
      ...post,
      handle: post.handle || post.author_handle || `@${publicHandle}`,
      author: post.author || post.author_name || profile.name,
      content: String(post.content || ''),
      likes: Number(post.likes || 0),
      comments: Array.isArray(post.comments) ? post.comments : [],
      images: Array.isArray(post.images)
        ? post.images
        : (post.image_url ? [{ src: post.image_url, alt: 'Image shared by the community' }] : [])
    };
  }

  function collectPublicPosts(remotePosts) {
    const allPosts = [...(window.ATELIER_COMMUNITY_POSTS || [])];
    const storageHandle = publicHandle.replace(/[^a-z0-9_-]/g, '-');
    const deletedIds = new Set(readStoredArray(`atelier_community_${storageHandle}_deleted`).map(String));
    try {
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (!key || !key.startsWith('atelier_community_')) {
          continue;
        }
        const saved = JSON.parse(window.localStorage.getItem(key) || '[]');
        if (!Array.isArray(saved)) continue;
        if (key.endsWith('_posts')) {
          allPosts.push(...saved);
        } else if (key.endsWith('_forum-threads')) {
          allPosts.push(...saved.map((thread) => ({
            ...thread,
            content: thread.title || '',
            comments: Array.isArray(thread.replies) ? thread.replies : [],
            tags: Array.isArray(thread.tags) ? thread.tags : ['COMMUNITY QUESTION'],
            createdAt: thread.createdAt || thread.created_at || ''
          })));
        }
      }
    } catch (error) {
      console.error('Unable to collect community posts saved in this browser.', error);
    }
    allPosts.push(...(remotePosts || []));
    const uniquePosts = new Map();
    allPosts.forEach((post, index) => {
      const normalized = normalizeCommunityPost(post);
      if (normalized && !deletedIds.has(String(normalized.id))) {
        uniquePosts.set(String(normalized.id || `${normalized.handle}-${index}`), normalized);
      }
    });
    return [...uniquePosts.values()].sort((first, second) => {
      const firstDate = new Date(first.createdAt || 0).getTime();
      const secondDate = new Date(second.createdAt || 0).getTime();
      return secondDate - firstDate;
    });
  }

  function createPublicPostCard(post) {
    const article = document.createElement('article');
    article.className = 'profile-post profile-post--public';
    const titleRow = document.createElement('div');
    titleRow.className = 'profile-post__title-row';
    const title = document.createElement('h3');
    title.textContent = post.title || `A post from ${post.author}`;
    const date = document.createElement('time');
    date.textContent = post.timestamp || (post.createdAt
      ? new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : 'Recently shared');
    titleRow.append(title, date);

    const content = document.createElement('p');
    content.textContent = post.content;
    article.append(titleRow, content);

    if (Array.isArray(post.tags) && post.tags.length) {
      const tags = document.createElement('div');
      tags.className = 'community-post__tags';
      post.tags.forEach((value) => {
        const tag = document.createElement('span');
        tag.textContent = value;
        tags.append(tag);
      });
      article.append(tags);
    }

    if (Array.isArray(post.images) && post.images.length) {
      const gallery = document.createElement('div');
      gallery.className = `community-post__gallery${post.images.length > 1 ? ' community-post__gallery--process' : ''}`;
      post.images.slice(0, 3).forEach((item) => {
        if (!item || !item.src) {
          return;
        }
        const frame = document.createElement('figure');
        frame.className = 'community-post__image-frame';
        const image = document.createElement('img');
        image.src = item.src;
        image.alt = item.alt || 'Community post image';
        image.loading = 'lazy';
        frame.append(image);
        if (item.label) {
          const label = document.createElement('figcaption');
          label.textContent = item.label;
          frame.append(label);
        }
        gallery.append(frame);
      });
      if (gallery.childElementCount) {
        article.append(gallery);
      }
    }

    const footer = document.createElement('div');
    footer.className = 'profile-post__footer profile-post__footer--public';
    const counts = document.createElement('div');
    counts.className = 'profile-post__counts';
    const likes = document.createElement('span');
    likes.textContent = `♡ ${Number(post.likes || 0)} likes`;
    const comments = document.createElement('span');
    comments.textContent = `◯ ${post.comments.length} comments`;
    counts.append(likes, comments);
    footer.append(counts);
    article.append(footer);
    return article;
  }

  function renderPublicPosts(remotePosts) {
    const posts = collectPublicPosts(remotePosts);
    elements.postList.replaceChildren();
    if (!posts.length) {
      const empty = document.createElement('p');
      empty.className = 'profile-public-empty';
      empty.textContent = 'No community posts from this profile yet.';
      elements.postList.append(empty);
      return;
    }
    posts.forEach((post) => elements.postList.append(createPublicPostCard(post)));
  }

  async function loadRemotePublicPosts() {
    if (!profile.id || !window.atelierSupabase) return;
    try {
      const { data, error } = await window.atelierSupabase.getClient()
        .from('community_posts')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) {
        throw error;
      }
      const posts = (data || []).map((row) => ({
        id: String(row.id),
        author: row.author_name || profile.name,
        handle: row.author_handle || `@${publicHandle}`,
        title: row.title || '',
        content: row.content || row.body || '',
        tags: Array.isArray(row.tags) ? row.tags : [],
        image_url: row.image_url,
        likes: Number(row.likes || 0),
        comments: Array.isArray(row.comments) ? row.comments : [],
        createdAt: row.created_at,
        timestamp: row.created_at
          ? new Date(row.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          : 'Recently shared'
      }));
      renderPublicPosts(posts);
    } catch (error) {
      console.warn('Profile posts could not be loaded from Supabase; showing local posts instead.', error.message);
      renderPublicPosts();
    }
  }

  function localMarketplaceListings() {
    const stored = readStoredArray('atelier_marketplace_items')
      .concat(readStoredArray('atelier_marketplace_listings'));
    const unique = new Map(stored.map((item) => [String(item.id || `${item.seller}-${item.title}`), item]));
    return [...unique.values()].filter((item) => normalizeHandle(item.seller || item.username) === publicHandle);
  }

  function renderProfileListings(remoteListings) {
    const items = new Map();
    [...localMarketplaceListings(), ...(remoteListings || [])].forEach((item, index) => {
      items.set(String(item.id || `${item.title || 'listing'}-${index}`), item);
    });
    elements.listingGrid.replaceChildren();
    if (!items.size) {
      const empty = document.createElement('p');
      empty.className = 'profile-public-empty';
      empty.textContent = 'No active listings from this profile yet.';
      elements.listingGrid.append(empty);
      return;
    }

    items.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'profile-listing-card';
      const image = document.createElement('img');
      image.src = item.image_url || item.image || 'assets/profile-avatar-fallback.svg';
      image.alt = item.title || 'Marketplace listing';
      image.loading = 'lazy';
      const details = document.createElement('div');
      const title = document.createElement('h3');
      title.textContent = item.title || 'Atelier listing';
      const price = document.createElement('p');
      const amount = Number(item.price);
      price.textContent = Number.isFinite(amount) ? `₹${amount.toLocaleString('en-IN')}` : 'Price on request';
      const link = document.createElement('a');
      link.href = 'marketplace.html';
      link.textContent = 'View Marketplace';
      details.append(title, price, link);
      card.append(image, details);
      elements.listingGrid.append(card);
    });
  }

  async function loadProfileListings() {
    let remoteListings = [];
    if (profile.id && window.atelierSupabase) {
      try {
        const { data, error } = await window.atelierSupabase.getClient()
          .from('marketplace_items')
          .select('*')
          .eq('seller_id', profile.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        remoteListings = data || [];
      } catch (error) {
        console.warn('Profile listings could not be loaded from Supabase; showing local listings instead.', error.message);
      }
    }
    renderProfileListings(remoteListings);
  }

  function mapProfileLookbookEntry(entry) {
    return {
      id: String(entry.id || ''),
      user_id: String(entry.user_id || ''),
      username: normalizeHandle(entry.username),
      title: String(entry.title || entry.outfit_title || 'Atelier outfit'),
      vibe: String(entry.vibe || 'Styled look'),
      caption: String(entry.caption || ''),
      image_url: String(entry.image_url || entry.photo_url || ''),
      created_at: entry.created_at || entry.saved_at || ''
    };
  }

  function renderProfileLookbook(remoteEntries) {
    const localEntries = readStoredArray('atelier_lookbook_entries')
      .filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry))
      .map(mapProfileLookbookEntry)
      .filter((entry) => (
        (profile.id && entry.user_id === String(profile.id))
        || (publicHandle && entry.username === normalizeHandle(publicHandle))
      ));
    const entries = new Map();
    [...localEntries, ...remoteEntries].forEach((entry) => {
      if (entry.image_url) entries.set(entry.id || `${entry.title}-${entry.created_at}`, entry);
    });

    elements.lookbookGrid.replaceChildren();
    const lookbookEntries = [...entries.values()].sort((left, right) => (
      new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    ));
    if (!lookbookEntries.length) {
      const empty = document.createElement('p');
      empty.className = 'profile-lookbook-gallery__empty';
      empty.textContent = 'No outfit photos in this lookbook yet.';
      elements.lookbookGrid.append(empty);
      return;
    }

    lookbookEntries.forEach((entry) => {
      const card = document.createElement('article');
      card.className = 'profile-lookbook-photo';
      const image = document.createElement('img');
      image.src = entry.image_url;
      image.alt = entry.title;
      image.loading = 'lazy';
      const details = document.createElement('div');
      details.className = 'profile-lookbook-photo__details';
      const title = document.createElement('h3');
      title.textContent = entry.title;
      const vibe = document.createElement('span');
      vibe.className = 'profile-lookbook-photo__vibe';
      vibe.textContent = entry.vibe;
      const caption = document.createElement('p');
      caption.textContent = entry.caption;
      caption.hidden = !entry.caption;
      const date = document.createElement('time');
      if (entry.created_at) date.dateTime = entry.created_at;
      const createdDate = new Date(entry.created_at);
      date.textContent = Number.isNaN(createdDate.getTime())
        ? ''
        : createdDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      details.append(title, vibe, caption, date);
      card.append(image, details);
      elements.lookbookGrid.append(card);
    });
  }

  async function loadProfileLookbook() {
    let remoteEntries = [];
    if (profile.id && window.atelierSupabase) {
      try {
        const { data, error } = await window.atelierSupabase.getClient()
          .from('lookbook_entries')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        remoteEntries = (data || []).map(mapProfileLookbookEntry);
      } catch (error) {
        console.warn('Profile lookbook could not be loaded from Supabase; showing matching cached photos.', error);
      }
    }
    renderProfileLookbook(remoteEntries);
  }

  elements.followButton.addEventListener('click', () => toggleConnectionFollow(profile.id));
  elements.connectionButtons.forEach((button) => {
    button.addEventListener('click', () => openConnections(button.dataset.openConnections, true));
  });
  elements.connectionsTabs.forEach((tab) => {
    tab.addEventListener('click', () => openConnections(tab.dataset.connectionsTab, true));
  });
  elements.connectionsList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-person-follow]');
    if (button) toggleConnectionFollow(button.dataset.personFollow);
  });
  document.querySelectorAll('[data-close-connections]').forEach((button) => {
    button.addEventListener('click', () => elements.connectionsDialog.close());
  });
  elements.connectionsDialog.addEventListener('click', (event) => {
    if (event.target === elements.connectionsDialog) elements.connectionsDialog.close();
  });
  elements.connectionsDialog.addEventListener('close', clearConnectionUrl);
  window.addEventListener('popstate', syncConnectionsFromUrl);

  renderProfile();
  renderFollowButton();
  setProfileTab('posts');

  let pendingAvatarUrl = profile.avatarUrl || '';
  let pendingBannerUrl = profile.coverUrl || '';

  function openEditor(focusInput) {
    document.getElementById('edit-display-name').value = profile.name;
    document.getElementById('edit-username').value = normalizeHandle(profile.username);
    document.getElementById('edit-bio').value = profile.bio;
    const role = normalizeRole(profile.role);
    document.getElementById('edit-role').value = role === 'Tailor / Designer' || role === 'Verified Tailor'
      ? 'tailor'
      : role.toLowerCase();
    const details = profile.roleDetails || {};
    document.getElementById('edit-role-neighborhood').value = firstTailorValue(tailorRecord, ['neighborhood', 'area'])
      || details.neighborhood
      || '';
    document.getElementById('edit-role-specialty').value = firstTailorValue(tailorRecord, ['specialty', 'specialties', 'specialization'])
      || details.specialty
      || '';
    document.getElementById('edit-role-upi').value = details.upi_id || '';
    document.getElementById('edit-role-whatsapp').value = details.whatsapp || '';
    pendingAvatarUrl = profile.avatarUrl || '';
    pendingBannerUrl = profile.coverUrl || '';
    elements.avatarInput.value = '';
    elements.bannerInput.value = '';
    elements.avatarPreview.hidden = !pendingAvatarUrl;
    elements.avatarPreview.src = pendingAvatarUrl;
    elements.bannerPreview.hidden = !pendingBannerUrl;
    elements.bannerPreview.src = pendingBannerUrl;
    elements.editDialog.showModal();
    if (focusInput) window.setTimeout(() => focusInput.focus(), 0);
  }

  elements.tailorEditButton.addEventListener('click', () => {
    const details = profile.roleDetails || {};
    const specialty = firstTailorValue(tailorRecord, ['specialty', 'specialties', 'specialization', 'services'])
      || String(details.specialty || '');
    const specialtyOption = [...elements.tailorStudioSpecialtySelect.options]
      .find((option) => option.value === specialty);
    elements.tailorStudioNameInput.value = firstTailorValue(tailorRecord, ['name', 'studio_name', 'display_name'])
      || profile.name;
    elements.tailorStudioLocationInput.value = firstTailorValue(
      tailorRecord,
      ['neighborhood', 'area', 'address', 'street', 'location']
    ) || String(details.neighborhood || '');
    elements.tailorStudioSpecialtySelect.value = specialtyOption ? specialtyOption.value : (specialty ? 'custom' : '');
    elements.tailorStudioCustomSpecialtyInput.value = specialtyOption ? '' : specialty;
    elements.tailorStudioCustomSpecialtyInput.hidden = elements.tailorStudioSpecialtySelect.value !== 'custom';
    elements.tailorStudioCustomSpecialtyInput.required = elements.tailorStudioSpecialtySelect.value === 'custom';
    elements.tailorStudioPriceInput.value = firstTailorValue(tailorRecord, ['price_range', 'priceRange', 'pricing'])
      || String(details.price_range || '');
    elements.tailorStudioContactInput.value = firstTailorValue(
      tailorRecord,
      ['contact_info', 'contact', 'phone', 'contact_phone', 'whatsapp', 'email']
    ) || String(details.contact || details.whatsapp || '');
    elements.tailorStudioBioInput.value = firstTailorValue(tailorRecord, ['bio', 'services_note'])
      || String(details.studio_bio || '');
    elements.tailorStudioMessage.hidden = true;
    elements.tailorStudioMessage.textContent = '';
    elements.tailorStudioDialog.showModal();
  });

  elements.tailorStudioSpecialtySelect.addEventListener('change', () => {
    const isCustom = elements.tailorStudioSpecialtySelect.value === 'custom';
    elements.tailorStudioCustomSpecialtyInput.hidden = !isCustom;
    elements.tailorStudioCustomSpecialtyInput.required = isCustom;
    elements.tailorStudioCustomSpecialtyInput.setCustomValidity('');
    if (isCustom) elements.tailorStudioCustomSpecialtyInput.focus();
  });

  elements.tailorStudioForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(elements.tailorStudioForm);
    const studioName = String(formData.get('name') || '').trim();
    const neighborhood = String(formData.get('neighborhood') || '').trim();
    const specialtySelectValue = String(formData.get('specialty') || '');
    const specialty = specialtySelectValue === 'custom'
      ? String(formData.get('customSpecialty') || '').trim()
      : specialtySelectValue.trim();
    if (!studioName || !neighborhood || !specialty) {
      if (specialtySelectValue === 'custom' && !specialty) {
        elements.tailorStudioCustomSpecialtyInput.setCustomValidity('Enter your custom specialty.');
        elements.tailorStudioCustomSpecialtyInput.reportValidity();
      }
      return;
    }

    const submitButton = elements.tailorStudioForm.querySelector('[type="submit"]');
    submitButton.disabled = true;
    elements.tailorStudioMessage.hidden = true;
    let tailorSaved = false;
    try {
      const session = await window.atelierSupabase.getSession();
      if (!session || !session.user || String(session.user.id) !== String(profile.id)) {
        throw new Error('Log in to the tailor profile owner account to edit studio details.');
      }

      const client = window.atelierSupabase.getClient();
      const tailorPayload = {
        user_id: session.user.id,
        name: studioName,
        neighborhood,
        specialty,
        price_range: String(formData.get('priceRange') || '').trim(),
        contact_info: String(formData.get('contactInfo') || '').trim(),
        bio: String(formData.get('bio') || '').trim(),
        avatar_url: profile.avatarUrl || ''
      };
      const { data: savedTailor, error: tailorError } = await client
        .from('tailors')
        .upsert(tailorPayload, { onConflict: 'user_id' })
        .select('*')
        .single();
      if (tailorError) throw tailorError;
      tailorRecord = savedTailor;
      tailorSaved = true;

      const roleDetails = {
        ...(profile.roleDetails || {}),
        neighborhood,
        specialty
      };
      let profileResult = await client
        .from('profiles')
        .update({ location: neighborhood, specialty, role_details: roleDetails })
        .eq('id', session.user.id)
        .select('*')
        .single();
      if (isMissingProfileColumn(profileResult.error, ['location', 'specialty'])) {
        profileResult = await client
          .from('profiles')
          .update({ role_details: roleDetails })
          .eq('id', session.user.id)
          .select('*')
          .single();
      }
      if (profileResult.error) throw profileResult.error;

      cacheProfileForLegacyPages(profileResult.data);
      renderProfile();
      elements.tailorStudioDialog.close();
      showProfileToast('Studio details updated.');
    } catch (error) {
      console.error('Unable to save the tailor studio details.', error);
      elements.tailorStudioMessage.textContent = tailorSaved
        ? `Studio details were saved to the tailor directory, but the profile sync failed: ${error.message}`
        : `Could not save studio details: ${error.message}`;
      elements.tailorStudioMessage.dataset.kind = 'error';
      elements.tailorStudioMessage.hidden = false;
    } finally {
      submitButton.disabled = false;
    }
  });
  [
    elements.tailorStudioNameInput,
    elements.tailorStudioLocationInput,
    elements.tailorStudioCustomSpecialtyInput
  ].forEach((input) => input.addEventListener('input', () => input.setCustomValidity('')));

  async function prepareImage(input, preview, kind) {
    const file = input.files && input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showProfileToast('Choose an image file.', 'error');
      input.value = '';
      return;
    }

    preview.src = URL.createObjectURL(file);
    preview.hidden = false;
    showProfileToast(`Uploading ${kind}...`, 'loading');
    try {
      const uploadedUrl = await window.atelierSupabase.uploadImage(file);
      preview.src = uploadedUrl;
      if (kind === 'profile picture') pendingAvatarUrl = uploadedUrl;
      else pendingBannerUrl = uploadedUrl;
      showProfileToast(`${kind} uploaded. Save changes to apply it.`);
    } catch (error) {
      console.error(`Unable to upload the ${kind}.`, error);
      try {
        const dataUrl = await readFileAsDataUrl(file);
        preview.src = dataUrl;
        if (kind === 'profile picture') pendingAvatarUrl = dataUrl;
        else pendingBannerUrl = dataUrl;
        showProfileToast(`Cloudinary upload failed; preview saved locally. ${error.message}`, 'error');
      } catch (fallbackError) {
        console.error(`Unable to preview the ${kind}.`, fallbackError);
        showProfileToast(`Could not preview this image: ${fallbackError.message}`, 'error');
      }
    } finally {
      input.value = '';
    }
  }

  elements.avatarInput.addEventListener('change', () => prepareImage(
    elements.avatarInput,
    elements.avatarPreview,
    'profile picture'
  ));
  elements.bannerInput.addEventListener('change', () => prepareImage(
    elements.bannerInput,
    elements.bannerPreview,
    'cover banner'
  ));
  elements.editButton.addEventListener('click', () => openEditor());
  elements.avatarEditButton.addEventListener('click', () => openEditor(elements.avatarInput));
  elements.bannerEditButton.addEventListener('click', () => openEditor(elements.bannerInput));
  elements.deleteAccountButton.addEventListener('click', () => {
    if (
      !viewerIsAuthenticated
      || isPublicProfile
      || !currentUserId
      || String(profile.id) !== currentUserId
    ) {
      showProfileToast('Only the signed-in profile owner can delete this account.', 'error');
      return;
    }

    if (!accountDeletionCompleted) {
      elements.deleteForm.reset();
      elements.deleteSubmitButton.textContent = 'Permanently Delete My Account';
      elements.deleteSubmitButton.disabled = true;
      elements.deleteConfirmationInput.disabled = false;
      elements.deleteCancelButton.disabled = false;
      elements.deleteMessage.hidden = true;
      elements.deleteMessage.textContent = '';
      elements.deleteMessage.removeAttribute('data-kind');
    }
    elements.deleteDialog.showModal();
  });

  elements.deleteConfirmationInput.addEventListener('input', () => {
    elements.deleteSubmitButton.disabled = elements.deleteConfirmationInput.value !== 'DELETE';
  });

  elements.deleteCancelButton.addEventListener('click', () => {
    if (!accountDeletionCompleted && !accountDeletionInProgress) {
      elements.deleteDialog.close();
    }
  });

  elements.deleteDialog.addEventListener('cancel', (event) => {
    if (accountDeletionCompleted || accountDeletionInProgress) {
      event.preventDefault();
    }
  });

  elements.deleteForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (elements.deleteConfirmationInput.value !== 'DELETE' || accountDeletionInProgress) return;

    accountDeletionInProgress = true;
    elements.deleteSubmitButton.disabled = true;
    elements.deleteCancelButton.disabled = true;
    elements.deleteConfirmationInput.disabled = true;
    elements.deleteMessage.hidden = true;
    elements.deleteMessage.textContent = '';
    let cleanupErrors = [];

    try {
      const client = window.atelierSupabase.getClient();
      if (!accountDeletionCompleted) {
        const session = await window.atelierSupabase.getSession();
        if (
          !session
          || !session.user
          || String(session.user.id) !== currentUserId
          || String(session.user.id) !== String(profile.id)
          || isPublicProfile
        ) {
          throw new Error('Your session no longer matches this profile. Please sign in again.');
        }

        const { error } = await client.rpc('delete_own_account');
        if (error) throw error;
        accountDeletionCompleted = true;
        elements.deleteSubmitButton.textContent = 'Finish Sign Out';
        cleanupErrors = window.atelierSupabase.clearAllAtelierStorage();
      }

      const { error: signOutError } = await client.auth.signOut();
      if (signOutError) throw signOutError;

      if (cleanupErrors.length) {
        console.error('The account was deleted, but some local data could not be cleared.', cleanupErrors);
        showProfileToast('Account deleted, but some local data could not be cleared. Please review this browser’s stored Atelier data.', 'error');
        window.setTimeout(() => window.location.assign('index.html'), 2700);
        return;
      }

      window.location.assign('index.html');
    } catch (error) {
      console.error('Unable to complete Atelier account deletion and sign-out.', error);
      elements.deleteMessage.dataset.kind = 'error';
      elements.deleteMessage.textContent = accountDeletionCompleted
        ? `Your account was deleted, but sign-out failed: ${error.message || 'Please try again.'}`
        : `Account deletion failed: ${error.message || 'Please try again.'}`;
      elements.deleteMessage.hidden = false;
    } finally {
      accountDeletionInProgress = false;
      elements.deleteCancelButton.disabled = accountDeletionCompleted;
      elements.deleteConfirmationInput.disabled = accountDeletionCompleted;
      elements.deleteSubmitButton.disabled = elements.deleteConfirmationInput.value !== 'DELETE';
    }
  });

  elements.editForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(elements.editForm);
    const displayName = String(formData.get('displayName') || '').trim();
    const username = window.atelierSupabase.normalizeUsername(formData.get('username'));
    const bio = String(formData.get('bio') || '').trim();
    const role = String(formData.get('role') || 'member').toLowerCase();
    if (!displayName || username.length < 3) {
      showProfileToast('Enter a display name and a username with at least 3 letters, numbers, or underscores.', 'error');
      return;
    }
    const roleDetails = Object.fromEntries(
      ['neighborhood', 'specialty', 'upi_id', 'whatsapp']
        .map((key) => [key, String(formData.get(key) || '').trim()])
        .filter(([, value]) => value)
    );
    const submitButton = elements.editForm.querySelector('[type="submit"]');
    submitButton.disabled = true;
    showProfileToast('Saving profile...', 'loading');
    try {
      const session = await window.atelierSupabase.getSession();
      if (!session || !session.user) throw new Error('Your session expired. Please log in again.');
      const client = window.atelierSupabase.getClient();
      const profileChanges = {
        display_name: displayName,
        username,
        bio,
        role,
        avatar_url: pendingAvatarUrl,
        banner_url: pendingBannerUrl,
        role_details: roleDetails
      };
      let profileResult = await client
        .from('profiles')
        .update({ ...profileChanges, profile_completed: true })
        .eq('id', session.user.id)
        .select('*')
        .single();
      if (isMissingProfileColumn(profileResult.error, ['profile_completed'])) {
        profileResult = await client
          .from('profiles')
          .update(profileChanges)
          .eq('id', session.user.id)
          .select('*')
          .single();
      }
      if (profileResult.error) throw profileResult.error;

      cacheProfileForLegacyPages({ ...profileResult.data, profile_completed: true });
      renderProfile();
      renderFollowButton();
      elements.editDialog.close();
      showProfileToast('Profile updated.');
    } catch (error) {
      console.error('Unable to update the Atelier profile.', error);
      showProfileToast(`Could not save your profile: ${error.message}`, 'error');
    } finally {
      submitButton.disabled = false;
    }
  });

  elements.logoutButton.addEventListener('click', async () => {
    elements.logoutButton.disabled = true;
    try {
      const { error } = await window.atelierSupabase.getClient().auth.signOut();
      if (error) throw error;
      const cleanupErrors = window.atelierSupabase.clearAllAtelierStorage();
      if (cleanupErrors.length) {
        console.error('Signed out, but some local Atelier data could not be cleared.', cleanupErrors);
        showProfileToast('Signed out, but some local Atelier data could not be cleared.', 'error');
        window.setTimeout(() => window.location.assign('index.html'), 2700);
        return;
      }
      window.location.assign('index.html');
    } catch (error) {
      console.error('Unable to sign out of Atelier.', error);
      showProfileToast(`Could not log out: ${error.message}`, 'error');
      elements.logoutButton.disabled = false;
    }
  });

  elements.profileTabs.forEach((tab) => {
    tab.addEventListener('click', () => setProfileTab(tab.dataset.profileTab));
  });

  loadProfileFromSupabase();

  document.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => button.closest('dialog').close());
  });
  [elements.editDialog, elements.tailorStudioDialog, elements.threadDialog].forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });
  });

  const posts = new Map();
  let activePost = null;

  function renderComments(post) {
    elements.threadComments.replaceChildren();
    post.comments.forEach((comment) => {
      const item = document.createElement('li');
      const author = document.createElement('strong');
      const body = document.createElement('span');
      author.textContent = comment.author;
      body.textContent = comment.body;
      item.append(author, body);
      elements.threadComments.append(item);
    });
    elements.threadCommentCount.textContent = `(${post.commentCount})`;
    const card = elements.postList.querySelector(`[data-post-id="${post.id}"]`);
    if (card) {
      const count = card.querySelector('.post-comment-count');
      const label = count.parentElement;
      count.textContent = String(post.commentCount);
      label.setAttribute('aria-label', `${post.commentCount} comments`);
    }
  }

  function openPost(postId) {
    const post = posts.get(postId);
    if (!post) {
      return;
    }
    activePost = post;
    elements.threadTitle.textContent = post.title;
    elements.threadUsername.textContent = profile.username;
    elements.threadDate.textContent = `• ${post.date}`;
    elements.threadBody.textContent = post.body;
    elements.threadLikeCount.textContent = String(post.likes);
    elements.threadUpvote.setAttribute('aria-pressed', String(post.isLiked));
    renderComments(post);
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${post.id}`);
    elements.threadDialog.showModal();
  }

  elements.postList.addEventListener('click', (event) => {
    const card = event.target.closest('.profile-post');
    if (card) {
      openPost(card.dataset.postId);
    }
  });
  elements.postList.addEventListener('keydown', (event) => {
    const card = event.target.closest('.profile-post');
    if (card && event.target === card && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      openPost(card.dataset.postId);
    }
  });

  elements.threadUpvote.addEventListener('click', () => {
    if (!activePost) {
      return;
    }
    activePost.isLiked = !activePost.isLiked;
    activePost.likes += activePost.isLiked ? 1 : -1;
    elements.threadLikeCount.textContent = String(activePost.likes);
    elements.threadUpvote.setAttribute('aria-pressed', String(activePost.isLiked));
    const card = elements.postList.querySelector(`[data-post-id="${activePost.id}"]`);
    card.querySelector('.post-like-count').textContent = String(activePost.likes);
    card.querySelector('.profile-post__counts > span').setAttribute('aria-label', `${activePost.likes} likes`);
  });

  elements.commentForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!activePost) {
      return;
    }
    const body = elements.commentInput.value.trim();
    if (!body) {
      return;
    }
    activePost.comments.push({ author: profile.username, body });
    activePost.commentCount += 1;
    elements.commentInput.value = '';
    renderComments(activePost);
    elements.threadComments.lastElementChild.scrollIntoView({ block: 'nearest' });
  });

  elements.threadDialog.addEventListener('close', () => {
    if (window.location.hash.startsWith('#post-')) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
    activePost = null;
  });

  const initialPostId = window.location.hash.slice(1);
  if (!isPublicProfile && posts.has(initialPostId)) {
    openPost(initialPostId);
  }
});

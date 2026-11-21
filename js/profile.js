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
    name: 'sanj',
    id: '',
    username: '@sanjs4n',
    bio: 'born cool like that\nim a college student who loves fashion and loves to thrift!\nhop along for some cool tips lol',
    role: 'Member',
    avatarUrl: '',
    coverUrl: '',
    followingCount: 125,
    followersCount: 578
  };
  const supportedRoles = ['Member', 'Student', 'Tailor', 'Tailor / Designer', 'Seller'];
  const elements = {
    name: document.getElementById('profile-display-name'),
    username: document.getElementById('profile-username'),
    bio: document.getElementById('profile-bio'),
    followingCount: document.getElementById('profile-following-count'),
    followerCount: document.getElementById('profile-follower-count'),
    role: document.getElementById('profile-role'),
    roleIcon: document.getElementById('profile-role-icon'),
    roleDetails: document.getElementById('profile-role-details'),
    avatar: document.getElementById('profile-avatar-image'),
    avatarFallback: document.getElementById('profile-avatar-fallback'),
    cover: document.getElementById('profile-cover-image'),
    coverFallback: document.getElementById('profile-cover-fallback'),
    editDialog: document.getElementById('profile-edit-dialog'),
    editForm: document.getElementById('profile-edit-form'),
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
      const saved = window.localStorage.getItem('atelier_current_user')
        || window.localStorage.getItem('atelierUser');
      if (!saved) {
        return { ...defaultProfile };
      }

      const storedProfile = JSON.parse(saved);
      if (!storedProfile || typeof storedProfile !== 'object' || Array.isArray(storedProfile)) {
        throw new Error('Stored profile data is not an object.');
      }

      return {
        ...defaultProfile,
        ...storedProfile,
        id: storedProfile.id || '',
        name: storedProfile.display_name || storedProfile.displayName || storedProfile.name || defaultProfile.name,
        username: `@${normalizeHandle(storedProfile.username || defaultProfile.username)}`,
        bio: typeof storedProfile.bio === 'string' ? storedProfile.bio : defaultProfile.bio,
        role: normalizeRole(storedProfile.role),
        roleDetails: storedProfile.role_details || storedProfile.roleDetails || {},
        avatarUrl: storedProfile.avatar_url || storedProfile.avatarUrl || '',
        coverUrl: storedProfile.banner_url || storedProfile.bannerUrl || storedProfile.coverUrl || '',
        followingCount: readCount(storedProfile.followingCount, storedProfile.following, 125),
        followersCount: readCount(storedProfile.followersCount, storedProfile.followerCount, 578)
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
      const saved = JSON.parse(
        window.localStorage.getItem('atelier_current_user')
        || window.localStorage.getItem('atelierUser')
        || 'null'
      );
      return Boolean(
        saved
        && typeof saved === 'object'
        && !Array.isArray(saved)
        && ['name', 'username', 'email'].some((field) => (
          typeof saved[field] === 'string' && saved[field].trim()
        ))
      );
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
  let isPublicProfile = Boolean(requestedHandle);

  function getPublicProfile(handle) {
    const aliases = window.ATELIER_PUBLIC_PROFILE_ALIASES || {};
    handle = aliases[handle] || handle;
    if (
      viewerIsAuthenticated
      && normalizeHandle(viewerProfile.username) === handle
    ) {
      return { ...viewerProfile };
    }

    const profiles = window.ATELIER_PUBLIC_PROFILES || {};
    const seeded = profiles[handle]
      || Object.values(profiles).find((candidate) => (
        normalizeHandle(candidate.name) === handle
        || normalizeHandle(candidate.username) === handle
      ));
    const shop = getLocalTailor(handle);
    if (shop) {
      return {
        ...(seeded || {}),
        name: shop.name || (seeded && seeded.name) || handle,
        username: `@${handle}`,
        bio: shop.bio || (seeded && seeded.bio) || 'A local tailor listed by the Atelier community.',
        role: shop.is_verified ? 'Verified Tailor' : 'Tailor',
        avatarUrl: shop.image || (seeded && seeded.avatarUrl) || '',
        coverUrl: shop.coverUrl || (seeded && seeded.coverUrl) || '',
        followingCount: readCount(shop.followingCount, shop.following, 68),
        followersCount: readCount(shop.followersCount, shop.followers, 0)
      };
    }
    if (seeded) {
      return { ...defaultProfile, ...seeded };
    }

    return {
      ...defaultProfile,
      name: handle || defaultProfile.name,
      username: `@${handle}`,
      bio: 'Atelier community member',
      role: 'Member',
      followingCount: 0,
      followersCount: 0
    };
  }

  let profile = isPublicProfile ? getPublicProfile(requestedHandle) : viewerProfile;
  let publicHandle = isPublicProfile ? normalizeHandle(profile.username) : requestedHandle;

  function updateRoleIcon(role) {
    const icons = {
      Member: '<path d="M3 5h4l3 16h15l4-12H9"></path><circle cx="13" cy="26" r="2"></circle><circle cx="24" cy="26" r="2"></circle>',
      Student: '<path d="m3 11 13-7 13 7-13 7-13-7Z"></path><path d="M8 14v7c4 3 12 3 16 0v-7M29 11v9"></path>',
      'Tailor / Designer': '<path d="m5 5 18 18M19 5a4 4 0 1 0 8 0 4 4 0 0 0-8 0ZM3 27a4 4 0 1 0 8 0 4 4 0 0 0-8 0ZM5 24 24 8"></path>',
      Seller: '<path d="M4 10h24l-2 17H6L4 10Z"></path><path d="M10 10a6 6 0 0 1 12 0"></path>'
    };
    elements.roleIcon.innerHTML = icons[role] || icons.Member;
  }

  function renderProfile() {
    elements.name.textContent = profile.name;
    elements.username.textContent = profile.username;
    elements.bio.textContent = profile.bio;
    const details = profile.roleDetails && typeof profile.roleDetails === 'object'
      ? Object.entries(profile.roleDetails)
        .filter(([, value]) => typeof value === 'string' && value.trim())
        .map(([key, value]) => `${key.replace(/[_-]+/g, ' ')}: ${value.trim()}`)
      : [];
    elements.roleDetails.textContent = details.join(' · ');
    elements.roleDetails.hidden = details.length === 0;
    elements.followingCount.textContent = String(readCount(profile.followingCount, profile.following, 125));
    elements.followerCount.textContent = String(readCount(profile.followersCount, profile.followerCount, 578));
    elements.role.textContent = profile.role;
    updateRoleIcon(profile.role);
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
    profile = {
      ...profile,
      id: cached.id,
      name: cached.display_name,
      username: `@${cached.username}`,
      bio: cached.bio || '',
      role: normalizeRole(cached.role),
      roleDetails: cached.role_details,
      avatarUrl: cached.avatar_url,
      coverUrl: cached.banner_url
    };
    viewerProfile = { ...profile };
    return cached;
  }

  function profileFromDatabaseRow(row) {
    return {
      id: row.id || '',
      name: String(row.display_name || row.username || 'Atelier Member'),
      username: `@${normalizeHandle(row.username)}`,
      bio: String(row.bio || ''),
      role: normalizeRole(row.role),
      roleDetails: row.role_details && typeof row.role_details === 'object' ? row.role_details : {},
      avatarUrl: String(row.avatar_url || ''),
      coverUrl: String(row.banner_url || ''),
      followingCount: readCount(row.following_count, row.following, 0),
      followersCount: readCount(row.followers_count, row.follower_count, 0)
    };
  }

  async function loadProfileFromSupabase() {
    try {
      const client = window.atelierSupabase.getClient();
      const session = await window.atelierSupabase.getSession();
      viewerIsAuthenticated = Boolean(session && session.user);
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
        const isViewingSelf = requestedHandle && requestedHandle === normalizeHandle(cached.username);
        if (!requestedHandle || isViewingSelf) {
          isPublicProfile = false;
          profile = { ...viewerProfile };
          publicHandle = normalizeHandle(profile.username);
        } else {
          isPublicProfile = true;
        }
      } else if (!requestedHandle) {
        window.location.assign('login.html');
        return;
      }

      if (requestedHandle && isPublicProfile) {
        const { data, error } = await client
          .from('profiles')
          .select('*')
          .ilike('username', requestedHandle)
          .limit(1);
        if (error) throw error;
        if (data && data.length) profile = profileFromDatabaseRow(data[0]);
        else profile = getPublicProfile(requestedHandle);
        publicHandle = normalizeHandle(profile.username);
      }

      renderProfile();
      renderFollowButton();
      setProfileTab('posts');
      renderPublicPosts();
      await Promise.all([loadRemotePublicPosts(), loadProfileListings(), loadProfileLookbook()]);

      if (oauthCallback && viewerIsAuthenticated) {
        window.localStorage.removeItem('atelierPendingRole');
        const destination = window.atelierAuth.consumeRedirectAfterLogin('profile.html');
        const currentPage = `${window.location.pathname}${window.location.search}`;
        if (destination !== 'profile.html' && !destination.endsWith(currentPage)) {
          window.location.assign(destination);
        } else {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    } catch (error) {
      console.error('Unable to load the Atelier profile from Supabase.', error);
      if (!requestedHandle && !viewerIsAuthenticated) {
        window.location.assign('login.html');
        return;
      }
      showProfileToast(`Could not load the profile from Supabase: ${error.message}`, 'error');
      if (requestedHandle) {
        profile = getPublicProfile(requestedHandle);
        isPublicProfile = true;
        publicHandle = normalizeHandle(profile.username);
        renderProfile();
        renderFollowButton();
        renderPublicPosts();
        await Promise.all([loadProfileListings(), loadProfileLookbook()]);
      }
    }
  }

  function getFollowingStorageKey() {
    const viewerHandle = viewerProfile && viewerProfile.username ? viewerProfile.username : '@guest';
    const key = normalizeHandle(viewerHandle).replace(/[^a-z0-9_-]/g, '-');
    return `atelier_community_${key}_following`;
  }

  function renderFollowButton() {
    if (!isPublicProfile) {
      return;
    }
    if (!viewerIsAuthenticated) {
      elements.followButton.textContent = 'Log in to follow';
      elements.followButton.setAttribute('aria-pressed', 'false');
      return;
    }
    if (normalizeHandle(viewerProfile.username) === publicHandle) {
      elements.followButton.textContent = 'Your profile';
      elements.followButton.disabled = true;
      elements.followButton.setAttribute('aria-pressed', 'false');
      return;
    }
    const following = readStoredArray(getFollowingStorageKey())
      .map(normalizeHandle)
      .includes(publicHandle);
    elements.followButton.textContent = following ? 'Following' : 'Follow';
    elements.followButton.classList.toggle('is-following', following);
    elements.followButton.setAttribute('aria-pressed', String(following));
  }

  function normalizeCommunityPost(post) {
    if (!post || typeof post !== 'object') {
      return null;
    }
    const aliases = window.ATELIER_PUBLIC_PROFILE_ALIASES || {};
    const postHandle = aliases[normalizeHandle(post.handle || post.author_handle)]
      || normalizeHandle(post.handle || post.author_handle);
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

  elements.followButton.addEventListener('click', () => {
    if (!viewerIsAuthenticated) {
      window.location.assign('login.html');
      return;
    }
    if (normalizeHandle(viewerProfile.username) === publicHandle) {
      return;
    }
    try {
      const follows = new Set(readStoredArray(getFollowingStorageKey()).map(normalizeHandle));
      if (follows.has(publicHandle)) {
        follows.delete(publicHandle);
      } else {
        follows.add(publicHandle);
      }
      window.localStorage.setItem(getFollowingStorageKey(), JSON.stringify([...follows]));
      renderFollowButton();
      showProfileToast(follows.has(publicHandle) ? 'You are now following this profile.' : 'You unfollowed this profile.');
    } catch (error) {
      console.error('Unable to update the followed profiles list.', error);
      showProfileToast('Could not update your following list. Check browser storage and try again.', 'error');
    }
  });

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
    document.getElementById('edit-role-neighborhood').value = details.neighborhood || '';
    document.getElementById('edit-role-specialty').value = details.specialty || '';
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
      const { data, error } = await window.atelierSupabase.getClient()
        .from('profiles')
        .update({
          display_name: displayName,
          username,
          bio,
          role,
          avatar_url: pendingAvatarUrl,
          banner_url: pendingBannerUrl,
          role_details: roleDetails
        })
        .eq('id', session.user.id)
        .select('*')
        .single();
      if (error) throw error;

      cacheProfileForLegacyPages(data);
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
      window.localStorage.removeItem('atelier_current_user');
      window.localStorage.removeItem('atelierUser');
      window.localStorage.removeItem('atelierSessionInitialized');
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
  [elements.editDialog, elements.threadDialog].forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });
  });

  const posts = new Map([
    ['post-1', {
      id: 'post-1',
      title: 'Fast Fashion brands are greedy',
      date: 'Nov 14',
      body: 'dont you guys think fast fashion brands these are doing too much? like the skims advent calender was just not it they give low quality products and price them really high! we gotta do sth abt this',
      likes: 17,
      commentCount: 4,
      isLiked: false,
      comments: [
        { author: '@thriftthoughts', body: 'The overproduction is wild. I try to buy secondhand and keep things in rotation longer.' },
        { author: '@mendingmaven', body: 'Agreed. Repairing what we already own is one small way to push back.' }
      ]
    }],
    ['post-2', {
      id: 'post-2',
      title: 'i have a really bad stain on my white shirt!',
      date: 'Nov 9',
      body: 'i have an oil stain on my white shirt and i need it for a formal event tmrw, what do i do? please help!!!',
      likes: 589,
      commentCount: 15,
      isLiked: false,
      comments: [
        { author: '@threadfix', body: 'Put a little dish soap directly on the oil stain, gently work it in, and rinse with warm water before washing.' },
        { author: '@closetcare', body: 'Baking soda can help absorb the oil first. Let it sit, brush it off, then try dish soap.' },
        { author: '@mendandwear', body: 'Air-dry it after washing so you can check the stain before using heat.' }
      ]
    }]
  ]);
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

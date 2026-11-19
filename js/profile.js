const CLOUDINARY_CLOUD_NAME = 'lify0b3k';
const CLOUDINARY_UPLOAD_PRESET = 'atelier_unsigned';

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

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  showProfileToast('Uploading...', 'loading');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );
  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data && data.error && data.error.message;
    throw new Error(typeof errorMessage === 'string'
      ? errorMessage
      : 'Cloudinary could not upload this image.');
  }
  if (!data || typeof data.secure_url !== 'string' || !data.secure_url) {
    throw new Error('Cloudinary did not return a secure image URL.');
  }

  return data.secure_url;
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
    followButton: document.getElementById('profile-follow-button'),
    editButton: document.getElementById('open-profile-editor'),
    logoutButton: document.getElementById('profile-logout-button'),
    bannerEditButton: document.getElementById('edit-banner-button'),
    avatarEditButton: document.getElementById('edit-avatar-button'),
    bannerFileInput: document.getElementById('banner-file-input'),
    avatarFileInput: document.getElementById('avatar-file-input'),
    commentForm: document.getElementById('add-comment-form'),
    commentInput: document.getElementById('new-comment')
  };

  function normalizeRole(value) {
    if (typeof value !== 'string') {
      return 'Member';
    }
    const role = value.trim().toLowerCase();
    if (role === 'member / student') {
      return 'Member';
    }
    return supportedRoles.find((item) => item.toLowerCase() === role) || 'Member';
  }

  function loadProfile() {
    try {
      const saved = window.localStorage.getItem('atelierUser');
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
        name: storedProfile.displayName || storedProfile.name || defaultProfile.name,
        username: storedProfile.username || defaultProfile.username,
        bio: typeof storedProfile.bio === 'string' ? storedProfile.bio : defaultProfile.bio,
        role: normalizeRole(storedProfile.role),
        avatarUrl: typeof storedProfile.avatarUrl === 'string' ? storedProfile.avatarUrl : '',
        coverUrl: typeof storedProfile.coverUrl === 'string' ? storedProfile.coverUrl : '',
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
      const saved = JSON.parse(window.localStorage.getItem('atelierUser') || 'null');
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

  const viewerProfile = loadProfile();
  const viewerIsAuthenticated = hasAuthenticatedUser();
  const requestedUser = new URLSearchParams(window.location.search).get('user');
  const requestedHandle = normalizeHandle(requestedUser);
  const isPublicProfile = Boolean(requestedHandle);

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
  const publicHandle = isPublicProfile ? normalizeHandle(profile.username) : requestedHandle;

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
    elements.bannerFileInput.hidden = isPublicProfile;
    elements.avatarFileInput.hidden = isPublicProfile;
    elements.followButton.hidden = !isPublicProfile;
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
        if (!key || !key.startsWith('atelier_community_') || !key.endsWith('_posts')) {
          continue;
        }
        const saved = JSON.parse(window.localStorage.getItem(key) || '[]');
        if (Array.isArray(saved)) {
          allPosts.push(...saved);
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
    renderPublicPosts();
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      return;
    }
    try {
      const client = window.supabase.createClient(
        'https://sktkevlfxjppfpjmxguy.supabase.co',
        'sb_publishable_0jOs1sVk5nRJj1SY9VrgKw_Eoc08C0N'
      );
      const { data, error } = await client
        .from('community_posts')
        .select('id, author_name, author_handle, content, tags, image_url, likes, created_at')
        .eq('author_handle', `@${publicHandle}`)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) {
        throw error;
      }
      const posts = (data || []).map((row) => ({
        id: String(row.id),
        author: row.author_name,
        handle: row.author_handle,
        content: row.content,
        tags: Array.isArray(row.tags) ? row.tags : [],
        image_url: row.image_url,
        likes: Number(row.likes || 0),
        createdAt: row.created_at,
        timestamp: row.created_at
          ? new Date(row.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          : 'Recently shared'
      }));
      renderPublicPosts(posts);
    } catch (error) {
      console.warn('Public community posts could not be loaded from Supabase; showing posts saved in this browser.', error.message);
    }
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

  function saveProfile(nextProfile) {
    try {
      window.localStorage.setItem('atelierUser', JSON.stringify(nextProfile));
      return true;
    } catch (error) {
      console.error('Unable to save the Atelier profile to localStorage.', error);
      showProfileToast('Could not save your profile. Check browser storage and try again.', 'error');
      return false;
    }
  }

  renderProfile();
  renderFollowButton();
  if (isPublicProfile) {
    loadRemotePublicPosts();
  }

  document.getElementById('profile-logout-button').addEventListener('click', () => {
    try {
      window.localStorage.removeItem('atelierUser');
    } catch (error) {
      console.error('Unable to clear the Atelier user session.', error);
      showProfileToast('Could not log out. Please check your browser storage settings and try again.', 'error');
      return;
    }

    window.location.assign('login.html');
  });

  document.getElementById('open-profile-editor').addEventListener('click', () => {
    document.getElementById('edit-display-name').value = profile.name;
    document.getElementById('edit-username').value = profile.username;
    document.getElementById('edit-bio').value = profile.bio;
    document.getElementById('edit-role').value = profile.role;
    elements.editDialog.showModal();
  });

  const bannerInput = document.getElementById('banner-file-input');
  document.getElementById('edit-banner-button').addEventListener('click', () => {
    bannerInput.click();
  });

  elements.editForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(elements.editForm);
    const name = String(formData.get('displayName') || '').trim();
    let username = String(formData.get('username') || '').trim();
    const bio = String(formData.get('bio') || '').trim();
    const role = normalizeRole(String(formData.get('role') || 'Member'));

    if (!username.startsWith('@')) {
      username = `@${username}`;
    }
    if (!name || username === '@') {
      showProfileToast('Enter a display name and username.', 'error');
      return;
    }

    const nextProfile = {
      ...profile,
      name,
      displayName: name,
      username,
      bio,
      role
    };
    if (!saveProfile(nextProfile)) {
      return;
    }

    profile = nextProfile;
    renderProfile();
    elements.editDialog.close();
    showProfileToast('Profile updated.');
  });

  document.getElementById('edit-avatar-button').addEventListener('click', () => {
    document.getElementById('avatar-file-input').click();
  });

  async function uploadProfileImage(input, field, imageElement, fallbackElement) {
    const file = input.files && input.files[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      showProfileToast('Choose an image file to upload.', 'error');
      input.value = '';
      return;
    }

    const previousUrl = profile[field];
    let previewUrl = '';
    let keepPreviewUrl = false;
    try {
      previewUrl = URL.createObjectURL(file);
      imageElement.src = previewUrl;
      imageElement.hidden = false;
      fallbackElement.hidden = true;

      const secureUrl = await uploadToCloudinary(file);
      const nextProfile = { ...profile, [field]: secureUrl };
      if (!saveProfile(nextProfile)) {
        imageElement.src = previewUrl;
        imageElement.hidden = false;
        fallbackElement.hidden = true;
        keepPreviewUrl = true;
        return;
      }

      profile = nextProfile;
      imageElement.src = secureUrl;
      showProfileToast('Image updated.');
    } catch (error) {
      console.error('Unable to upload the profile image.', error);
      try {
        const dataUrl = await readFileAsDataUrl(file);
        const nextProfile = { ...profile, [field]: dataUrl };
        if (!saveProfile(nextProfile)) {
          imageElement.src = previewUrl || previousUrl || '';
          imageElement.hidden = !previewUrl && !previousUrl;
          fallbackElement.hidden = Boolean(previewUrl || previousUrl);
          keepPreviewUrl = Boolean(previewUrl);
          showProfileToast(`Image upload failed (${error.message}); the local fallback could not be saved.`, 'error');
          return;
        }

        profile = nextProfile;
        imageElement.src = dataUrl;
        imageElement.hidden = false;
        fallbackElement.hidden = true;
        showProfileToast(`Cloudinary upload failed; saved the image locally instead. ${error.message}`, 'error');
      } catch (fallbackError) {
        console.error('Unable to save a local profile image fallback.', fallbackError);
        imageElement.src = previewUrl || previousUrl || '';
        imageElement.hidden = !previewUrl && !previousUrl;
        fallbackElement.hidden = Boolean(previewUrl || previousUrl);
        keepPreviewUrl = Boolean(previewUrl);
        showProfileToast(`Cloudinary upload failed (${error.message}); local fallback failed (${fallbackError.message}).`, 'error');
      }
    } finally {
      if (previewUrl && !keepPreviewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      input.value = '';
    }
  }

  document.getElementById('avatar-file-input').addEventListener('change', (event) => {
    uploadProfileImage(
      event.currentTarget,
      'avatarUrl',
      elements.avatar,
      elements.avatarFallback
    );
  });
  document.getElementById('banner-file-input').addEventListener('change', (event) => {
    uploadProfileImage(
      event.currentTarget,
      'coverUrl',
      elements.cover,
      elements.coverFallback
    );
  });

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

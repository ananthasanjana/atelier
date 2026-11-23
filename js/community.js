document.addEventListener('DOMContentLoaded', () => {
  const SEED_POSTS = window.ATELIER_COMMUNITY_POSTS || [];
  const SUGGESTIONS = window.ATELIER_COMMUNITY_MAKERS || [];
  const FORUM_TOPICS = ['Mending Tips', 'Thrift Hauls', 'Upcycling', 'Fabric Care'];
  const FORUM_SEEDS = [
    {
      id: 'forum-lehenga',
      title: 'Where to get heavy lehenga alterations in Banjara Hills?',
      author: 'Aarohi',
      handle: '@aarohiwears',
      location: 'BANJARA HILLS',
      tags: ['ALTERATIONS', 'OCCASION WEAR'],
      replies: [
        { author: '@diadesigns', body: 'Try rang boutique—they did a beautiful fitting for my cousin.' },
        { author: '@sanj', body: 'The tailor directory has a few verified studios nearby too!' },
        { author: '@threadandthimble', body: 'We can help with structured occasion-wear alterations.' }
      ]
    },
    {
      id: 'forum-frayed-denim',
      title: 'My favorite denim is fraying at the knee. Patch it or make it a feature?',
      author: 'Meera',
      handle: '@meeramends',
      location: 'JUBILEE HILLS',
      tags: ['DENIM REPAIR', 'VISIBLE MENDING'],
      replies: [
        { author: '@rohanmakes', body: 'A contrasting sashiko patch will make it stronger and one of a kind.' }
      ]
    }
  ];

  const elements = {
    profileAvatar: document.getElementById('community-profile-avatar'),
    profileName: document.getElementById('community-profile-name'),
    profileHandle: document.getElementById('community-profile-handle'),
    profileRole: document.getElementById('community-profile-role'),
    profileSummary: document.getElementById('community-profile-summary'),
    profileFollowingCount: document.getElementById('community-following-count'),
    profileFollowerCount: document.getElementById('community-follower-count'),
    memberSearch: document.getElementById('community-member-search-input'),
    memberSearchStatus: document.getElementById('community-member-search-status'),
    memberSearchResults: document.getElementById('community-member-search-results'),
    newPostButton: document.getElementById('community-new-post'),
    loginLink: document.getElementById('community-login-link'),
    loginPrompt: document.getElementById('community-login-prompt'),
    tabs: document.querySelectorAll('.community-tab'),
    title: document.getElementById('community-title'),
    filters: document.querySelectorAll('[data-filter]'),
    feed: document.getElementById('community-feed'),
    suggestions: document.getElementById('community-suggestions'),
    composer: document.getElementById('community-composer'),
    composerTopic: document.getElementById('community-post-topic'),
    composerText: document.getElementById('community-post-text'),
    imageInput: document.getElementById('community-image-input'),
    imageLabel: document.getElementById('community-image-label'),
    previewWrap: document.getElementById('community-composer-preview'),
    previewImage: document.getElementById('community-composer-image'),
    toast: document.getElementById('community-toast'),
    questionDialog: document.getElementById('community-question-dialog'),
    questionForm: document.getElementById('community-question-form'),
    questionInput: document.getElementById('community-question-input')
  };
  let profile = readProfile();
  let activeTab = 'home';
  let activeFilter = 'recent';
  let composerOpen = false;
  let selectedFile = null;
  let previewUrl = '';
  let toastTimer = 0;
  let memberSearchTimer = 0;
  let memberSearchRequest = 0;
  let supabaseClient = null;
  let currentUserId = '';
  const profileIdsByHandle = new Map();
  const authorProfilesById = new Map();
  const authorProfilesByHandle = new Map();
  const followingUserIds = new Set();
  const pendingFollowHandles = new Set();
  let suggestionProfilesLoaded = false;
  let followDataPromise = Promise.resolve();
  let commentsChannel = null;
  const remoteCommentsByPostId = new Map();
  const loadedCommentPostIds = new Set();
  let isLoggedIn = Boolean(profile);
  const storedPosts = readJson(getKey('posts'), []);
  const storedLikes = readJson(getKey('likes'), []);
  const storedSaved = readJson(getKey('saved'), []);
  const storedDeleted = readJson(getKey('deleted'), []);
  const storedFollowing = readJson(getKey('following'), isLoggedIn ? ['@diadesigns', '@rohanmakes'] : []);
  const localPosts = Array.isArray(storedPosts) ? storedPosts : [];
  const localComments = readJson(getKey('comments'), {});
  const likedIds = new Set(Array.isArray(storedLikes) ? storedLikes : []);
  const savedIds = new Set(Array.isArray(storedSaved) ? storedSaved : []);
  const deletedIds = new Set(Array.isArray(storedDeleted) ? storedDeleted.map(String) : []);
  const following = new Set(Array.isArray(storedFollowing) ? storedFollowing.map(normalizeHandle) : []);
  const deletingIds = new Set();
  const forumReplies = readJson(getKey('forum-replies'), {});
  const storedForumThreads = readJson(getKey('forum-threads'), []);
  const localForumThreads = Array.isArray(storedForumThreads) ? storedForumThreads : [];
  let ownHandle = profile ? profile.username : '';

  window.atelierCommunityState = { activeTab, activeFilter };

  function readProfile() {
    try {
      if (!window.atelierSupabase) return null;
      const saved = window.atelierSupabase.readCachedProfile();
      if (!saved || !saved.id) return null;
      return {
        id: String(saved.id),
        name: String(saved.display_name || saved.username),
        username: normalizeHandle(saved.username),
        role: /tailor/i.test(String(saved.role || '')) ? 'Tailor' : 'Member',
        avatarUrl: String(saved.avatar_url || ''),
        followingCount: 0,
        followersCount: 0
      };
    } catch (error) {
      console.error('Unable to read the saved community profile.', error);
      return null;
    }
  }

  function rememberAuthorProfile(row) {
    if (!row || typeof row !== 'object') return;
    const id = String(row.id || row.user_id || row.author_id || '');
    const handleValue = row.username || row.author_username || row.author_handle || row.handle;
    const existing = (id && authorProfilesById.get(id))
      || (handleValue && authorProfilesByHandle.get(normalizeHandle(handleValue)));
    const handle = handleValue ? normalizeHandle(handleValue) : (existing && existing.handle) || '';
    const avatarValue = Object.prototype.hasOwnProperty.call(row, 'avatar_url')
      ? row.avatar_url
      : Object.prototype.hasOwnProperty.call(row, 'avatarUrl')
        ? row.avatarUrl
        : existing && existing.avatarUrl;
    const authorProfile = {
      id: id || (existing && existing.id) || '',
      handle,
      name: String(row.full_name || row.display_name || row.name || row.author_name || (existing && existing.name) || handle || 'Atelier member'),
      avatarUrl: String(avatarValue || ''),
      role: String(row.role || (existing && existing.role) || '')
    };
    if (authorProfile.id) authorProfilesById.set(authorProfile.id, authorProfile);
    if (authorProfile.handle) authorProfilesByHandle.set(authorProfile.handle, authorProfile);
  }

  function findAuthorProfile(userId, handle) {
    const id = String(userId || '');
    if (id && authorProfilesById.has(id)) return authorProfilesById.get(id);
    const normalizedHandle = handle ? normalizeHandle(handle) : '';
    return normalizedHandle ? authorProfilesByHandle.get(normalizedHandle) || null : null;
  }

  function resolveAuthorAvatar(userId, handle) {
    const authorProfile = findAuthorProfile(userId, handle);
    return authorProfile ? authorProfile.avatarUrl : '';
  }

  function normalizeHandle(value) {
    const text = String(value || '').trim();
    const username = text.startsWith('@') ? text.slice(1) : (text.includes('@') ? text.split('@')[0] : text);
    return `@${username.toLowerCase().replace(/[^a-z0-9._-]+/g, '') || 'atelier-member'}`;
  }

  if (profile) {
    rememberAuthorProfile({
      id: profile.id,
      username: profile.username,
      name: profile.name,
      avatar_url: profile.avatarUrl,
      role: profile.role
    });
  }

  function getKey(suffix) {
    const key = normalizeHandle(profile && profile.username ? profile.username : '@guest')
      .toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_-]/g, '-');
    return `atelier_community_${key}_${suffix}`;
  }

  function readJson(key, fallback) {
    try {
      const value = window.localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.error(`Unable to read community data for ${key}.`, error);
      return fallback;
    }
  }

  function persist(key, value) {
    try {
      window.localStorage.setItem(getKey(key), JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Unable to save community data for ${key}.`, error);
      showToast('Could not save this change in your browser storage.', 'error');
      return false;
    }
  }

  function showToast(message, kind) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.dataset.kind = kind || 'info';
    elements.toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => elements.toast.classList.remove('is-visible'), 3600);
  }

  function requireLogin() {
    if (isLoggedIn) {
      return true;
    }
    showToast('Log in to post and connect with makers.');
    return false;
  }

  function makeAvatar(name, image, extraClass) {
    const avatar = document.createElement('span');
    avatar.className = `community-avatar ${extraClass || ''}`.trim();
    avatar.setAttribute('aria-hidden', 'true');
    renderAvatarContents(avatar, name, image);
    return avatar;
  }

  function renderAvatarContents(avatar, name, image) {
    const authorName = String(name || '').trim() || 'Atelier member';
    const initial = authorName.replace(/^@/, '').trim().charAt(0).toUpperCase() || '?';
    const imageUrl = String(image || '');
    const currentImage = avatar.querySelector('img');
    avatar.dataset.authorName = authorName;

    if (!imageUrl || avatar.dataset.failedAvatar === imageUrl) {
      avatar.replaceChildren();
      avatar.textContent = initial;
      return;
    }
    if (currentImage && currentImage.getAttribute('src') === imageUrl) return;

    avatar.dataset.failedAvatar = '';
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = authorName;
    img.loading = 'lazy';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '50%';
    img.addEventListener('error', () => {
      if (img.parentElement !== avatar) return;
      avatar.dataset.failedAvatar = imageUrl;
      img.remove();
      avatar.textContent = initial;
    }, { once: true });
    avatar.replaceChildren(img);
  }

  function makeAuthorAvatar(name, userId, handle, extraClass) {
    const avatar = makeAvatar(
      name,
      resolveAuthorAvatar(userId, handle),
      extraClass
    );
    avatar.dataset.authorAvatar = '';
    if (userId) avatar.dataset.authorId = String(userId);
    if (handle) avatar.dataset.authorHandle = normalizeHandle(handle);
    return avatar;
  }

  function refreshRenderedAuthorAvatars() {
    document.querySelectorAll('.community-avatar[data-author-avatar]').forEach((avatar) => {
      renderAvatarContents(
        avatar,
        avatar.dataset.authorName,
        resolveAuthorAvatar(
          avatar.dataset.authorId,
          avatar.dataset.authorHandle
        )
      );
    });
  }

  function profileHref(handle) {
    const username = String(handle || '').trim().replace(/^@/, '');
    return `profile.html?user=${encodeURIComponent(username)}`;
  }

  function memberProfileHref(member) {
    const username = String(member.username || '').trim().replace(/^@/, '');
    return username
      ? profileHref(username)
      : `profile.html?id=${encodeURIComponent(String(member.id || ''))}`;
  }

  function makeProfileLink(label, handle, className) {
    const link = document.createElement('a');
    link.className = className || 'community-profile-link';
    link.href = profileHref(handle);
    link.textContent = label;
    return link;
  }

  function initializeProfile() {
    elements.profileSummary.hidden = !isLoggedIn;
    elements.loginLink.hidden = isLoggedIn;
    elements.loginPrompt.hidden = isLoggedIn;
    elements.newPostButton.hidden = !isLoggedIn;
    elements.composer.hidden = !isLoggedIn || !composerOpen;
    document.querySelectorAll('[data-auth-only]').forEach((tab) => {
      tab.hidden = !isLoggedIn;
    });
    if (!isLoggedIn) {
      return;
    }
    elements.profileName.textContent = profile.name;
    elements.profileHandle.textContent = profile.username;
    elements.profileRole.textContent = profile.role;
    elements.profileFollowingCount.textContent = String(profile.followingCount);
    elements.profileFollowerCount.textContent = String(profile.followersCount);
    elements.profileAvatar.replaceWith(makeAvatar(
      profile.name,
      profile.avatarUrl || 'assets/profile-avatar-fallback.svg',
      'community-avatar--profile'
    ));
    elements.profileAvatar = document.querySelector('.community-avatar--profile');
  }

  function refreshProfileAvatar() {
    const savedProfile = readProfile();
    profile = savedProfile;
    isLoggedIn = Boolean(savedProfile);
    ownHandle = profile ? profile.username : '';
    if (profile) {
      rememberAuthorProfile({
        id: profile.id,
        username: profile.username,
        name: profile.name,
        avatar_url: profile.avatarUrl,
        role: profile.role
      });
    }
    initializeProfile();
    refreshRenderedAuthorAvatars();
    if (profile && supabaseClient) {
      refreshCurrentUserProfileAvatar();
    }
  }

  function initializeSupabase() {
    if (!window.atelierSupabase) {
      console.info('Supabase is unavailable; the community will use the local feed.');
      return;
    }
    try {
      supabaseClient = window.atelierSupabase.getClient();
    } catch (error) {
      console.error('Unable to initialize the community Supabase client.', error);
    }
  }

  async function fetchAuthorProfiles(column, values) {
    const selections = [
      'id, username, display_name, avatar_url, role',
      'id, username, full_name, avatar_url, role',
      'id, username, avatar_url, role'
    ];
    let lastError = null;
    for (const fields of selections) {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select(fields)
        .in(column, values);
      if (!error) return data || [];
      lastError = error;
      const message = `${error.message || ''} ${error.details || ''}`.toLowerCase();
      const missingNameColumn = ['42703', 'PGRST204'].includes(error.code)
        && (message.includes('full_name') || message.includes('display_name'));
      if (!missingNameColumn) throw error;
    }
    throw lastError || new Error('Could not load Community author profiles.');
  }

  async function loadAuthorProfiles(rows) {
    if (!supabaseClient || !Array.isArray(rows) || !rows.length) return;
    const authorIds = new Set();
    rows.forEach((row) => {
      if (!row || typeof row !== 'object') return;
      const id = row.user_id || row.author_id;
      if (id) authorIds.add(String(id));
    });

    const errors = [];
    const loadedIds = new Set();
    if (authorIds.size) {
      try {
        (await fetchAuthorProfiles('id', [...authorIds])).forEach((row) => {
          rememberAuthorProfile(row);
          if (row.id) loadedIds.add(String(row.id));
        });
      } catch (error) {
        errors.push(error);
      }
    }

    const authorHandles = new Set();
    rows.forEach((row) => {
      if (!row || typeof row !== 'object') return;
      const id = String(row.user_id || row.author_id || '');
      const handle = row.author_username
        || row.author_handle
        || row.username
        || row.handle
        || (String(row.author || '').trim().startsWith('@') ? row.author : '');
      if (
        handle
        && !String(handle).startsWith('@atelier-member')
        && (!id || !loadedIds.has(id))
      ) {
        authorHandles.add(normalizeHandle(handle).slice(1));
      }
    });
    if (authorHandles.size) {
      try {
        (await fetchAuthorProfiles('username', [...authorHandles])).forEach(rememberAuthorProfile);
      } catch (error) {
        errors.push(error);
      }
    }

    if (errors.length) {
      console.error('Community author profiles could not be fully loaded.', errors);
    }
    refreshRenderedAuthorAvatars();
  }

  async function refreshCurrentUserProfileAvatar() {
    if (!supabaseClient) return;
    try {
      const { data, error } = await supabaseClient.auth.getSession();
      if (error) throw error;
      const user = data.session && data.session.user;
      if (!user || !user.id) return;
      await loadAuthorProfiles([{ user_id: user.id }]);
    } catch (error) {
      console.error('The current Community user profile picture could not be refreshed.', error);
    }
  }

  function makeActionButton(action, label, icon, active) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `community-action${active ? ' is-active' : ''}`;
    button.dataset.action = action;
    if (active) {
      button.setAttribute('aria-pressed', 'true');
    } else if (action === 'like' || action === 'save') {
      button.setAttribute('aria-pressed', 'false');
    }
    const glyph = document.createElement('span');
    glyph.className = 'community-action__icon';
    glyph.setAttribute('aria-hidden', 'true');
    if (icon === 'bookmark' || icon === 'comment') {
      glyph.append(makeIcon(icon));
    } else {
      glyph.textContent = icon;
    }
    const text = document.createElement('span');
    text.textContent = label;
    button.append(glyph, text);
    return button;
  }

  function makeIcon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('role', 'presentation');
    svg.classList.add('community-inline-icon');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', name === 'bookmark'
      ? 'M6.5 3.75h11a1 1 0 0 1 1 1v15.5l-6.5-4-6.5 4V4.75a1 1 0 0 1 1-1z'
      : 'M20.25 11.5a8.25 8.25 0 0 1-12.4 7.15L3 20l1.3-4.1A8.25 8.25 0 1 1 20.25 11.5Z');
    svg.append(path);
    return svg;
  }

  function createPostCard(post) {
    const article = document.createElement('article');
    article.className = 'community-post';
    article.dataset.postId = post.id;

    const head = document.createElement('header');
    head.className = 'community-post__head';
    const avatarLink = document.createElement('a');
    avatarLink.className = 'community-post__avatar-link';
    avatarLink.href = profileHref(post.handle);
    avatarLink.setAttribute('aria-label', `View ${post.author}'s profile`);
    const authorProfile = findAuthorProfile(post.userId, post.handle);
    avatarLink.append(makeAuthorAvatar(
      authorProfile ? authorProfile.name : post.author,
      post.userId,
      post.handle,
      'community-avatar--small'
    ));
    head.append(avatarLink);
    const authorBlock = document.createElement('div');
    authorBlock.className = 'community-post__author';
    const authorName = document.createElement('strong');
    authorName.append(makeProfileLink(post.author, post.handle, 'community-profile-link'));
    const handle = makeProfileLink(post.handle, post.handle, 'community-profile-link community-profile-link--handle');
    authorBlock.append(authorName, handle);
    const timestamp = document.createElement('time');
    timestamp.textContent = post.timestamp || 'Just now';
    const saveButton = makeActionButton('save', savedIds.has(post.id) ? 'Saved' : 'Save', 'bookmark', savedIds.has(post.id));
    saveButton.classList.add('community-post__save');
    head.append(authorBlock, timestamp, saveButton);
    if (isLoggedIn && normalizeHandle(post.handle) === ownHandle) {
      const deleteButton = makeActionButton('delete', 'Delete', '×', false);
      deleteButton.classList.add('community-post__delete');
      deleteButton.setAttribute('aria-label', `Delete your post: ${String(post.content || '').slice(0, 60)}`);
      head.append(deleteButton);
    }
    article.append(head);

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

    const content = document.createElement('p');
    content.className = 'community-post__copy';
    content.textContent = post.content;
    article.append(content);

    if (Array.isArray(post.images) && post.images.length) {
      const gallery = document.createElement('div');
      gallery.className = `community-post__gallery${post.images.length > 1 ? ' community-post__gallery--process' : ''}`;
      post.images.slice(0, 3).forEach((item) => {
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
      article.append(gallery);
    }

    const counts = document.createElement('div');
    counts.className = 'community-post__counts';
    const likes = document.createElement('span');
    likes.dataset.likeCount = '';
    const likeNumber = Number(post.likes || 0) + (likedIds.has(post.id) ? 1 : 0);
    likes.textContent = `♥ ${likeNumber}`;
    const comments = document.createElement('span');
    comments.dataset.commentCount = '';
    comments.append(makeIcon('comment'), document.createTextNode(String(getComments(post).length)));
    counts.append(likes, comments);
    article.append(counts);

    const actions = document.createElement('div');
    actions.className = 'community-post__actions';
    actions.append(
      makeActionButton('like', likedIds.has(post.id) ? 'Liked' : 'Like', '♡', likedIds.has(post.id)),
      makeActionButton('comment', 'Comment', 'comment', false)
    );
    article.append(actions);

    const commentPanel = document.createElement('div');
    commentPanel.className = 'community-comments';
    commentPanel.hidden = true;
    commentPanel.dataset.comments = '';
    article.append(commentPanel);
    renderComments(post, commentPanel);
    return article;
  }

  function getComments(post) {
    const extra = Array.isArray(localComments[post.id]) ? localComments[post.id] : [];
    const remote = remoteCommentsByPostId.get(String(post.id)) || [];
    return [...(Array.isArray(post.comments) ? post.comments : []), ...remote, ...extra];
  }

  function renderComments(post, panel) {
    panel.replaceChildren();
    const list = document.createElement('ul');
    list.className = 'community-comments__list';
    getComments(post).forEach((comment) => {
      const item = document.createElement('li');
      const handleValue = comment.handle
        || (String(comment.author || '').startsWith('@') ? comment.author : '');
      const handle = handleValue ? normalizeHandle(handleValue) : '';
      const userId = String(comment.userId || comment.user_id || '');
      const authorProfile = findAuthorProfile(userId, handle);
      const avatarName = authorProfile
        ? authorProfile.name
        : String(comment.authorName || comment.author || 'Atelier member');
      const avatar = makeAuthorAvatar(
        avatarName,
        userId,
        handle,
        'community-avatar--comment'
      );
      if (handle) {
        const avatarLink = document.createElement('a');
        avatarLink.className = 'community-comments__avatar-link';
        avatarLink.href = profileHref(handle);
        avatarLink.setAttribute('aria-label', `View ${avatarName}'s profile`);
        avatarLink.append(avatar);
        item.append(avatarLink);
      } else {
        item.append(avatar);
      }

      const content = document.createElement('div');
      content.className = 'community-comments__content';
      const author = document.createElement('strong');
      if (handle) {
        author.append(makeProfileLink(comment.author || handle, handle, 'community-profile-link'));
      } else {
        author.textContent = comment.authorName || comment.author || 'Atelier member';
      }
      const body = document.createElement('span');
      body.textContent = comment.body;
      content.append(author, body);
      item.append(content);
      list.append(item);
    });
    const form = document.createElement('form');
    form.className = 'community-comment-form';
    form.dataset.commentForm = '';
    const input = document.createElement('input');
    input.name = 'comment';
    input.type = 'text';
    input.maxLength = 500;
    input.required = true;
    input.placeholder = 'Add a kind thought…';
    input.setAttribute('aria-label', 'Write a comment');
    const button = document.createElement('button');
    button.type = 'submit';
    button.textContent = 'Reply';
    form.append(input, button);
    panel.append(list, form);
  }

  function createForumCard(thread) {
    const article = document.createElement('article');
    article.className = 'community-forum-thread';
    article.dataset.threadId = thread.id;
    const top = document.createElement('div');
    top.className = 'community-forum-thread__top';
    const avatarLink = document.createElement('a');
    avatarLink.className = 'community-post__avatar-link';
    avatarLink.href = profileHref(thread.handle);
    avatarLink.setAttribute('aria-label', `View ${thread.author}'s profile`);
    avatarLink.append(makeAvatar(thread.author, '', 'community-avatar--small'));
    top.append(avatarLink);
    const who = document.createElement('div');
    const author = document.createElement('strong');
    author.append(makeProfileLink(thread.author, thread.handle, 'community-profile-link'));
    const handle = makeProfileLink(thread.handle, thread.handle, 'community-profile-link community-profile-link--handle');
    who.append(author, handle);
    top.append(who);
    const location = document.createElement('span');
    location.className = 'community-post__tag';
    location.textContent = thread.location;
    top.append(location);
    const title = document.createElement('h3');
    title.textContent = thread.title;
    const tags = document.createElement('div');
    tags.className = 'community-post__tags';
    thread.tags.forEach((value) => {
      const tag = document.createElement('span');
      tag.textContent = value;
      tags.append(tag);
    });
    const replies = [...thread.replies, ...(forumReplies[thread.id] || [])];
    const controls = document.createElement('div');
    controls.className = 'community-forum-thread__controls';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.dataset.action = 'thread-replies';
    toggle.textContent = `${replies.length} ${replies.length === 1 ? 'reply' : 'replies'} · Join the conversation`;
    const form = document.createElement('form');
    form.className = 'community-comment-form';
    form.dataset.forumReplyForm = '';
    form.hidden = true;
    const input = document.createElement('input');
    input.name = 'reply';
    input.type = 'text';
    input.maxLength = 500;
    input.required = true;
    input.placeholder = 'Share a tip or recommendation…';
    input.setAttribute('aria-label', 'Write a forum reply');
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.textContent = 'Reply';
    form.append(input, submit);
    controls.append(toggle);
    article.append(top, title, tags, controls);
    replies.forEach((reply) => {
      const item = document.createElement('p');
      item.className = 'community-forum-thread__reply';
      const name = document.createElement('strong');
      if (String(reply.author || '').startsWith('@')) {
        name.append(makeProfileLink(reply.author, reply.author, 'community-profile-link'));
      } else {
        name.textContent = reply.author;
      }
      item.append(name, document.createTextNode(` ${reply.body}`));
      article.append(item);
    });
    article.append(form);
    return article;
  }

  function renderSuggestions() {
    elements.suggestions.replaceChildren();
    SUGGESTIONS.forEach((suggestion) => {
      const card = document.createElement('article');
      card.className = 'community-suggestion';
      const profileLink = document.createElement('a');
      profileLink.className = 'community-suggestion__profile';
      profileLink.href = profileHref(suggestion.handle);
      profileLink.setAttribute('aria-label', `View ${suggestion.name}'s profile`);
      profileLink.append(makeAvatar(suggestion.initials, suggestion.avatar || '', 'community-avatar--suggestion'));
      const details = document.createElement('div');
      details.className = 'community-suggestion__details';
      const name = document.createElement('strong');
      name.textContent = suggestion.name;
      const place = document.createElement('span');
      place.textContent = suggestion.location;
      details.append(name, place);
      if (suggestion.verified) {
        const badge = document.createElement('span');
        badge.className = 'community-verified';
        badge.textContent = 'Verified';
        details.append(badge);
      }
      profileLink.append(details);
      const handle = normalizeHandle(suggestion.handle);
      const profileId = profileIdsByHandle.get(handle) || '';
      const followed = supabaseClient
        ? Boolean(profileId && followingUserIds.has(profileId))
        : following.has(handle);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `community-follow${followed ? ' is-following' : ''}`;
      button.dataset.follow = handle;
      button.setAttribute('aria-pressed', String(followed));
      const isSelf = Boolean(currentUserId && profileId === currentUserId);
      const profileUnavailable = Boolean(supabaseClient && suggestionProfilesLoaded && !profileId);
      button.disabled = pendingFollowHandles.has(handle) || isSelf || profileUnavailable;
      button.textContent = isSelf
        ? 'You'
        : profileUnavailable
          ? 'Not on Atelier'
          : followed ? 'Following ✓' : 'Follow';
      card.append(profileLink, button);
      elements.suggestions.append(card);
    });
  }

  function setMemberSearchStatus(message) {
    elements.memberSearchStatus.textContent = message;
    elements.memberSearchStatus.hidden = !message;
  }

  function renderMemberSearchResults(members, statusMessage) {
    elements.memberSearchResults.replaceChildren();
    elements.memberSearchResults.hidden = !members.length;
    setMemberSearchStatus(statusMessage);

    members.forEach((member) => {
      const card = document.createElement('article');
      card.className = 'community-member-result';
      card.setAttribute('role', 'listitem');
      const avatar = makeAvatar(member.name, member.avatar, 'community-avatar--member-search');
      const details = document.createElement('div');
      details.className = 'community-member-result__details';
      const name = document.createElement('strong');
      name.textContent = member.name;
      const handle = document.createElement('span');
      handle.className = 'community-member-result__handle';
      handle.textContent = member.handle;
      const badge = document.createElement('span');
      badge.className = `community-member-role${member.role === 'Tailor' ? ' community-member-role--tailor' : ''}`;
      badge.textContent = member.role;
      details.append(name, handle, badge);
      const link = document.createElement('a');
      link.className = 'community-member-result__link';
      link.href = memberProfileHref(member);
      link.textContent = 'View Profile';
      card.append(avatar, details, link);
      elements.memberSearchResults.append(card);
    });
  }

  function mapSearchProfile(row) {
    const username = String(row.username || '').trim().replace(/^@/, '');
    return {
      id: row.id || '',
      username,
      handle: username ? normalizeHandle(username) : '@atelier-member',
      name: String(row.full_name || row.display_name || row.name || username || 'Atelier member'),
      avatar: String(row.avatar_url || row.avatarUrl || ''),
      role: /tailor/i.test(String(row.role || '')) ? 'Tailor' : 'Member'
    };
  }

  function searchPostAuthors(query) {
    const term = query.toLowerCase();
    const suggestionsByHandle = new Map(
      SUGGESTIONS.map((suggestion) => [normalizeHandle(suggestion.handle), suggestion])
    );
    const membersByHandle = new Map();
    mergePosts(window.atelierCommunityRemotePosts || []).forEach((post) => {
      const handle = normalizeHandle(post.handle || post.author);
      const suggestion = suggestionsByHandle.get(handle);
      const name = String(post.author || handle);
      if (!`${name} ${handle}`.toLowerCase().includes(term) || membersByHandle.has(handle)) return;
      const isTailor = Boolean(
        (suggestion && suggestion.verified)
        || (profile && profile.username === handle && profile.role === 'Tailor')
      );
      membersByHandle.set(handle, {
        id: post.userId || '',
        username: handle.replace(/^@/, ''),
        handle,
        name,
        avatar: post.avatar || (suggestion && suggestion.avatar) || '',
        role: isTailor ? 'Tailor' : 'Member'
      });
    });
    return [...membersByHandle.values()];
  }

  async function searchMembers(query, requestId) {
    if (!supabaseClient) {
      renderMemberSearchResults(
        searchPostAuthors(query),
        'Search is offline; showing matching post authors.'
      );
      return;
    }

    try {
      const pattern = `%${query.replace(/[%_]/g, '\\$&')}%`;
      const [usernameResult, displayNameResult] = await Promise.all([
        supabaseClient.from('profiles').select('*').ilike('username', pattern).limit(20),
        supabaseClient.from('profiles').select('*').ilike('display_name', pattern).limit(20)
      ]);
      if (requestId !== memberSearchRequest) return;
      if (usernameResult.error) throw usernameResult.error;

      let rows = [...(usernameResult.data || [])];
      if (displayNameResult.error) {
        console.info('The profiles table has no searchable display_name field; trying full_name.');
        const fullNameResult = await supabaseClient
          .from('profiles')
          .select('*')
          .ilike('full_name', pattern)
          .limit(20);
        if (requestId !== memberSearchRequest) return;
        if (fullNameResult.error) throw fullNameResult.error;
        rows = rows.concat(fullNameResult.data || []);
      } else {
        rows = rows.concat(displayNameResult.data || []);
      }

      const uniqueMembers = new Map();
      rows.map(mapSearchProfile).forEach((member) => {
        const key = member.id || member.handle;
        if (!uniqueMembers.has(key)) uniqueMembers.set(key, member);
      });
      const members = [...uniqueMembers.values()];
      renderMemberSearchResults(
        members,
        members.length ? '' : 'No members or tailors found. Try another name or handle.'
      );
    } catch (error) {
      if (requestId !== memberSearchRequest) return;
      console.error('Community member search failed; showing matching post authors.', error);
      renderMemberSearchResults(
        searchPostAuthors(query),
        'Member search is unavailable; showing matching post authors instead.'
      );
    }
  }

  function onMemberSearchInput() {
    window.clearTimeout(memberSearchTimer);
    const query = elements.memberSearch.value.trim();
    const requestId = ++memberSearchRequest;
    if (!query) {
      elements.memberSearchResults.replaceChildren();
      elements.memberSearchResults.hidden = true;
      setMemberSearchStatus('');
      return;
    }
    setMemberSearchStatus('Searching members and tailors…');
    elements.memberSearchResults.replaceChildren();
    elements.memberSearchResults.hidden = true;
    memberSearchTimer = window.setTimeout(() => searchMembers(query, requestId), 250);
  }

  function mergePosts(remotePosts) {
    const byId = new Map();
    const fallbackPosts = remotePosts.length ? [] : (localPosts.length ? localPosts : SEED_POSTS);
    fallbackPosts.forEach((post) => byId.set(String(post.id), post));
    remotePosts.forEach((post) => byId.set(post.id, post));
    return [...byId.values()].filter((post) => !deletedIds.has(String(post.id))).sort((first, second) => {
      return new Date(second.createdAt || 0).getTime() - new Date(first.createdAt || 0).getTime();
    });
  }

  function matchesTab(post) {
    if (activeTab === 'friends') {
      return !post.forumTopic && following.has(normalizeHandle(post.handle));
    }
    if (activeTab === 'saved') {
      return savedIds.has(post.id);
    }
    if (activeTab === 'my-posts') {
      return normalizeHandle(post.handle) === ownHandle;
    }
    if (activeTab === 'home') {
      return !post.forumTopic;
    }
    return true;
  }

  function renderFeed() {
    elements.title.textContent = activeTab === 'forums'
      ? 'Style Forums — Q&A'
      : activeTab === 'saved'
        ? 'Saved Posts'
        : activeTab === 'friends'
          ? 'Friends Feed'
          : activeTab === 'my-posts'
            ? 'My Posts'
          : 'Community feed';
    document.querySelector('.community-filters').hidden = activeTab === 'forums';
    elements.composer.hidden = !isLoggedIn || !composerOpen;
    elements.loginPrompt.hidden = isLoggedIn;
    elements.feed.replaceChildren();

    if (activeTab === 'forums') {
      const intro = document.createElement('p');
      intro.className = 'community-feed-intro';
      intro.textContent = 'Good fixes start with a good question. Share what you are mending, making, or trying to find.';
      const askButton = document.createElement('button');
      askButton.type = 'button';
      askButton.className = 'community-ask-button';
      askButton.textContent = isLoggedIn ? '+ Start a thread' : 'Log in to start a thread';
      askButton.addEventListener('click', () => {
        if (isLoggedIn) {
          elements.questionDialog.showModal();
        } else {
          window.location.assign('login.html');
        }
      });
      elements.feed.append(
        intro,
        askButton,
        ...[...localForumThreads, ...FORUM_SEEDS].map(createForumCard)
      );
      mergePosts(window.atelierCommunityRemotePosts || [])
        .filter((post) => post.forumTopic)
        .forEach((post) => elements.feed.append(createPostCard(post)));
      return;
    }

    const posts = mergePosts(window.atelierCommunityRemotePosts || []);
    let visible = posts.filter(matchesTab);
    if (activeFilter === 'friends') {
      visible = visible.filter((post) => following.has(post.handle));
    }
    if (!visible.length) {
      const empty = document.createElement('div');
      empty.className = 'community-empty-card';
      const text = document.createElement('p');
      text.textContent = activeTab === 'saved'
        ? 'No saved posts yet. Tap the bookmark on a post to keep a good idea close.'
        : activeTab === 'my-posts'
          ? 'Your shared posts will appear here.'
          : activeFilter === 'friends' && !isLoggedIn
            ? 'Log in to follow makers and build your Friends feed.'
            : 'No posts in this view yet. Be the first to share a repair, a question, or a fresh idea.';
      empty.append(text);
      elements.feed.append(empty);
      return;
    }
    visible.forEach((post) => elements.feed.append(createPostCard(post)));
  }

  function getFallbackAuthorRows() {
    const posts = localPosts.length ? localPosts : SEED_POSTS;
    return posts.flatMap((post) => [
      {
        user_id: post.userId || post.user_id || '',
        author_handle: post.handle || post.author_handle || ''
      },
      ...(Array.isArray(post.comments) ? post.comments.map((comment) => ({
        user_id: comment.userId || comment.user_id || '',
        author_handle: comment.handle || comment.author_handle || comment.author || ''
      })) : [])
    ]);
  }

  async function loadRemotePosts() {
    if (!supabaseClient) {
      return;
    }
    try {
      const { data, error } = await supabaseClient
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(40);
      if (error) {
        throw error;
      }
      const rows = data || [];
      await loadAuthorProfiles([...rows, ...getFallbackAuthorRows()]);
      window.atelierCommunityRemotePosts = rows.map((row) => {
        const userId = String(row.user_id || row.author_id || '');
        const handle = normalizeHandle(row.author_username || row.author_handle || row.username);
        const authorProfile = findAuthorProfile(userId, handle);
        return {
          id: String(row.id),
          userId,
          author: row.author_name || (authorProfile && authorProfile.name) || 'Atelier member',
          handle,
          avatar: resolveAuthorAvatar(userId, handle),
          content: row.content || '',
          tags: Array.isArray(row.tags) ? row.tags : [],
          forumTopic: forumTopicFromRow(row),
          likes: Number(row.likes || 0),
          comments: [],
          upcycled: Boolean(row.upcycled),
          createdAt: row.created_at,
          timestamp: formatTimestamp(row.created_at),
          images: row.image_url ? [{ src: row.image_url, alt: 'Image shared by the community' }] : []
        };
      });
      await loadRemoteComments();
      subscribeToComments();
      renderFeed();
    } catch (error) {
      console.error('Community posts could not be loaded from Supabase; showing seeded posts.', error);
      window.atelierCommunityRemotePosts = [];
      await loadAuthorProfiles(getFallbackAuthorRows());
      renderFeed();
    }
  }

  function forumTopicFromRow(row) {
    const explicitTopic = String(row.forum_topic || row.topic || '').trim();
    const tags = Array.isArray(row.tags) ? row.tags.map((tag) => String(tag).trim()) : [];
    return FORUM_TOPICS.find((topic) => (
      topic.toLowerCase() === explicitTopic.toLowerCase()
      || tags.some((tag) => tag.toLowerCase() === topic.toLowerCase())
    )) || '';
  }

  function mapRemoteComment(row) {
    const userId = String(row.user_id || row.author_id || '');
    const handleValue = String(row.author_username || row.author_handle || row.username || '').trim();
    const handle = handleValue ? normalizeHandle(handleValue) : '';
    const authorName = String(row.author_name || row.display_name || '').trim();
    const authorProfile = findAuthorProfile(userId, handle);
    return {
      id: String(row.id || `${row.post_id}-${row.created_at}-${handle || authorName}`),
      postId: String(row.post_id),
      userId,
      handle,
      author: handle || (authorName || '@atelier-member'),
      authorName: (authorProfile && authorProfile.name) || authorName || handle || 'Atelier member',
      avatar: resolveAuthorAvatar(userId, handle),
      body: String(row.content || row.body || row.comment_text || ''),
      createdAt: row.created_at || ''
    };
  }

  async function loadRemoteComments() {
    const posts = window.atelierCommunityRemotePosts || [];
    if (!supabaseClient || !posts.length) {
      return;
    }
    const postIds = posts.map((post) => String(post.id));
    try {
      const { data, error } = await supabaseClient
        .from('post_comments')
        .select('*')
        .in('post_id', postIds)
        .order('created_at', { ascending: true });
      if (error) throw error;
      await loadAuthorProfiles(data || []);
      remoteCommentsByPostId.clear();
      loadedCommentPostIds.clear();
      postIds.forEach((postId) => {
        remoteCommentsByPostId.set(postId, []);
        loadedCommentPostIds.add(postId);
      });
      (data || []).map(mapRemoteComment).forEach((comment) => {
        const comments = remoteCommentsByPostId.get(comment.postId) || [];
        comments.push(comment);
        remoteCommentsByPostId.set(comment.postId, comments);
      });
    } catch (error) {
      console.error('Community comments could not be loaded from Supabase.', error);
    }
  }

  async function loadPostComments(postId) {
    const key = String(postId);
    if (!supabaseClient || loadedCommentPostIds.has(key)) return;
    try {
      const { data, error } = await supabaseClient
        .from('post_comments')
        .select('*')
        .eq('post_id', key)
        .order('created_at', { ascending: true });
      if (error) throw error;
      await loadAuthorProfiles(data || []);
      remoteCommentsByPostId.set(key, (data || []).map(mapRemoteComment));
      loadedCommentPostIds.add(key);
      refreshPostComments(key);
    } catch (error) {
      console.error(`Comments for post ${key} could not be loaded.`, error);
      showToast(`Comments could not be loaded: ${error.message || 'Please try again.'}`, 'error');
    }
  }

  function refreshPostComments(postId) {
    const post = mergePosts(window.atelierCommunityRemotePosts || [])
      .find((item) => String(item.id) === String(postId));
    if (!post) return;
    const card = [...elements.feed.querySelectorAll('[data-post-id]')]
      .find((item) => item.dataset.postId === String(postId));
    if (!card) return;
    const count = card.querySelector('[data-comment-count]');
    if (count && count.lastChild) count.lastChild.textContent = String(getComments(post).length);
    const panel = card.querySelector('[data-comments]');
    if (panel && !panel.hidden) renderComments(post, panel);
  }

  async function receiveRealtimeComment(payload) {
    const eventType = String(payload.eventType || '').toUpperCase();
    const row = eventType === 'DELETE' ? payload.old : payload.new;
    if (!row || row.post_id == null) return;
    const postId = String(row.post_id);
    if (eventType !== 'DELETE') await loadAuthorProfiles([row]);
    const comment = mapRemoteComment(row);
    const comments = remoteCommentsByPostId.get(postId) || [];
    const index = comments.findIndex((entry) => entry.id === comment.id);
    if (eventType === 'DELETE') {
      if (index >= 0) comments.splice(index, 1);
    } else if (index >= 0) {
      comments[index] = comment;
    } else {
      comments.push(comment);
    }
    remoteCommentsByPostId.set(postId, comments);
    refreshPostComments(postId);
  }

  async function submitCommentForm(form) {
    const card = form.closest('[data-post-id]');
    const postId = card.dataset.postId;
    const input = form.elements.comment;
    const text = input.value.trim();
    if (!text || !requireLogin()) return;

    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    const isRemotePost = (window.atelierCommunityRemotePosts || [])
      .some((post) => String(post.id) === String(postId));
    try {
      if (!isRemotePost) {
        localComments[postId] = [...(localComments[postId] || []), { author: ownHandle, body: text }];
        if (!persist('comments', localComments)) return;
      } else {
        if (!supabaseClient) throw new Error('Supabase is unavailable. Please try again later.');
        const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError) throw sessionError;
        const user = sessionData.session && sessionData.session.user;
        if (!user) throw new Error('Your sign-in has expired. Log in again before commenting.');
        const { data, error } = await supabaseClient
          .from('post_comments')
          .insert({
            post_id: postId,
            user_id: user.id,
            author_name: profile.name,
            author_handle: ownHandle,
            content: text
          })
          .select('*')
          .single();
        if (error) throw error;
        if (!data) throw new Error('Supabase did not return the saved comment.');
        await loadAuthorProfiles([data]);
        const comment = mapRemoteComment(data);
        const comments = remoteCommentsByPostId.get(String(postId)) || [];
        if (!comments.some((entry) => entry.id === comment.id)) comments.push(comment);
        remoteCommentsByPostId.set(String(postId), comments);
        loadedCommentPostIds.add(String(postId));
      }

      input.value = '';
      const post = mergePosts(window.atelierCommunityRemotePosts || [])
        .find((item) => String(item.id) === String(postId));
      const panel = card.querySelector('[data-comments]');
      renderComments(post || { id: postId, comments: [] }, panel);
      const count = card.querySelector('[data-comment-count]');
      if (count && count.lastChild) count.lastChild.textContent = String(getComments(post || { id: postId, comments: [] }).length);
      showToast(isRemotePost ? 'Comment added.' : 'Comment saved on this device for the sample post.');
    } catch (error) {
      console.error('Unable to add the community comment.', error);
      showToast(`Your comment could not be saved: ${error.message || 'Please try again.'}`, 'error');
    } finally {
      button.disabled = false;
    }
  }

  function subscribeToComments() {
    if (!supabaseClient || commentsChannel || typeof supabaseClient.channel !== 'function') return;
    commentsChannel = supabaseClient
      .channel(`community-post-comments-${Date.now()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'post_comments'
      }, receiveRealtimeComment)
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`Realtime comment updates are unavailable (${status}).`);
        }
      });
  }

  function formatTimestamp(value) {
    const time = new Date(value).getTime();
    if (!Number.isFinite(time)) {
      return 'Just now';
    }
    const hours = Math.max(0, Math.floor((Date.now() - time) / 3600000));
    if (hours < 1) {
      return 'Just now';
    }
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  async function uploadImage(file) {
    if (!window.atelierSupabase) throw new Error('Cloudinary upload is unavailable. Refresh and try again.');
    return window.atelierSupabase.uploadImage(file);
  }

  function resetAttachment() {
    selectedFile = null;
    elements.imageInput.value = '';
    elements.imageLabel.textContent = 'Add photo';
    elements.previewImage.removeAttribute('src');
    elements.previewWrap.hidden = true;
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    previewUrl = '';
  }

  async function submitPost(event) {
    event.preventDefault();
    if (!requireLogin()) {
      return;
    }
    const content = elements.composerText.value.trim();
    if (!content && !selectedFile) {
      showToast('Write a thought or add a photo before sharing.', 'error');
      return;
    }

    if (!supabaseClient) {
      showToast('Community publishing is unavailable right now. Please try again later.', 'error');
      return;
    }

    const submitButton = elements.composer.querySelector('[type="submit"]');
    submitButton.disabled = true;
    try {
      const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
      if (sessionError) throw sessionError;
      const user = sessionData.session && sessionData.session.user;
      if (!user) throw new Error('Your sign-in has expired. Log in again before posting.');

      const topicValue = elements.composerTopic.value;
      const forumTopic = FORUM_TOPICS.includes(topicValue) ? topicValue : '';
      const tags = forumTopic ? ['STYLE FORUM', forumTopic.toUpperCase()] : ['COMMUNITY'];
      const imageUrl = selectedFile ? await uploadImage(selectedFile) : '';
      const postRow = {
        user_id: user.id,
        author_name: profile.name,
        author_handle: ownHandle,
        avatar_url: profile.avatarUrl || null,
        content,
        tags,
        image_url: imageUrl || null,
        upcycled: /mend|repair|upcycl|thrift|patch/i.test(`${content} ${forumTopic}`)
      };
      const { data, error } = await supabaseClient
        .from('community_posts')
        .insert(postRow)
        .select('*')
        .single();
      if (error) throw error;
      if (!data || data.id == null) throw new Error('Supabase did not return the saved post.');

      const post = {
        id: String(data.id),
        userId: data.user_id || user.id,
        author: data.author_name || profile.name,
        handle: normalizeHandle(data.author_handle || ownHandle),
        avatar: resolveAuthorAvatar(user.id, ownHandle),
        content: data.content || content,
        tags: Array.isArray(data.tags) ? data.tags : tags,
        forumTopic: forumTopicFromRow(data),
        likes: Number(data.likes || 0),
        comments: [],
        upcycled: Boolean(data.upcycled),
        createdAt: data.created_at || new Date().toISOString(),
        timestamp: formatTimestamp(data.created_at),
        images: data.image_url ? [{ src: data.image_url, alt: 'Photo shared by the community' }] : []
      };
      window.atelierCommunityRemotePosts = [
        post,
        ...(window.atelierCommunityRemotePosts || []).filter((item) => item.id !== post.id)
      ];
      remoteCommentsByPostId.set(post.id, []);
      loadedCommentPostIds.add(post.id);
      elements.composerText.value = '';
      elements.composerTopic.value = 'home';
      resetAttachment();
      composerOpen = false;
      activeTab = forumTopic ? 'forums' : 'home';
      window.atelierCommunityState.activeTab = activeTab;
      elements.tabs.forEach((button) => {
        const active = button.dataset.tab === activeTab;
        button.classList.toggle('is-active', active);
        if (active) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
      });
      renderFeed();
      showToast(forumTopic ? `Your post was shared in ${forumTopic}.` : 'Your post has been shared.');
      const inserted = [...elements.feed.querySelectorAll('[data-post-id]')]
        .find((card) => card.dataset.postId === post.id);
      if (inserted) {
        inserted.classList.add('is-new');
        inserted.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Unable to publish the community post.', error);
      showToast(`Your post could not be saved: ${error.message || 'Please try again.'}`, 'error');
    } finally {
      submitButton.disabled = false;
    }
  }

  function persistSet(key, set) {
    return persist(key, [...set]);
  }

  function toggleLike(postId, button) {
    if (!requireLogin()) {
      return;
    }
    if (likedIds.has(postId)) {
      likedIds.delete(postId);
    } else {
      likedIds.add(postId);
    }
    persistSet('likes', likedIds);
    const post = mergePosts(window.atelierCommunityRemotePosts || []).find((item) => item.id === postId);
    if (post) {
      const count = button.closest('.community-post').querySelector('[data-like-count]');
      count.textContent = `♥ ${Number(post.likes || 0) + (likedIds.has(postId) ? 1 : 0)}`;
    }
    const active = likedIds.has(postId);
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
    button.lastElementChild.textContent = active ? 'Liked' : 'Like';
  }

  function toggleSave(postId) {
    if (!requireLogin()) {
      return;
    }
    if (savedIds.has(postId)) {
      savedIds.delete(postId);
    } else {
      savedIds.add(postId);
    }
    persistSet('saved', savedIds);
    renderFeed();
    showToast(savedIds.has(postId) ? 'Saved to your collection.' : 'Removed from Saved Posts.');
  }

  async function loadCommunityFollowData() {
    if (!supabaseClient) return;
    try {
      const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
      if (sessionError) throw sessionError;
      currentUserId = sessionData.session && sessionData.session.user
        ? String(sessionData.session.user.id || '')
        : '';

      const suggestionHandles = [...new Set(SUGGESTIONS.map((item) => normalizeHandle(item.handle).slice(1)))];
      if (suggestionHandles.length) {
        const { data: profiles, error: profilesError } = await supabaseClient
          .from('profiles')
          .select('id, username')
          .in('username', suggestionHandles);
        if (profilesError) throw profilesError;
        profileIdsByHandle.clear();
        (profiles || []).forEach((row) => {
          profileIdsByHandle.set(normalizeHandle(row.username), String(row.id));
        });
      }
      suggestionProfilesLoaded = true;

      if (!currentUserId) {
        followingUserIds.clear();
        following.clear();
        renderSuggestions();
        return;
      }

      const [ownFollowsResult, followersCountResult] = await Promise.all([
        supabaseClient.from('follows').select('following_id').eq('follower_id', currentUserId),
        supabaseClient.from('follows')
          .select('follower_id', { count: 'exact', head: true })
          .eq('following_id', currentUserId)
      ]);
      if (ownFollowsResult.error) throw ownFollowsResult.error;
      if (followersCountResult.error) throw followersCountResult.error;

      const followedIds = (ownFollowsResult.data || []).map((row) => String(row.following_id));
      followingUserIds.clear();
      followedIds.forEach((id) => followingUserIds.add(id));
      following.clear();
      if (followedIds.length) {
        const { data: followedProfiles, error: followedProfilesError } = await supabaseClient
          .from('profiles')
          .select('id, username')
          .in('id', followedIds);
        if (followedProfilesError) throw followedProfilesError;
        (followedProfiles || []).forEach((row) => {
          const handle = normalizeHandle(row.username);
          if (handle !== '@atelier-member') following.add(handle);
        });
      }

      const followingCountResult = await supabaseClient.from('follows')
        .select('following_id', { count: 'exact', head: true })
        .eq('follower_id', currentUserId);
      if (followingCountResult.error) throw followingCountResult.error;
      profile.followingCount = Number(followingCountResult.count || 0);
      profile.followersCount = Number(followersCountResult.count || 0);
      elements.profileFollowingCount.textContent = String(profile.followingCount);
      elements.profileFollowerCount.textContent = String(profile.followersCount);
      persistSet('following', following);
      renderSuggestions();
      renderFeed();
    } catch (error) {
      console.error('Community follow relationships could not be loaded from Supabase.', error);
      showToast(`Follow status could not be loaded: ${error.message || 'Please try again.'}`, 'error');
    }
  }

  async function resolveFollowTargetId(handle) {
    const cachedId = profileIdsByHandle.get(handle);
    if (cachedId) return cachedId;
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('id, username')
      .ilike('username', handle.replace(/^@/, ''))
      .limit(1);
    if (error) throw error;
    if (!data || !data.length) throw new Error('This person does not have an Atelier profile to follow.');
    const id = String(data[0].id);
    profileIdsByHandle.set(normalizeHandle(data[0].username), id);
    return id;
  }

  async function toggleFollow(handle) {
    handle = normalizeHandle(handle);
    if (!supabaseClient) {
      if (!requireLogin()) {
        window.location.assign('login.html');
        return;
      }
      const wasFollowing = following.has(handle);
      if (wasFollowing) following.delete(handle);
      else following.add(handle);
      if (!persistSet('following', following)) {
        if (wasFollowing) following.add(handle);
        else following.delete(handle);
        renderSuggestions();
        renderFeed();
        showToast('The follow preference could not be saved in this browser.', 'error');
        return;
      }
      renderSuggestions();
      renderFeed();
      showToast(following.has(handle) ? 'Added to your friends feed.' : 'Removed from your friends feed.');
      return;
    }

    if (pendingFollowHandles.has(handle)) return;
    pendingFollowHandles.add(handle);
    renderSuggestions();
    let targetId = '';
    let previousFollowing = false;
    let followStateChanged = false;
    try {
      await followDataPromise;
      const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
      if (sessionError) throw sessionError;
      const sessionUser = sessionData.session && sessionData.session.user;
      if (!sessionUser) {
        window.location.assign('login.html');
        return;
      }
      currentUserId = String(sessionUser.id);
      targetId = await resolveFollowTargetId(handle);
      if (targetId === currentUserId) {
        showToast('You are already viewing your own profile.');
        return;
      }

      previousFollowing = followingUserIds.has(targetId);
      const shouldFollow = !previousFollowing;
      if (shouldFollow) {
        followingUserIds.add(targetId);
        following.add(handle);
      } else {
        followingUserIds.delete(targetId);
        following.delete(handle);
      }
      followStateChanged = true;
      profile.followingCount = Math.max(0, Number(profile.followingCount || 0) + (shouldFollow ? 1 : -1));
      elements.profileFollowingCount.textContent = String(profile.followingCount);
      renderSuggestions();
      renderFeed();

      const result = shouldFollow
        ? await supabaseClient.from('follows').insert({
          follower_id: currentUserId,
          following_id: targetId
        })
        : await supabaseClient.from('follows').delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetId);
      if (result.error) throw result.error;
      if (persistSet('following', following)) {
        showToast(shouldFollow ? 'You are now following this profile.' : 'You unfollowed this profile.');
      } else {
        showToast('Your follow was saved, but the Friends feed cache could not be updated.', 'error');
      }
    } catch (error) {
      console.error('Community follow update failed.', error);
      if (followStateChanged) {
        if (previousFollowing) {
          followingUserIds.add(targetId);
          following.add(handle);
        } else {
          followingUserIds.delete(targetId);
          following.delete(handle);
        }
        profile.followingCount = Math.max(0, Number(profile.followingCount || 0) + (previousFollowing ? 1 : -1));
        elements.profileFollowingCount.textContent = String(profile.followingCount);
      }
      showToast(`Could not update this follow: ${error.message || 'Please try again.'}`, 'error');
    } finally {
      pendingFollowHandles.delete(handle);
      renderSuggestions();
      renderFeed();
    }
  }

  async function deletePost(postId, button) {
    if (!requireLogin()) {
      return;
    }
    const deletedPostId = String(postId);
    if (deletingIds.has(deletedPostId)) {
      return;
    }
    const post = mergePosts(window.atelierCommunityRemotePosts || [])
      .find((item) => String(item.id) === deletedPostId);
    if (!post || normalizeHandle(post.handle) !== ownHandle) {
      showToast('You can only delete posts you authored.', 'error');
      return;
    }
    if (!window.confirm('Delete this post? This cannot be undone.')) {
      return;
    }

    deletingIds.add(deletedPostId);
    button.disabled = true;
    const isRemotePost = (window.atelierCommunityRemotePosts || [])
      .some((item) => String(item.id) === deletedPostId);
    if (isRemotePost && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('community_posts')
          .delete()
          .eq('id', postId)
          .eq('author_handle', ownHandle)
          .select('id');
        if (error) {
          throw error;
        }
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('The synced post was not found or cannot be deleted by this account.');
        }
      } catch (error) {
        console.error('Unable to delete the community post from Supabase.', error);
        showToast(`Could not delete the synced post: ${error.message}`, 'error');
        deletingIds.delete(deletedPostId);
        button.disabled = false;
        return;
      }
    }

    deletedIds.add(deletedPostId);
    if (!persist('deleted', [...deletedIds])) {
      deletedIds.delete(deletedPostId);
      deletingIds.delete(deletedPostId);
      button.disabled = false;
      return;
    }
    renderFeed();
    showToast(isRemotePost ? 'Your post was deleted.' : 'Post deleted from this browser.');
    deletingIds.delete(deletedPostId);
  }

  elements.tabs.forEach((button) => {
    button.addEventListener('click', () => {
      activeTab = button.dataset.tab;
      window.atelierCommunityState.activeTab = activeTab;
      elements.tabs.forEach((tab) => {
        const selected = tab === button;
        tab.classList.toggle('is-active', selected);
        if (selected) {
          tab.setAttribute('aria-current', 'page');
        } else {
          tab.removeAttribute('aria-current');
        }
      });
      renderFeed();
    });
  });

  elements.newPostButton.addEventListener('click', () => {
    if (!requireLogin()) return;
    composerOpen = true;
    renderFeed();
    elements.composer.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    elements.composerText.focus();
  });

  elements.filters.forEach((button) => {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.filter;
      window.atelierCommunityState.activeFilter = activeFilter;
      elements.filters.forEach((filter) => {
        const selected = filter === button;
        filter.classList.toggle('is-active', selected);
        filter.setAttribute('aria-pressed', String(selected));
      });
      renderFeed();
    });
  });

  elements.feed.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) {
      return;
    }
    const card = button.closest('[data-post-id]');
    if (button.dataset.action === 'thread-replies') {
      if (!requireLogin()) {
        window.location.assign('login.html');
        return;
      }
      const form = button.closest('[data-thread-id]').querySelector('[data-forum-reply-form]');
      form.hidden = !form.hidden;
    } else if (button.dataset.action === 'like' && card) {
      toggleLike(card.dataset.postId, button);
    } else if (button.dataset.action === 'save' && card) {
      toggleSave(card.dataset.postId);
    } else if (button.dataset.action === 'delete' && card) {
      deletePost(card.dataset.postId, button);
    } else if (button.dataset.action === 'comment' && card) {
      const panel = card.querySelector('[data-comments]');
      panel.hidden = !panel.hidden;
      if (!panel.hidden) {
        if ((window.atelierCommunityRemotePosts || []).some((post) => String(post.id) === card.dataset.postId)) {
          loadPostComments(card.dataset.postId);
        }
        panel.querySelector('input').focus();
      }
    }
  });

  elements.feed.addEventListener('submit', (event) => {
    const commentForm = event.target.closest('[data-comment-form]');
    if (commentForm) {
      event.preventDefault();
      submitCommentForm(commentForm);
      return;
    }

    const replyForm = event.target.closest('[data-forum-reply-form]');
    if (replyForm) {
      event.preventDefault();
      const threadId = replyForm.closest('[data-thread-id]').dataset.threadId;
      const text = replyForm.elements.reply.value.trim();
      if (!text || !requireLogin()) {
        return;
      }
      forumReplies[threadId] = [...(forumReplies[threadId] || []), { author: ownHandle, body: text }];
      if (persist('forum-replies', forumReplies)) {
        renderFeed();
        showToast('Your forum reply has been added.');
      }
    }
  });

  elements.suggestions.addEventListener('click', (event) => {
    const button = event.target.closest('[data-follow]');
    if (button) {
      toggleFollow(button.dataset.follow);
    }
  });

  elements.imageInput.addEventListener('change', () => {
    const file = elements.imageInput.files && elements.imageInput.files[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      resetAttachment();
      showToast('Choose an image file to attach.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      resetAttachment();
      showToast('Choose an image smaller than 5 MB.', 'error');
      return;
    }
    selectedFile = file;
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    previewUrl = URL.createObjectURL(file);
    elements.previewImage.src = previewUrl;
    elements.previewWrap.hidden = false;
    elements.imageLabel.textContent = file.name;
  });

  document.getElementById('community-remove-image').addEventListener('click', resetAttachment);
  elements.composer.addEventListener('submit', submitPost);

  elements.questionForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!requireLogin()) {
      return;
    }
    const question = elements.questionInput.value.trim();
    if (!question) {
      return;
    }
    const thread = {
      id: `forum-${Date.now()}`,
      title: question,
      author: profile.name,
      handle: ownHandle,
      location: 'HYDERABAD',
      tags: ['COMMUNITY QUESTION', 'REPAIR HELP'],
      replies: []
    };
    localForumThreads.unshift(thread);
    if (!persist('forum-threads', localForumThreads)) {
      localForumThreads.shift();
      return;
    }
    elements.questionForm.reset();
    elements.questionDialog.close();
    activeTab = 'forums';
    window.atelierCommunityState.activeTab = activeTab;
    elements.tabs.forEach((tab) => {
      const selected = tab.dataset.tab === 'forums';
      tab.classList.toggle('is-active', selected);
      selected ? tab.setAttribute('aria-current', 'page') : tab.removeAttribute('aria-current');
    });
    renderFeed();
    showToast('Your new style forum thread is ready.');
  });

  document.querySelectorAll('[data-close-community-dialog]').forEach((button) => {
    button.addEventListener('click', () => elements.questionDialog.close());
  });
  elements.questionDialog.addEventListener('click', (event) => {
    if (event.target === elements.questionDialog) {
      elements.questionDialog.close();
    }
  });

  elements.memberSearch.addEventListener('input', onMemberSearchInput);
  initializeProfile();
  window.addEventListener('pageshow', refreshProfileAvatar);
  window.addEventListener('atelier:profile-updated', refreshProfileAvatar);
  window.addEventListener('storage', (event) => {
    if (
      event.key === window.atelierSupabase.activeProfileIdKey
      || (event.key && event.key.startsWith('atelier_profile_'))
    ) {
      refreshProfileAvatar();
    }
  });
  initializeSupabase();
  followDataPromise = loadCommunityFollowData();
  renderSuggestions();
  renderFeed();
  refreshCurrentUserProfileAvatar();
  loadRemotePosts();
});

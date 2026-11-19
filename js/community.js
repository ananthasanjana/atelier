document.addEventListener('DOMContentLoaded', () => {
  const CLOUDINARY_CLOUD_NAME = 'lify0b3k';
  const CLOUDINARY_UPLOAD_PRESET = 'atelier_unsigned';
  const SUPABASE_URL = 'https://sktkevlfxjppfpjmxguy.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_0jOs1sVk5nRJj1SY9VrgKw_Eoc08C0N';
  const SEED_POSTS = window.ATELIER_COMMUNITY_POSTS || [];
  const SUGGESTIONS = window.ATELIER_COMMUNITY_MAKERS || [];
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
    loginLink: document.getElementById('community-login-link'),
    loginPrompt: document.getElementById('community-login-prompt'),
    tabs: document.querySelectorAll('.community-tab'),
    title: document.getElementById('community-title'),
    filters: document.querySelectorAll('[data-filter]'),
    feed: document.getElementById('community-feed'),
    suggestions: document.getElementById('community-suggestions'),
    composer: document.getElementById('community-composer'),
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
  let selectedFile = null;
  let previewUrl = '';
  let toastTimer = 0;
  let supabaseClient = null;
  const isLoggedIn = Boolean(profile);
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
  const ownHandle = profile ? profile.username : '';

  window.atelierCommunityState = { activeTab, activeFilter };

  function readProfile() {
    try {
      const saved = JSON.parse(window.localStorage.getItem('atelierUser') || 'null');
      if (
        !saved
        || typeof saved !== 'object'
        || Array.isArray(saved)
        || !['name', 'username', 'email'].some((field) => (
          typeof saved[field] === 'string' && saved[field].trim()
        ))
      ) {
        return null;
      }
      return {
        name: String(saved.displayName || saved.name || saved.username || saved.email),
        username: normalizeHandle(saved.username || saved.email),
        role: /tailor/i.test(String(saved.role || '')) ? 'Tailor' : 'Member',
        avatarUrl: typeof saved.avatarUrl === 'string' ? saved.avatarUrl : '',
        followingCount: readCount(saved.followingCount, saved.following, 125),
        followersCount: readCount(saved.followersCount, saved.followerCount, 578)
      };
    } catch (error) {
      console.error('Unable to read the saved community profile.', error);
      return null;
    }
  }

  function readCount(primary, secondary, fallback) {
    const value = Number(primary == null ? secondary : primary);
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  }

  function normalizeHandle(value) {
    const text = String(value || '').trim();
    const username = text.startsWith('@') ? text.slice(1) : (text.includes('@') ? text.split('@')[0] : text);
    return `@${username.toLowerCase().replace(/[^a-z0-9._-]+/g, '') || 'atelier-member'}`;
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
    if (image) {
      const img = document.createElement('img');
      img.src = image;
      img.alt = '';
      img.loading = 'lazy';
      avatar.append(img);
    } else {
      avatar.textContent = String(name || '?').trim().charAt(0).toUpperCase() || '?';
    }
    avatar.setAttribute('aria-hidden', 'true');
    return avatar;
  }

  function profileHref(handle) {
    const username = String(handle || '').trim().replace(/^@/, '');
    return `profile.html?user=${encodeURIComponent(username)}`;
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
    elements.composer.hidden = !isLoggedIn;
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
      profile.avatarUrl || 'assets/community-sanj-avatar.svg',
      'community-avatar--profile'
    ));
    elements.profileAvatar = document.querySelector('.community-avatar--profile');
  }

  function initializeSupabase() {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      console.info('Supabase is unavailable; the community will use the local feed.');
      return;
    }
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
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
    avatarLink.append(makeAvatar(post.author, post.avatar, 'community-avatar--small'));
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
    return [...(Array.isArray(post.comments) ? post.comments : []), ...extra];
  }

  function renderComments(post, panel) {
    panel.replaceChildren();
    const list = document.createElement('ul');
    list.className = 'community-comments__list';
    getComments(post).forEach((comment) => {
      const item = document.createElement('li');
      const author = document.createElement('strong');
      const authorHandle = String(comment.author || '').startsWith('@') ? comment.author : '';
      if (authorHandle) {
        author.append(makeProfileLink(comment.author, authorHandle, 'community-profile-link'));
      } else {
        author.textContent = comment.author;
      }
      const body = document.createElement('span');
      body.textContent = comment.body;
      item.append(author, body);
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
      const followed = following.has(suggestion.handle);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `community-follow${followed ? ' is-following' : ''}`;
      button.dataset.follow = suggestion.handle;
      button.setAttribute('aria-pressed', String(followed));
      button.textContent = followed ? 'Following' : 'Follow';
      card.append(profileLink, button);
      elements.suggestions.append(card);
    });
  }

  function mergePosts(remotePosts) {
    const byId = new Map(SEED_POSTS.map((post) => [post.id, post]));
    localPosts.forEach((post) => byId.set(post.id, post));
    remotePosts.forEach((post) => byId.set(post.id, post));
    return [...byId.values()].filter((post) => !deletedIds.has(String(post.id))).sort((first, second) => {
      return new Date(second.createdAt || 0).getTime() - new Date(first.createdAt || 0).getTime();
    });
  }

  function matchesTab(post) {
    if (activeTab === 'friends') {
      return following.has(normalizeHandle(post.handle));
    }
    if (activeTab === 'saved') {
      return savedIds.has(post.id);
    }
    if (activeTab === 'my-posts') {
      return normalizeHandle(post.handle) === ownHandle;
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
    elements.composer.hidden = !isLoggedIn || activeTab === 'forums';
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

  async function loadRemotePosts() {
    if (!supabaseClient) {
      return;
    }
    try {
      const { data, error } = await supabaseClient
        .from('community_posts')
        .select('id, author_name, author_handle, avatar_url, content, tags, image_url, upcycled, likes, created_at')
        .order('created_at', { ascending: false })
        .limit(40);
      if (error) {
        throw error;
      }
      window.atelierCommunityRemotePosts = (data || []).map((row) => ({
        id: String(row.id),
        author: row.author_name || 'Atelier member',
        handle: normalizeHandle(row.author_handle),
        avatar: row.avatar_url || '',
        content: row.content || '',
        tags: Array.isArray(row.tags) ? row.tags : [],
        likes: Number(row.likes || 0),
        comments: [],
        upcycled: Boolean(row.upcycled),
        createdAt: row.created_at,
        timestamp: formatTimestamp(row.created_at),
        images: row.image_url ? [{ src: row.image_url, alt: 'Image shared by the community' }] : []
      }));
      renderFeed();
    } catch (error) {
      console.warn('Community posts could not be loaded from Supabase; showing the local feed.', error.message);
    }
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

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('The image could not be read.'));
        }
      }, { once: true });
      reader.addEventListener('error', () => reject(reader.error || new Error('The image could not be read.')), { once: true });
      reader.addEventListener('abort', () => reject(new Error('Reading the image was canceled.')), { once: true });
      reader.readAsDataURL(file);
    });
  }

  async function uploadImage(file) {
    const body = new FormData();
    body.append('file', file);
    body.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body
    });
    const result = await response.json();
    if (!response.ok || !result || typeof result.secure_url !== 'string') {
      const message = result && result.error && result.error.message;
      throw new Error(message || 'Cloudinary did not accept the image.');
    }
    return result.secure_url;
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

    const submitButton = elements.composer.querySelector('[type="submit"]');
    submitButton.disabled = true;
    let imageUrl = '';
    let imageUploadFailed = false;
    let remoteSyncError = '';
    if (selectedFile) {
      try {
        imageUrl = await uploadImage(selectedFile);
      } catch (error) {
        imageUploadFailed = true;
        console.warn('Community image upload failed; trying a local image fallback.', error.message);
        try {
          imageUrl = await readFileAsDataUrl(selectedFile);
        } catch (fallbackError) {
          console.error('Unable to read a local community image fallback.', fallbackError);
          submitButton.disabled = false;
          showToast(`Could not upload or read this image: ${fallbackError.message}`, 'error');
          return;
        }
      }
    }

    const post = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      author: profile.name,
      handle: ownHandle,
      avatar: profile.avatarUrl,
      content,
      tags: ['COMMUNITY'],
      likes: 0,
      comments: [],
      upcycled: /mend|repair|upcycl|thrift|patch/i.test(content),
      createdAt: new Date().toISOString(),
      timestamp: 'Just now',
      images: imageUrl ? [{ src: imageUrl, alt: 'Photo shared by the community' }] : []
    };

    if (supabaseClient && !imageUploadFailed) {
      try {
        const row = {
          author_name: profile.name,
          author_handle: ownHandle,
          avatar_url: profile.avatarUrl || null,
          content,
          tags: post.tags,
          image_url: imageUrl || null,
          upcycled: post.upcycled
        };
        const { data, error } = await supabaseClient.from('community_posts').insert(row).select('id, created_at').single();
        if (error) {
          throw error;
        }
        if (data && data.id != null) {
          post.id = String(data.id);
          post.createdAt = data.created_at || post.createdAt;
        }
      } catch (error) {
        remoteSyncError = error.message || 'The community table is not available.';
        console.warn('Community post could not be synced to Supabase; keeping it in this browser.', error.message);
      }
    }

    localPosts.unshift(post);
    if (!persist('posts', localPosts)) {
      localPosts.shift();
      submitButton.disabled = false;
      return;
    }
    elements.composerText.value = '';
    resetAttachment();
    submitButton.disabled = false;
    activeTab = 'home';
    window.atelierCommunityState.activeTab = activeTab;
    elements.tabs.forEach((button) => {
      const active = button.dataset.tab === activeTab;
      button.classList.toggle('is-active', active);
      if (active) {
        button.setAttribute('aria-current', 'page');
      } else {
        button.removeAttribute('aria-current');
      }
    });
    if (imageUploadFailed) {
      showToast('Shared with a local photo fallback. Cloudinary was unavailable, so only this browser can see the image.', 'error');
    } else if (remoteSyncError) {
      showToast(`Saved on this device only; community sync failed: ${remoteSyncError}`, 'error');
    } else {
      showToast('Your post has been shared.');
    }
    renderFeed();
    const inserted = elements.feed.querySelector(`[data-post-id="${CSS.escape(post.id)}"]`);
    if (inserted) {
      inserted.classList.add('is-new');
      inserted.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
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

  function toggleFollow(handle) {
    if (!requireLogin()) {
      window.location.assign('login.html');
      return;
    }
    handle = normalizeHandle(handle);
    if (following.has(handle)) {
      following.delete(handle);
    } else {
      following.add(handle);
    }
    persistSet('following', following);
    renderSuggestions();
    renderFeed();
    showToast(following.has(handle) ? 'Added to your friends feed.' : 'Removed from your friends feed.');
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
        panel.querySelector('input').focus();
      }
    }
  });

  elements.feed.addEventListener('submit', (event) => {
    const commentForm = event.target.closest('[data-comment-form]');
    if (commentForm) {
      event.preventDefault();
      const card = commentForm.closest('[data-post-id]');
      const input = commentForm.elements.comment;
      const text = input.value.trim();
      if (!text || !requireLogin()) {
        return;
      }
      const postId = card.dataset.postId;
      localComments[postId] = [...(localComments[postId] || []), { author: ownHandle, body: text }];
      if (persist('comments', localComments)) {
        const post = mergePosts(window.atelierCommunityRemotePosts || []).find((item) => item.id === postId);
        const panel = card.querySelector('[data-comments]');
        renderComments(post || { id: postId, comments: [] }, panel);
        card.querySelector('[data-comment-count]').lastChild.textContent = String(getComments(post || {}).length);
        showToast('Comment added.');
      }
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

  initializeProfile();
  initializeSupabase();
  renderSuggestions();
  renderFeed();
  loadRemotePosts();
});

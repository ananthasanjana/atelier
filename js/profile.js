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

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error && data.error.message
        ? data.error.message
        : 'Cloudinary could not upload this image.');
    }
    if (typeof data.secure_url !== 'string' || !data.secure_url) {
      throw new Error('Cloudinary did not return a secure image URL.');
    }

    return data.secure_url;
  } catch (error) {
    showProfileToast(`Upload failed: ${error.message}`, 'error');
    throw error;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const defaultProfile = {
    name: 'sanj',
    username: '@sanjs4n',
    bio: 'born cool like that\nim a college student who loves fashion and loves to thrift!\nhop along for some cool tips lol',
    role: 'Member',
    avatarUrl: '',
    coverUrl: ''
  };
  const supportedRoles = ['Member', 'Student', 'Tailor / Designer', 'Seller'];
  const elements = {
    name: document.getElementById('profile-display-name'),
    username: document.getElementById('profile-username'),
    bio: document.getElementById('profile-bio'),
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
        coverUrl: typeof storedProfile.coverUrl === 'string' ? storedProfile.coverUrl : ''
      };
    } catch (error) {
      console.error('Unable to load the Atelier profile from localStorage.', error);
      showProfileToast('Could not load saved profile details.', 'error');
      return { ...defaultProfile };
    }
  }

  let profile = loadProfile();

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
    elements.role.textContent = profile.role;
    updateRoleIcon(profile.role);
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
    try {
      previewUrl = URL.createObjectURL(file);
      imageElement.src = previewUrl;
      imageElement.hidden = false;
      fallbackElement.hidden = true;

      const secureUrl = await uploadToCloudinary(file);
      const nextProfile = { ...profile, [field]: secureUrl };
      if (!saveProfile(nextProfile)) {
        imageElement.src = previousUrl || '';
        imageElement.hidden = !previousUrl;
        fallbackElement.hidden = Boolean(previousUrl);
        return;
      }

      profile = nextProfile;
      imageElement.src = secureUrl;
      showProfileToast('Image updated.');
    } catch (error) {
      console.error('Unable to upload the profile image.', error);
      imageElement.src = previousUrl || '';
      imageElement.hidden = !previousUrl;
      fallbackElement.hidden = Boolean(previousUrl);
    } finally {
      if (previewUrl) {
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
  if (posts.has(initialPostId)) {
    openPost(initialPostId);
  }
});

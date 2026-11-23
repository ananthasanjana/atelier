document.addEventListener('DOMContentLoaded', () => {
  const loginButton = document.getElementById('nav-login-btn');
  const profileButton = document.getElementById('nav-profile-btn');
  if (!loginButton || !profileButton) return;

  const avatar = profileButton.querySelector('.atelier-avatar');
  const label = profileButton.querySelector('span:last-child');

  function render(user) {
    const loggedIn = Boolean(user && user.username);
    loginButton.style.display = loggedIn ? 'none' : 'inline-flex';
    profileButton.style.display = loggedIn ? 'inline-flex' : 'none';
    if (!loggedIn) return;

    profileButton.title = user.display_name || user.name || `@${user.username}`;
    label.textContent = `@${String(user.username).replace(/^@/, '')}`;
    avatar.replaceChildren();
    const imageUrl = user.avatar_url || user.avatarUrl;
    if (imageUrl) {
      const image = document.createElement('img');
      image.src = imageUrl;
      image.alt = '';
      avatar.append(image);
    } else {
      const fallback = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      fallback.setAttribute('viewBox', '0 0 36 36');
      fallback.setAttribute('aria-hidden', 'true');
      fallback.innerHTML = '<circle cx="18" cy="12" r="5"></circle><path d="M8 29c0-6 4-9 10-9s10 3 10 9"></path>';
      avatar.append(fallback);
    }

    const profileTitle = document.getElementById('profile-title');
    const profileMessage = document.getElementById('profile-message');
    const profileRole = document.getElementById('profile-role');
    const profileLoginLink = document.getElementById('profile-login-link');
    const profileLogoutButton = document.getElementById('profile-logout-btn');
    if (profileTitle) profileTitle.textContent = `Welcome, ${user.display_name || user.name || user.username}`;
    if (profileMessage) profileMessage.textContent = 'Your Atelier profile is ready.';
    if (profileRole) profileRole.textContent = window.atelierSupabase.displayRole(user.role);
    if (profileLoginLink) profileLoginLink.style.display = 'none';
    if (profileLogoutButton) profileLogoutButton.style.display = 'inline-flex';
  }

  render(window.atelierSupabase.readCachedProfile());
  window.addEventListener('atelier:profile-updated', (event) => render(event.detail));
  window.addEventListener('storage', (event) => {
    if (
      event.key === window.atelierSupabase.activeProfileIdKey
      || (event.key && event.key.startsWith('atelier_profile_'))
    ) {
      render(window.atelierSupabase.readCachedProfile());
    }
  });

  try {
    window.atelierSupabase.getClient().auth.getSession().then(async ({ data, error }) => {
      if (error) throw error;
      if (!data.session) {
        window.atelierSupabase.clearCachedProfileActivation();
        render(null);
        return;
      }
      const profile = await window.atelierSupabase.cacheAuthenticatedProfile(data.session.user, {
        createIfMissing: true
      });
      render(profile);
    }).catch((error) => {
      console.error('Unable to verify the Atelier navbar session.', error);
      render(window.atelierSupabase.readCachedProfile());
    });
  } catch (error) {
    console.error('Unable to initialize the Atelier navbar session.', error);
    render(window.atelierSupabase.readCachedProfile());
  }
});

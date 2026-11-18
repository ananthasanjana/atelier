document.addEventListener('DOMContentLoaded', () => {
  const loginButton = document.getElementById('nav-login-btn');
  const profileButton = document.getElementById('nav-profile-btn');

  if (!loginButton || !profileButton) {
    return;
  }

  let user = null;
  try {
    const sessionInitializationKey = 'atelierSessionInitialized';
    if (window.localStorage.getItem(sessionInitializationKey) !== 'true') {
      window.localStorage.removeItem('atelierUser');
      window.localStorage.setItem(sessionInitializationKey, 'true');
    }

    const storedUser = window.localStorage.getItem('atelierUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (
        parsedUser
        && typeof parsedUser === 'object'
        && !Array.isArray(parsedUser)
        && ['name', 'username', 'email'].some(
          (field) => typeof parsedUser[field] === 'string' && parsedUser[field].trim()
        )
      ) {
        user = parsedUser;
      } else {
        console.error('The stored Atelier user session has an invalid shape.');
      }
    }
  } catch (error) {
    console.error('Unable to read the Atelier user session.', error);
  }

  const isLoggedIn = Boolean(user);

  loginButton.style.display = isLoggedIn ? 'none' : 'inline-flex';
  profileButton.style.display = isLoggedIn ? 'inline-flex' : 'none';

  const profileTitle = document.getElementById('profile-title');
  const profileMessage = document.getElementById('profile-message');
  const profileRole = document.getElementById('profile-role');
  const profileLoginLink = document.getElementById('profile-login-link');
  const profileLogoutButton = document.getElementById('profile-logout-btn');
  if (profileTitle && isLoggedIn) {
    profileTitle.textContent = `Welcome, ${user.name || user.username || user.email}`;
  }
  if (profileMessage) {
    profileMessage.textContent = isLoggedIn
      ? 'Your Atelier profile is ready.'
      : 'Please log in to view your profile.';
  }
  if (profileRole && isLoggedIn && typeof user.role === 'string') {
    profileRole.textContent = user.role;
  }
  if (profileLoginLink) {
    profileLoginLink.style.display = isLoggedIn ? 'none' : 'inline';
  }
  if (profileLogoutButton) {
    profileLogoutButton.style.display = isLoggedIn ? 'inline-flex' : 'none';
    profileLogoutButton.addEventListener('click', () => {
      try {
        window.localStorage.removeItem('atelierUser');
      } catch (error) {
        console.error('Unable to clear the Atelier user session.', error);
        if (profileMessage) {
          profileMessage.textContent = 'Could not log out. Please check your browser storage settings and try again.';
        }
        return;
      }

      window.location.assign('login.html');
    });
  }
});

(() => {
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('Supabase JavaScript client did not load.');
    return;
  }

  const client = window.supabase.createClient(
    'https://sktkevlfxjppfpjmxguy.supabase.co',
    'sb_publishable_0jOs1sVk5nRJj1SY9VrgKw_Eoc08C0N'
  );

  function makeUsername(value) {
    const slug = value
      .trim()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `@${slug || 'atelier-member'}`;
  }

  async function startGoogleSignIn(role, feedback, button) {
    try {
      window.localStorage.setItem('atelierPendingRole', role);
    } catch (error) {
      console.error('Unable to save the selected role for Google sign-in.', error);
      feedback.textContent = 'Could not start Google sign-in. Please enable browser storage and try again.';
      return;
    }

    button.disabled = true;
    feedback.textContent = 'Redirecting to Google...';

    try {
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: new URL('login.html?oauth=google', window.location.href).toString()
        }
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Google sign-in could not be started.', error);
      feedback.textContent = `Google sign-in failed: ${error.message}`;
      button.disabled = false;
    }
  }

  async function completeGoogleSignIn(feedback) {
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth') !== 'google') {
      return;
    }

    const providerError = params.get('error_description') || params.get('error');
    if (providerError) {
      feedback.textContent = `Google sign-in failed: ${providerError}`;
      return;
    }

    try {
      const { data, error } = await client.auth.getSession();
      if (error) {
        throw error;
      }

      if (!data.session) {
        feedback.textContent = 'Google did not return an active session. Please try again.';
        return;
      }

      const user = data.session.user;
      const name = user.user_metadata.full_name
        || user.user_metadata.name
        || user.email
        || 'Atelier Member';
      const usernameSource = user.user_metadata.user_name
        || user.email
        || name;
      const role = window.localStorage.getItem('atelierPendingRole')
        || 'Member / Student';

      window.localStorage.setItem('atelierUser', JSON.stringify({
        name,
        username: makeUsername(usernameSource.split('@')[0]),
        email: user.email || '',
        role
      }));
      window.localStorage.removeItem('atelierPendingRole');
      const destination = window.atelierAuth
        ? window.atelierAuth.consumeRedirectAfterLogin('profile.html')
        : 'profile.html';
      window.location.assign(destination);
    } catch (error) {
      console.error('Unable to finish Google sign-in.', error);
      feedback.textContent = `Could not finish Google sign-in: ${error.message}`;
    }
  }

  window.atelierGoogleAuth = {
    start: startGoogleSignIn,
    complete: completeGoogleSignIn
  };
})();

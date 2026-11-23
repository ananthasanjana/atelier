(() => {
  if (!window.atelierSupabase) {
    console.error('Atelier Supabase helpers did not load.');
    return;
  }

  async function startGoogleSignIn(role, feedback, button) {
    try {
      if (window.location.pathname.endsWith('/signup.html') || window.location.pathname.endsWith('signup.html')) {
        window.localStorage.setItem('atelierPendingRole', String(role || 'member').toLowerCase());
      }
    } catch (error) {
      console.error('Unable to save the selected Google signup role.', error);
      feedback.textContent = 'Could not start Google sign-in. Please enable browser storage and try again.';
      return;
    }

    button.disabled = true;
    feedback.textContent = 'Redirecting to Google...';
    try {
      const callback = new URL('profile.html', window.location.href).href;
      const { error } = await window.atelierSupabase.getClient().auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callback
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Google sign-in could not be started.', error);
      feedback.textContent = `Google sign-in failed: ${error.message}`;
      button.disabled = false;
    }
  }

  async function completeGoogleSignIn(feedback) {
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth') !== 'google') return;

    const providerError = params.get('error_description') || params.get('error');
    if (providerError) {
      feedback.textContent = `Google sign-in failed: ${providerError}`;
      return;
    }

    try {
      const session = await window.atelierSupabase.getSession();
      if (!session) throw new Error('Google did not return an active session.');
      const profile = await window.atelierSupabase.cacheAuthenticatedProfile(session.user, {
        createIfMissing: true,
        metadata: {
          ...session.user.user_metadata,
          role: window.localStorage.getItem('atelierPendingRole') || 'member'
        }
      });
      window.localStorage.removeItem('atelierPendingRole');
      window.atelierAuth.consumeRedirectAfterLogin('profile.html');
      window.location.assign('profile.html');
      return profile;
    } catch (error) {
      console.error('Unable to finish Google sign-in.', error);
      feedback.textContent = `Could not finish Google sign-in: ${error.message}`;
    }
  }

  window.atelierGoogleAuth = Object.freeze({
    start: startGoogleSignIn,
    complete: completeGoogleSignIn
  });
})();

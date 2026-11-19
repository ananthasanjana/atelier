(() => {
  'use strict';

  const redirectKey = 'atelier_redirect_after_login';
  const initializedKey = 'atelierSessionInitialized';
  const validUserFields = ['name', 'username', 'email'];

  function getUser() {
    try {
      if (window.localStorage.getItem(initializedKey) !== 'true') {
        window.localStorage.removeItem('atelierUser');
        window.localStorage.setItem(initializedKey, 'true');
        return null;
      }

      const saved = window.localStorage.getItem('atelierUser');
      if (!saved) return null;

      const user = JSON.parse(saved);
      if (
        user
        && typeof user === 'object'
        && !Array.isArray(user)
        && validUserFields.some((field) => typeof user[field] === 'string' && user[field].trim())
      ) {
        return user;
      }
      if (user) console.error('The stored Atelier user session has an invalid shape.');
      return null;
    } catch (error) {
      console.error('Unable to verify the Atelier user session.', error);
      return null;
    }
  }

  function prepareLoginRedirect() {
    try {
      window.sessionStorage.setItem(redirectKey, window.location.href);
      return true;
    } catch (error) {
      console.error('Unable to save the page to return to after login.', error);
      return false;
    }
  }

  function consumeRedirectAfterLogin(fallback) {
    try {
      const saved = window.sessionStorage.getItem(redirectKey);
      window.sessionStorage.removeItem(redirectKey);
      if (!saved) return fallback;

      const destination = new URL(saved, window.location.href);
      const currentDirectory = window.location.pathname.slice(0, window.location.pathname.lastIndexOf('/') + 1);
      const allowedPages = [`${currentDirectory}marketplace.html`, `${currentDirectory}cart.html`];
      if (
        destination.protocol === window.location.protocol
        && destination.host === window.location.host
        && allowedPages.includes(destination.pathname)
      ) {
        return destination.href;
      }
      console.error('The saved post-login destination is not an allowed Atelier page.');
    } catch (error) {
      console.error('Unable to restore the saved Atelier page after login.', error);
    }
    return fallback;
  }

  window.atelierAuth = Object.freeze({
    getUser,
    isAuthenticated: () => Boolean(getUser()),
    prepareLoginRedirect,
    consumeRedirectAfterLogin
  });
})();

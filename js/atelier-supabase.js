(() => {
  'use strict';

  const SUPABASE_URL = 'https://sktkevlfxjppfpjmxguy.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_0jOs1sVk5nRJj1SY9VrgKw_Eoc08C0N';
  const CLOUDINARY_CLOUD_NAME = 'lify0b3k';
  const CLOUDINARY_UPLOAD_PRESET = 'atelier_unsigned';
  const ACTIVE_PROFILE_ID_KEY = 'atelier_active_profile_id';
  const LEGACY_PROFILE_KEYS = [
    'atelier_profile',
    'atelier_user',
    'atelier_current_user',
    'atelierUser',
    'atelierSessionInitialized'
  ];

  function getClient() {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      throw new Error('Supabase is unavailable. Check your connection and try again.');
    }
    if (!window.atelierSupabaseClient) {
      window.atelierSupabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    }
    return window.atelierSupabaseClient;
  }

  function normalizeUsername(value) {
    return String(value || '')
      .trim()
      .replace(/^@/, '')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 30);
  }

  function displayRole(role) {
    const roles = {
      member: 'Member',
      student: 'Member',
      tailor: 'Tailor / Designer',
      seller: 'Seller'
    };
    return roles[String(role || '').toLowerCase()] || 'Member';
  }

  function profileFromRow(row) {
    if (!row || typeof row !== 'object') {
      throw new Error('Supabase returned an invalid profile row.');
    }
    return {
      id: row.id || '',
      username: normalizeUsername(row.username),
      display_name: String(row.display_name || row.username || 'Atelier Member'),
      email: String(row.email || ''),
      bio: String(row.bio || ''),
      avatar_url: String(row.avatar_url || ''),
      banner_url: String(row.banner_url || ''),
      role: String(row.role || 'member').toLowerCase(),
      location: String(row.location || ''),
      specialty: String(row.specialty || ''),
      profile_completed: typeof row.profile_completed === 'boolean' ? row.profile_completed : null,
      role_details: row.role_details && typeof row.role_details === 'object' && !Array.isArray(row.role_details)
        ? row.role_details
        : {}
    };
  }

  function profileStorageKey(userId) {
    return `atelier_profile_${String(userId || '')}`;
  }

  function clearLegacyProfileKeys() {
    LEGACY_PROFILE_KEYS.forEach((key) => window.localStorage.removeItem(key));
  }

  function cacheProfile(profile) {
    const normalized = profileFromRow(profile);
    if (!normalized.id) throw new Error('Cannot cache a profile without a user ID.');
    try {
      window.localStorage.setItem(profileStorageKey(normalized.id), JSON.stringify(normalized));
      window.localStorage.setItem(ACTIVE_PROFILE_ID_KEY, normalized.id);
      clearLegacyProfileKeys();
    } catch (error) {
      console.error('Unable to cache the Atelier profile.', error);
      throw new Error('Could not save your profile in this browser. Check storage settings and try again.');
    }
    window.dispatchEvent(new CustomEvent('atelier:profile-updated', { detail: normalized }));
    return normalized;
  }

  function readCachedProfile(userId) {
    try {
      const activeId = String(userId || window.localStorage.getItem(ACTIVE_PROFILE_ID_KEY) || '');
      if (!activeId) return null;
      const current = JSON.parse(window.localStorage.getItem(profileStorageKey(activeId)) || 'null');
      if (!current || typeof current !== 'object' || Array.isArray(current)) return null;
      if (String(current.id || '') !== activeId) return null;
      return profileFromRow(current);
    } catch (error) {
      console.error('Unable to read the cached Atelier profile.', error);
      return null;
    }
  }

  function clearCachedProfileActivation() {
    try {
      window.localStorage.removeItem(ACTIVE_PROFILE_ID_KEY);
      clearLegacyProfileKeys();
      window.dispatchEvent(new CustomEvent('atelier:profile-updated', { detail: null }));
    } catch (error) {
      console.error('Unable to clear the active Atelier profile cache.', error);
    }
  }

  function clearAllAtelierStorage() {
    const keys = [];
    const errors = [];
    try {
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (key && key.startsWith('atelier_')) keys.push(key);
      }
    } catch (error) {
      errors.push(error);
    }

    keys.forEach((key) => {
      try {
        window.localStorage.removeItem(key);
      } catch (error) {
        errors.push(error);
      }
    });

    try {
      window.dispatchEvent(new CustomEvent('atelier:profile-updated', { detail: null }));
    } catch (error) {
      errors.push(error);
    }
    return errors;
  }

  function profileDefaults(user, metadata) {
    const details = metadata || user.user_metadata || {};
    const email = String(user.email || '');
    const emailPrefix = email.split('@')[0];
    const googleName = [details.given_name, details.family_name].filter(Boolean).join(' ');
    const displayName = String(details.display_name || details.full_name || details.name || googleName || emailPrefix || 'Atelier Member');
    const username = normalizeUsername(details.username || details.user_name || email.split('@')[0] || displayName) || `member_${String(user.id).slice(0, 8)}`;
    const role = ['member', 'tailor', 'seller'].includes(String(details.role || '').toLowerCase())
      ? String(details.role).toLowerCase()
      : 'member';
    return {
      id: user.id,
      username,
      display_name: displayName,
      bio: '',
      avatar_url: '',
      banner_url: '',
      role,
      location: '',
      specialty: '',
      profile_completed: false,
      role_details: {}
    };
  }

  async function fetchProfile(user, options) {
    const client = getClient();
    const settings = options || {};
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .limit(1);
    if (error) throw error;
    if (data && data.length) return profileFromRow(data[0]);
    if (!settings.createIfMissing) {
      throw new Error('Your profile row was not created. Check the on_auth_user_created database trigger and profile access policy.');
    }

    const defaults = profileDefaults(user, settings.metadata);
    const optionalColumns = ['location', 'specialty', 'profile_completed'];
    const profileDefaultsPayload = { ...defaults };
    let created;
    while (true) {
      const { data, error: createError } = await client
        .from('profiles')
        .upsert(profileDefaultsPayload, { onConflict: 'id' })
        .select('*')
        .single();
      if (!createError) {
        created = data;
        break;
      }

      const errorText = `${createError.message || ''} ${createError.details || ''}`.toLowerCase();
      const missingColumn = ['42703', 'PGRST204'].includes(createError.code)
        && optionalColumns.find((column) => (
          Object.prototype.hasOwnProperty.call(profileDefaultsPayload, column)
          && errorText.includes(column)
        ));
      if (!missingColumn) throw createError;
      delete profileDefaultsPayload[missingColumn];
    }
    return profileFromRow(created);
  }

  async function cacheAuthenticatedProfile(user, options) {
    const profile = await fetchProfile(user, options);
    profile.email = user.email || '';
    return cacheProfile(profile);
  }

  async function getSession() {
    const { data, error } = await getClient().auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async function uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData
    });
    const result = await response.json();
    if (!response.ok || !result || typeof result.secure_url !== 'string') {
      throw new Error(result && result.error && result.error.message
        ? result.error.message
        : 'Cloudinary could not upload this image.');
    }
    return result.secure_url;
  }

  try {
    clearLegacyProfileKeys();
  } catch (error) {
    console.error('Unable to remove the legacy shared profile cache.', error);
  }

  window.atelierSupabase = Object.freeze({
    activeProfileIdKey: ACTIVE_PROFILE_ID_KEY,
    getClient,
    normalizeUsername,
    displayRole,
    profileFromRow,
    cacheProfile,
    clearCachedProfileActivation,
    clearAllAtelierStorage,
    profileStorageKey,
    readCachedProfile,
    fetchProfile,
    cacheAuthenticatedProfile,
    getSession,
    uploadImage
  });
})();

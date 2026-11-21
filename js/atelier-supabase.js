(() => {
  'use strict';

  const SUPABASE_URL = 'https://sktkevlfxjppfpjmxguy.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_0jOs1sVk5nRJj1SY9VrgKw_Eoc08C0N';
  const CLOUDINARY_CLOUD_NAME = 'lify0b3k';
  const CLOUDINARY_UPLOAD_PRESET = 'atelier_unsigned';
  const CURRENT_USER_KEY = 'atelier_current_user';

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
      bio: String(row.bio || ''),
      avatar_url: String(row.avatar_url || ''),
      banner_url: String(row.banner_url || ''),
      role: String(row.role || 'member').toLowerCase(),
      role_details: row.role_details && typeof row.role_details === 'object' && !Array.isArray(row.role_details)
        ? row.role_details
        : {}
    };
  }

  function cacheProfile(profile) {
    const normalized = profileFromRow(profile);
    const legacy = {
      id: normalized.id,
      username: `@${normalized.username}`,
      name: normalized.display_name,
      displayName: normalized.display_name,
      email: normalized.email || '',
      bio: normalized.bio,
      avatarUrl: normalized.avatar_url,
      coverUrl: normalized.banner_url,
      bannerUrl: normalized.banner_url,
      role: displayRole(normalized.role),
      roleKey: normalized.role,
      role_details: normalized.role_details,
      roleDetails: normalized.role_details,
      followingCount: Number(normalized.following_count) || 0,
      followersCount: Number(normalized.followers_count) || 0
    };
    try {
      window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(normalized));
      window.localStorage.setItem('atelierUser', JSON.stringify(legacy));
      window.localStorage.setItem('atelierSessionInitialized', 'true');
    } catch (error) {
      console.error('Unable to cache the Atelier profile.', error);
      throw new Error('Could not save your profile in this browser. Check storage settings and try again.');
    }
    window.dispatchEvent(new CustomEvent('atelier:profile-updated', { detail: normalized }));
    return normalized;
  }

  function readCachedProfile() {
    try {
      const current = JSON.parse(window.localStorage.getItem(CURRENT_USER_KEY) || 'null');
      if (current && typeof current === 'object' && !Array.isArray(current)) {
        return profileFromRow(current);
      }
      const legacy = JSON.parse(window.localStorage.getItem('atelierUser') || 'null');
      if (!legacy || typeof legacy !== 'object' || Array.isArray(legacy)) return null;
      return profileFromRow({
        id: legacy.id,
        username: legacy.username,
        display_name: legacy.display_name || legacy.displayName || legacy.name,
        bio: legacy.bio,
        avatar_url: legacy.avatar_url || legacy.avatarUrl,
        banner_url: legacy.banner_url || legacy.bannerUrl || legacy.coverUrl,
        role: legacy.roleKey || legacy.role,
        role_details: legacy.role_details || legacy.roleDetails
      });
    } catch (error) {
      console.error('Unable to read the cached Atelier profile.', error);
      return null;
    }
  }

  function profileDefaults(user, metadata) {
    const details = metadata || user.user_metadata || {};
    const email = String(user.email || '');
    const displayName = String(details.display_name || details.full_name || details.name || email.split('@')[0] || 'Atelier Member');
    const username = normalizeUsername(details.username || details.user_name || email.split('@')[0] || displayName) || `member_${String(user.id).slice(0, 8)}`;
    const role = ['member', 'tailor', 'seller'].includes(String(details.role || '').toLowerCase())
      ? String(details.role).toLowerCase()
      : 'member';
    return { id: user.id, username, display_name: displayName, role };
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
    const { data: created, error: createError } = await client
      .from('profiles')
      .upsert(defaults, { onConflict: 'id' })
      .select('*')
      .single();
    if (createError) throw createError;
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

  window.atelierSupabase = Object.freeze({
    currentUserKey: CURRENT_USER_KEY,
    getClient,
    normalizeUsername,
    displayRole,
    profileFromRow,
    cacheProfile,
    readCachedProfile,
    fetchProfile,
    cacheAuthenticatedProfile,
    getSession,
    uploadImage
  });
})();

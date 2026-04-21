import { authFetch } from './fetcher.js';

const API_BASE = 'https://v2.api.noroff.dev';

/**
 * fetch profile details for a user
 * @param {string} profileName
 * @param {string} accessToken
 * @param {string} apiKey
 */
export async function fetchProfile(profileName, accessToken, apiKey) {
  const res = await authFetch(
    `${API_BASE}/social/profiles/${encodeURIComponent(profileName)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Noroff-API-Key': apiKey,
      },
    },
  );

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.errors?.[0]?.message ?? `Could not load profile (HTTP ${res.status})`);
  }

  return json.data;
}

/**
 * create post
 * @param {{ title: string, body: string, media?: { url: string, alt: string } }} post
 * @param {string} accessToken
 * @param {string} apiKey
 */
export async function createPost(post, accessToken, apiKey) {
  const res = await authFetch(`${API_BASE}/social/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'X-Noroff-API-Key': apiKey,
    },
    body: JSON.stringify(post),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.errors?.[0]?.message ?? `Could not publish post (HTTP ${res.status})`);
  }
  return json.data;
}

/**
 * fetch latest posts for a profile name
 * @param {string} profileName
 * @param {string} accessToken
 * @param {string} apiKey
 */
export async function fetchProfilePosts(profileName, accessToken, apiKey) {
  const res = await authFetch(
    `${API_BASE}/social/profiles/${encodeURIComponent(profileName)}/posts?_author=true&sort=created&sortOrder=desc`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Noroff-API-Key': apiKey,
      },
    },
  );

  const json = await res.json();
  if (!res.ok) {
    throw new Error(
      json.errors?.[0]?.message ?? `Could not load posts (HTTP ${res.status})`,
    );
  }

  return Array.isArray(json.data) ? json.data : [];
}

/**
 * fetch all posts from the social feed
 * results are sorted
 * @param {string} accessToken bearer access token
 * @param {string} apiKey Noroff API key
 * @param {string} [query=''] optional text search query
 * @returns {Promise<Array>} array of post objects
 */
export async function fetchAllPosts(accessToken, apiKey, query = '') {
  const params = new URLSearchParams({
    _author: 'true',
    sort: 'created',
    sortOrder: 'desc',
    limit: '100',
  });
  if (query.trim()) params.set('q', query.trim());

  const res = await authFetch(`${API_BASE}/social/posts?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Noroff-API-Key': apiKey,
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.errors?.[0]?.message ?? `Could not load posts (HTTP ${res.status})`);
  }

  return Array.isArray(json.data) ? json.data : [];
}

/**
 * fetch a single post.
 * @param {string} postId
 * @param {string} accessToken
 * @param {string} apiKey
 * @returns {Promise<object>}
 */
export async function fetchPostById(postId, accessToken, apiKey) {
  const res = await authFetch(
    `${API_BASE}/social/posts/${encodeURIComponent(postId)}?_author=true&_comments=true&_reactions=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Noroff-API-Key': apiKey,
      },
    },
  );

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.errors?.[0]?.message ?? `Could not load post (HTTP ${res.status})`);
  }

  return json.data;
}

/**
 * update an existing post.
 * @param {string} postId
 * @param {{ title?: string, body?: string, media?: { url: string, alt: string } }} updates
 * @param {string} accessToken
 * @param {string} apiKey
 * @returns {Promise<object>}
 */
export async function updatePost(postId, updates, accessToken, apiKey) {
  const res = await authFetch(
    `${API_BASE}/social/posts/${encodeURIComponent(postId)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Noroff-API-Key': apiKey,
      },
      body: JSON.stringify(updates),
    },
  );

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.errors?.[0]?.message ?? `Could not update post (HTTP ${res.status})`);
  }

  return json.data;
}

/**
 * delete an existing post.
 * @param {string} postId
 * @param {string} accessToken
 * @param {string} apiKey
 * @returns {Promise<boolean>}
 */
export async function deletePost(postId, accessToken, apiKey) {
  const res = await authFetch(
    `${API_BASE}/social/posts/${encodeURIComponent(postId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Noroff-API-Key': apiKey,
      },
    },
  );

  if (!res.ok) {
    let message = `Could not delete post (HTTP ${res.status})`;
    try {
      const json = await res.json();
      message = json.errors?.[0]?.message ?? message;
    } catch {
    }
    throw new Error(message);
  }

  return true;
}

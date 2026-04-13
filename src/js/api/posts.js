const API_BASE = 'https://v2.api.noroff.dev';

/**
 * create post
 * @param {{ title: string, body: string, media?: { url: string, alt: string } }} post
 * @param {string} accessToken
 * @param {string} apiKey
 */
export async function createPost(post, accessToken, apiKey) {
  const res = await fetch(`${API_BASE}/social/posts`, {
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
  const res = await fetch(
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

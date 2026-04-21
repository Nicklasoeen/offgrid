import { createApiKey } from '../api/auth.js';
import { fetchProfile, fetchProfilePosts } from '../api/posts.js';
import { getApiKey, getToken, getUser, setApiKey } from '../utils/storage.js';

export function initProfilePage() {
  const loggedInUser = getUser();
  const token = getToken();
  const postsContainer = document.querySelector('[data-profile-posts]');
  const emptyState = document.querySelector('[data-profile-empty]');

  if (!loggedInUser || !token || !postsContainer || !emptyState) return;

  const requestedProfileName =
    new URLSearchParams(window.location.search).get('user')?.trim() ||
    loggedInUser.name;

  const navInitials = initialsFrom(loggedInUser.name || 'Explorer');
  setText('[data-nav-avatar]', navInitials);

  hydrateProfilePage(requestedProfileName, loggedInUser, token, postsContainer, emptyState).catch(() => {
    emptyState.hidden = false;
    emptyState.textContent = 'Could not load profile activity right now.';
  });
}

async function hydrateProfilePage(profileName, loggedInUser, token, postsContainer, emptyState) {
  const apiKey = await ensureApiKey(token);
  const [profile, posts] = await Promise.all([
    fetchProfile(profileName, token, apiKey),
    fetchProfilePosts(profileName, token, apiKey),
  ]);

  hydrateProfileHeader(profile, loggedInUser);
  hydrateProfilePosts(postsContainer, emptyState, posts, profileName);
}

function hydrateProfileHeader(profile, loggedInUser) {
  const name = profile?.name || 'Explorer';
  const isOwnProfile = name === loggedInUser?.name;
  const email = isOwnProfile
    ? loggedInUser?.email || 'No email saved'
    : profile?.email || 'Email hidden';
  const initials = initialsFrom(name);

  setText('[data-profile-name]', name);
  setText('[data-profile-username]', name);
  setText('[data-profile-email-secondary]', email);
  setText('[data-profile-avatar]', initials);
}

function hydrateProfilePosts(postsContainer, emptyState, posts, fallbackName) {
  postsContainer.innerHTML = '';

  posts.slice(0, 12).forEach((post) => {
    postsContainer.append(createPostCard(post, fallbackName));
  });

  emptyState.hidden = posts.length > 0;
}

async function ensureApiKey(token) {
  let apiKey = getApiKey();
  if (!apiKey) {
    apiKey = await createApiKey(token);
    setApiKey(apiKey);
  }
  return apiKey;
}

function createPostCard(post, fallbackName) {
  const postId = String(post.id ?? post._id ?? '');
  const postUrl = postId ? `/post.html?id=${encodeURIComponent(postId)}` : '/profile.html';
  const name = post.author?.name || fallbackName || 'You';
  const initials = initialsFrom(name);
  const reactions = Number(post._count?.reactions ?? 0);
  const comments = Number(post._count?.comments ?? 0);
  const createdText = post.created ? formatRelativeTime(post.created) : 'Just now';

  const card = document.createElement('article');
  card.className = 'card post-card';
  card.innerHTML = `
    <div class="post-header">
      <div class="avatar-md">${escapeHtml(initials)}</div>
      <div class="post-meta">
        <div class="post-name-row">
          <a href="/profile.html?user=${encodeURIComponent(name)}" class="post-author-name">${escapeHtml(name)}</a>
        </div>
        <p class="post-headline">${escapeHtml(createdText)}</p>
      </div>
    </div>
    <div class="post-text">
      <a href="${postUrl}" class="post-open-link" aria-label="Open post by ${escapeAttr(name)}">
        <p>${escapeHtml(post.body || '')}</p>
      </a>
    </div>
    <div class="post-counts">
      <span>👍 ${reactions}</span>
      <span>${comments} comments</span>
    </div>
  `;

  if (post.media?.url) {
    const media = document.createElement('div');
    media.className = 'post-media';
    media.innerHTML = `<img class="post-media-image" src="${escapeAttr(post.media.url)}" alt="${escapeAttr(post.media.alt || 'Post media')}" />`;
    card.querySelector('.post-text')?.insertAdjacentElement('afterend', media);
  }

  return card;
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function initialsFrom(name) {
  const parts = String(name).split(' ').filter(Boolean);
  if (parts.length === 0) return 'OG';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function formatRelativeTime(isoDate) {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
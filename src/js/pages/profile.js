import { createApiKey } from '../api/auth.js';
import { fetchProfilePosts } from '../api/posts.js';
import { getApiKey, getToken, getUser, setApiKey } from '../utils/storage.js';

export function initProfilePage() {
  const user = getUser();
  const token = getToken();
  const postsContainer = document.querySelector('[data-profile-posts]');
  const emptyState = document.querySelector('[data-profile-empty]');

  if (!user || !token || !postsContainer || !emptyState) return;

  hydrateProfileHeader(user);
  hydrateProfilePosts(user, token, postsContainer, emptyState).catch(() => {
    emptyState.hidden = false;
    emptyState.textContent = 'Could not load your profile activity right now.';
  });
}

function hydrateProfileHeader(user) {
  const name = user.name || 'Explorer';
  const email = user.email || 'No email saved';
  const initials = initialsFrom(name);

  setText('[data-profile-name]', name);
  setText('[data-profile-username]', name);
  setText('[data-profile-email-secondary]', email);
  setText('[data-profile-avatar]', initials);
  setText('[data-nav-avatar]', initials);
}

async function hydrateProfilePosts(user, token, postsContainer, emptyState) {
  const profileName = user.name;
  const apiKey = await ensureApiKey(token);

  const posts = await fetchProfilePosts(profileName, token, apiKey);

  postsContainer.innerHTML = '';

  posts.slice(0, 12).forEach((post) => {
    postsContainer.append(createPostCard(post, profileName));
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
          <a href="/profile.html" class="post-author-name">${escapeHtml(name)}</a>
        </div>
        <p class="post-headline">${escapeHtml(createdText)}</p>
      </div>
    </div>
    <div class="post-text">
      <p>${escapeHtml(post.body || '')}</p>
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
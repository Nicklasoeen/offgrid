import { createApiKey } from '../api/auth.js';
import { fetchPostById } from '../api/posts.js';
import { getApiKey, getToken, getUser, setApiKey } from '../utils/storage.js';

export async function initPostPage() {
  const container = document.querySelector('[data-post-container]');
  const empty = document.querySelector('[data-post-empty]');
  if (!container || !empty) return;

  const user = getUser();
  if (user?.name) {
    const navAvatar = document.querySelector('[data-nav-avatar]');
    if (navAvatar) navAvatar.textContent = initialsFrom(user.name);
  }

  const postId = new URLSearchParams(window.location.search).get('id');
  if (!postId) {
    showEmpty(empty, 'Post id is missing. Open a post from the feed.');
    return;
  }

  const token = getToken();
  if (!token) {
    window.location.replace('/login.html');
    return;
  }

  try {
    const apiKey = await ensureApiKey(token);
    const post = await fetchPostById(postId, token, apiKey);
    container.innerHTML = '';
    container.append(createPostCard(post));
    empty.hidden = true;

    const authorName = post.author?.name ? ` by ${post.author.name}` : '';
    document.title = `Offgrid | Post${authorName}`;
  } catch (error) {
    showEmpty(empty, error.message ?? 'Could not load this post.');
  }
}

async function ensureApiKey(token) {
  let apiKey = getApiKey();
  if (!apiKey) {
    apiKey = await createApiKey(token);
    setApiKey(apiKey);
  }
  return apiKey;
}

function showEmpty(element, message) {
  element.textContent = message;
  element.hidden = false;
}

function createPostCard(post) {
  const name = post.author?.name || 'Explorer';
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

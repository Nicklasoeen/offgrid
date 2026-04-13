import { createApiKey } from '../api/auth.js';
import { createPost, fetchProfilePosts } from '../api/posts.js';
import { getApiKey, getToken, getUser, setApiKey } from '../utils/storage.js';

export function initFeedPage() {
  const form = document.querySelector('[data-create-post-form]');
  if (!form) return;

  const feedbackEl = form.querySelector('[data-composer-feedback]');
  const submitBtn = form.querySelector('.composer-submit');

  hydratePosts().catch(() => {
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setFeedback(feedbackEl, '', '');

    const formData = new FormData(form);
    const body = String(formData.get('body') ?? '').trim();
    const mediaUrl = String(formData.get('mediaUrl') ?? '').trim();

    if (body.length < 3) {
      setFeedback(feedbackEl, 'Post text must be at least 3 characters.', 'error');
      return;
    }

    const token = getToken();
    if (!token) {
      window.location.replace('/login.html');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Publishing...';

    try {
      const apiKey = await ensureApiKey(token);

      const title = body.slice(0, 50);
      const payload = { title, body };
      if (mediaUrl) payload.media = { url: mediaUrl, alt: title };

      const createdPost = await createPost(payload, token, apiKey);
      prependPostCard(createdPost, true);

      form.reset();
      setFeedback(feedbackEl, 'Adventure published.', 'success');
    } catch (error) {
      setFeedback(feedbackEl, error.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Publish';
    }
  });
}

async function hydratePosts() {
  const token = getToken();
  const user = getUser();
  if (!token || !user?.name) return;

  const apiKey = await ensureApiKey(token);
  const posts = await fetchProfilePosts(user.name, token, apiKey);

  // render newest first
  posts.slice(0, 8).reverse().forEach((post) => prependPostCard(post, true));
}

async function ensureApiKey(token) {
  let apiKey = getApiKey();
  if (!apiKey) {
    apiKey = await createApiKey(token);
    setApiKey(apiKey);
  }
  return apiKey;
}

function setFeedback(element, message, kind) {
  if (!element) return;
  element.textContent = message;
  element.hidden = !message;
  element.classList.remove('is-error', 'is-success');
  if (kind === 'error') element.classList.add('is-error');
  if (kind === 'success') element.classList.add('is-success');
}

function prependPostCard(post, isApiPost = false) {
  const feed = document.querySelector('.feed-center');
  const firstPost = feed?.querySelector('.post-card');
  if (!feed || !firstPost) return;

  const user = getUser();
  const name = user?.name || post.author?.name || 'You';
  const initials = initialsFrom(name);

  const card = document.createElement('article');
  card.className = 'card post-card';
  if (isApiPost) card.dataset.generatedPost = 'true';
  card.innerHTML = `
    <div class="post-header">
      <div class="avatar-md">${escapeHtml(initials)}</div>
      <div class="post-meta">
        <div class="post-name-row">
          <a href="#" class="post-author-name">${escapeHtml(name)}</a>
        </div>
        <p class="post-headline">Just now</p>
      </div>
    </div>
    <div class="post-text">
      <p>${escapeHtml(post.body || '')}</p>
    </div>
    <div class="post-counts">
      <span>👍 0</span>
      <span>0 comments</span>
    </div>
    <div class="post-action-bar">
      <button class="action-btn" type="button" aria-label="Like">
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
        </svg>
      </button>
      <button class="action-btn" type="button" aria-label="Comment">
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z" />
        </svg>
      </button>
    </div>
  `;

  if (post.media?.url) {
    const media = document.createElement('div');
    media.className = 'post-media';
    media.innerHTML = `<img class="post-media-image" src="${escapeAttr(post.media.url)}" alt="${escapeAttr(post.media.alt || 'Post media')}" />`;
    card.querySelector('.post-text')?.insertAdjacentElement('afterend', media);
  }

  feed.insertBefore(card, firstPost);
}

function initialsFrom(name) {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return 'OG';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value);
}

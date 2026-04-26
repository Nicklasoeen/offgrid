import { createApiKey } from '../api/auth.js';
import { createPost, fetchAllPosts } from '../api/posts.js';
import { getApiKey, getToken, getUser, setApiKey } from '../utils/storage.js';

export function initFeedPage() {
  const form = document.querySelector('[data-create-post-form]');
  const postsContainer = document.querySelector('[data-feed-posts]');
  const emptyState = document.querySelector('[data-feed-empty]');
  const searchForm = document.querySelector('[data-search-form]');
  const searchInput = document.querySelector('[data-search-input]');
  if (!form || !postsContainer || !emptyState) return;

  const currentUser = getUser();
  if (currentUser?.name) {
    const initials = initialsFrom(currentUser.name);
    const navAvatar = document.querySelector('[data-nav-avatar]');
    if (navAvatar) navAvatar.textContent = initials;
    const composerAvatar = document.querySelector('[data-composer-avatar]');
    if (composerAvatar) composerAvatar.textContent = initials;
    const sidebarAvatar = document.querySelector('[data-sidebar-avatar]');
    if (sidebarAvatar) sidebarAvatar.textContent = initials;
    const sidebarName = document.querySelector('[data-sidebar-name]');
    if (sidebarName) sidebarName.textContent = currentUser.name;
  }

  const feedbackEl = form.querySelector('[data-composer-feedback]');
  const submitBtn = form.querySelector('.composer-submit');
  const loadMoreBtn = document.querySelector('[data-load-more-btn]');
  const defaultEmptyText = 'No posts yet. Publish your first adventure.';
  let allPosts = [];
  let currentPage = 1;
  let isLastPage = false;
  let isLoading = false;

  hydratePosts(feedbackEl, 1)
    .then(({ posts, meta }) => {
      allPosts = posts;
      currentPage = 1;
      isLastPage = meta.isLastPage ?? true;
      renderPosts(postsContainer, emptyState, allPosts, currentUser, defaultEmptyText);
      if (loadMoreBtn) loadMoreBtn.hidden = isLastPage;
    })
    .catch((error) => {
      setFeedback(feedbackEl, error.message ?? 'Could not load posts.', 'error');
    });

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', async () => {
      if (isLoading || isLastPage) return;
      isLoading = true;
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = 'Loading…';
      try {
        const token = getToken();
        if (!token) return;
        const apiKey = await ensureApiKey(token);
        const { posts: morePosts, meta } = await fetchAllPosts(token, apiKey, { page: currentPage + 1 });
        currentPage += 1;
        isLastPage = meta.isLastPage ?? true;
        allPosts = [...allPosts, ...morePosts];
        morePosts.forEach((post) => postsContainer.append(createPostCard(post, currentUser)));
        updateEmptyState(postsContainer, emptyState);
        loadMoreBtn.hidden = isLastPage;
      } catch (err) {
        setFeedback(feedbackEl, err.message ?? 'Could not load more posts.', 'error');
      } finally {
        isLoading = false;
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = 'Load more';
      }
    });
  }

  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = searchInput.value;
      renderFilteredPosts(postsContainer, emptyState, allPosts, currentUser, query, defaultEmptyText);
      if (loadMoreBtn) loadMoreBtn.hidden = !!query.trim() || isLastPage;
    });
    searchInput.addEventListener('input', () => {
      if (!searchInput.value.trim() && loadMoreBtn) loadMoreBtn.hidden = isLastPage;
    });
  }

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
      window.location.replace('./login.html');
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
      allPosts.unshift(createdPost);
      const queryValue = searchInput?.value ?? '';
      renderFilteredPosts(
        postsContainer,
        emptyState,
        allPosts,
        currentUser,
        queryValue,
        defaultEmptyText,
      );

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

/**
 * Loads all posts from the API for feed rendering.
 * @param {HTMLElement|null} feedbackEl - optional element for error feedback
 * @returns {Promise<Array>} Array of posts
 */
async function hydratePosts(feedbackEl, page = 1) {
  const token = getToken();
  if (!token) return { posts: [], meta: {} };

  try {
    const apiKey = await ensureApiKey(token);
    return await fetchAllPosts(token, apiKey, { page });
  } catch (error) {
    setFeedback(feedbackEl, error.message ?? 'Could not load posts.', 'error');
    return { posts: [], meta: {} };
  }
}

function renderFilteredPosts(postsContainer, emptyState, allPosts, user, query, defaultEmptyText) {
  const filteredPosts = filterPosts(allPosts, query);
  const activeQuery = String(query ?? '').trim();
  const emptyMessage = activeQuery
    ? `No posts matched "${activeQuery}".`
    : defaultEmptyText;

  renderPosts(postsContainer, emptyState, filteredPosts, user, emptyMessage);
}

function renderPosts(postsContainer, emptyState, posts, user, emptyMessage) {
  postsContainer.innerHTML = '';
  posts.forEach((post) => {
    postsContainer.append(createPostCard(post, user));
  });

  emptyState.textContent = emptyMessage;
  updateEmptyState(postsContainer, emptyState);
}

function filterPosts(posts, query) {
  const searchTerm = String(query ?? '').trim().toLowerCase();
  if (!searchTerm) return posts;

  return posts.filter((post) => {
    const body = String(post.body ?? '').toLowerCase();
    const title = String(post.title ?? '').toLowerCase();
    const author = String(post.author?.name ?? '').toLowerCase();
    return body.includes(searchTerm) || title.includes(searchTerm) || author.includes(searchTerm);
  });
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

function createPostCard(post, user) {
  const postId = String(post.id ?? post._id ?? '');
  const postUrl = postId ? `./post.html?id=${encodeURIComponent(postId)}` : './index.html';
  const name = post.author?.name || user?.name || 'You';
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
          <a href="./profile.html?user=${encodeURIComponent(name)}" class="post-author-name">${escapeHtml(name)}</a>
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

  return card;
}

function updateEmptyState(postsContainer, emptyState) {
  emptyState.hidden = postsContainer.children.length > 0;
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

function formatRelativeTime(isoDate) {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

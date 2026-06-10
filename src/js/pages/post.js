import { createApiKey } from '../api/auth.js';
import { commentOnPost, deletePost, fetchPostById, updatePost } from '../api/posts.js';
import { getApiKey, getToken, getUser, setApiKey } from '../utils/storage.js';

let postState = { post: null, user: null, token: null, apiKey: null, container: null };

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
    window.location.replace('./login.html');
    return;
  }

  try {
    const apiKey = await ensureApiKey(token);
    const post = await fetchPostById(postId, token, apiKey);
    
    postState = { post, user, token, apiKey, container };

    container.innerHTML = '';
    container.append(createPostCard(post, user));
    wireCommentForm(container, post);
    empty.hidden = true;

    const authorName = post.author?.name ? ` by ${post.author.name}` : '';
    document.title = `Offgrid | Post${authorName}`;

    if (window.location.hash === '#comment-form') {
      document.getElementById('comment-form')?.focus();
    }
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

async function showEditForm(post, card) {
  const dialog = document.createElement('div');
  dialog.className = 'edit-modal';
  dialog.innerHTML = `
    <div class="edit-modal-content">
      <h2>Edit Post</h2>
      <form class="edit-form">
        <textarea
          name="body"
          placeholder="Post content..."
          minlength="3"
          maxlength="280"
          required
        >${escapeHtml(post.body || '')}</textarea>
        <input
          type="url"
          name="mediaUrl"
          placeholder="Optional photo URL"
          value="${escapeAttr(post.media?.url || '')}"
        />
        <p class="edit-feedback" hidden></p>
        <div class="edit-actions">
          <button type="button" class="btn-cancel">Cancel</button>
          <button type="submit" class="btn-save">Save</button>
        </div>
      </form>
    </div>
  `;

  document.body.append(dialog);

  const form = dialog.querySelector('.edit-form');
  const feedback = dialog.querySelector('.edit-feedback');
  const cancelBtn = dialog.querySelector('.btn-cancel');
  const saveBtn = dialog.querySelector('.btn-save');

  cancelBtn.addEventListener('click', () => {
    dialog.remove();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    saveBtn.disabled = true;
    feedback.hidden = true;

    const formData = new FormData(form);
    const body = String(formData.get('body') ?? '').trim();
    const mediaUrl = String(formData.get('mediaUrl') ?? '').trim();

    if (body.length < 3) {
      showFeedback(feedback, 'Post must be at least 3 characters.', 'error');
      saveBtn.disabled = false;
      return;
    }

    try {
      const title = body.slice(0, 50);
      const updates = { title, body };
      if (mediaUrl) updates.media = { url: mediaUrl, alt: title };

      const updated = await updatePost(post.id, updates, postState.token, postState.apiKey);
      postState.post = updated;

      dialog.remove();

      postState.container.innerHTML = '';
      postState.container.append(createPostCard(updated, postState.user));
      showFeedback(document.querySelector('[data-post-empty]'), 'Post updated.', 'success');
    } catch (error) {
      showFeedback(feedback, error.message, 'error');
      saveBtn.disabled = false;
    }
  });
}

function showFeedback(element, message, kind) {
  if (!element) return;
  element.textContent = message;
  element.hidden = !message;
  element.classList.remove('is-error', 'is-success');
  if (kind === 'error') element.classList.add('is-error');
  if (kind === 'success') element.classList.add('is-success');
}

function wireOwnerMenu(card, post) {
  const toggleBtn = card.querySelector('.btn-owner-menu');
  const menu = card.querySelector('.owner-menu');
  const editAction = card.querySelector('[data-owner-action="edit"]');
  const deleteAction = card.querySelector('[data-owner-action="delete"]');

  if (!toggleBtn || !menu || !editAction || !deleteAction) return;

  toggleBtn.addEventListener('click', () => {
    const shouldOpen = menu.hidden;
    menu.hidden = !shouldOpen;
    toggleBtn.setAttribute('aria-expanded', String(shouldOpen));
  });

  editAction.addEventListener('click', () => {
    menu.hidden = true;
    toggleBtn.setAttribute('aria-expanded', 'false');
    showEditForm(post, card);
  });

  deleteAction.addEventListener('click', () => {
    menu.hidden = true;
    toggleBtn.setAttribute('aria-expanded', 'false');
    handleDeletePost(post.id);
  });

  card.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      menu.hidden = true;
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

async function handleDeletePost(postId) {
  if (!postId) return;

  const confirmed = window.confirm('Delete this post permanently?');
  if (!confirmed) return;

  try {
    await deletePost(postId, postState.token, postState.apiKey);
    window.location.replace('./index.html');
  } catch (error) {
    showFeedback(
      document.querySelector('[data-post-empty]'),
      error.message ?? 'Could not delete post.',
      'error',
    );
  }
}

function wireCommentForm(container, post) {
  const form = container.querySelector('[data-comment-form]');
  const input = container.querySelector('[data-comment-input]');
  const feedback = container.querySelector('[data-comment-feedback]');
  const list = container.querySelector('[data-comment-list]');
  const empty = container.querySelector('[data-comment-empty]');
  const count = container.querySelector('[data-comment-total]');
  const submitBtn = container.querySelector('[data-comment-submit]');

  if (!form || !input || !feedback || !list || !empty || !count || !submitBtn) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    showFeedback(feedback, '', '');

    const body = input.value.trim();
    if (body.length < 1) {
      showFeedback(feedback, 'Write a comment before posting.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting...';

    try {
      const createdComment = await commentOnPost(post.id, { body }, postState.token, postState.apiKey);
      const normalizedComment = normalizeComment(createdComment, postState.user);

      post.comments = [normalizedComment, ...(Array.isArray(post.comments) ? post.comments : [])];
      if (!post._count) post._count = { comments: 0, reactions: 0 };
      post._count.comments = Number(post._count.comments ?? 0) + 1;

      renderComments(list, empty, count, post.comments);
      form.reset();
      showFeedback(feedback, 'Comment added.', 'success');
      input.focus();
    } catch (error) {
      showFeedback(feedback, error.message ?? 'Could not add comment.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Post comment';
    }
  });
}

function createPostCard(post, user) {
  const name = post.author?.name || 'Explorer';
  const isOwnPost = user?.name === post.author?.name;
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
      <p>${escapeHtml(post.body || '')}</p>
    </div>
    <div class="post-counts">
      <span>👍 ${reactions}</span>
      <span>${comments} comments</span>
    </div>
    <section class="post-comments-section" aria-labelledby="post-comments-heading">
      <div class="post-comments-header">
        <h2 id="post-comments-heading">Comments</h2>
        <span class="post-comments-total" data-comment-total>${comments}</span>
      </div>
      <form class="post-comment-form" data-comment-form>
        <label class="visually-hidden" for="comment-form">Write a comment</label>
        <textarea
          class="form-control post-comment-input"
          id="comment-form"
          name="body"
          placeholder="Write a comment..."
          maxlength="280"
          required
          data-comment-input
        ></textarea>
        <div class="post-comment-actions">
          <p class="post-feedback post-comment-feedback" data-comment-feedback hidden></p>
          <button class="composer-btn composer-submit post-comment-submit" type="submit" data-comment-submit>
            Post comment
          </button>
        </div>
      </form>
      <p class="post-comments-empty" data-comment-empty hidden>No comments yet. Start the conversation.</p>
      <div class="post-comment-list" data-comment-list></div>
    </section>
    ${
      isOwnPost
        ? `
          <div class="post-owner-controls">
            <button
              class="btn-owner-menu"
              type="button"
              aria-label="Post actions"
              aria-expanded="false"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25zm17.71-10.04a1.003 1.003 0 0 0 0-1.42l-2.5-2.5a1.003 1.003 0 0 0-1.42 0l-1.96 1.96 3.75 3.75 2.13-1.79z"/>
              </svg>
            </button>
            <div class="owner-menu" hidden>
              <button class="owner-menu-item" type="button" data-owner-action="edit">Edit post</button>
              <button class="owner-menu-item owner-menu-item-danger" type="button" data-owner-action="delete">Delete post</button>
            </div>
          </div>
        `
        : ''
    }
  `;

  if (post.media?.url) {
    const media = document.createElement('div');
    media.className = 'post-media';
    media.innerHTML = `<img class="post-media-image" src="${escapeAttr(post.media.url)}" alt="${escapeAttr(post.media.alt || 'Post media')}" />`;
    card.querySelector('.post-text')?.insertAdjacentElement('afterend', media);
  }

  renderComments(
    card.querySelector('[data-comment-list]'),
    card.querySelector('[data-comment-empty]'),
    card.querySelector('[data-comment-total]'),
    post.comments,
  );

  if (isOwnPost) {
    wireOwnerMenu(card, post);
  }

  return card;
}

function renderComments(listElement, emptyElement, countElement, comments) {
  if (!listElement || !emptyElement || !countElement) return;

  const items = Array.isArray(comments) ? comments : [];
  listElement.innerHTML = '';

  items.forEach((comment) => {
    const item = document.createElement('article');
    item.className = 'post-comment-item';

    const authorName = getCommentAuthorName(comment);
    const body = String(comment?.body ?? '').trim();
    const createdText = comment?.created ? formatRelativeTime(comment.created) : 'Just now';

    item.innerHTML = `
      <div class="post-comment-avatar">${escapeHtml(initialsFrom(authorName))}</div>
      <div class="post-comment-body">
        <div class="post-comment-meta">
          <strong>${escapeHtml(authorName)}</strong>
          <span>${escapeHtml(createdText)}</span>
        </div>
        <p>${escapeHtml(body)}</p>
      </div>
    `;

    listElement.append(item);
  });

  countElement.textContent = String(items.length);
  emptyElement.hidden = items.length > 0;
}

function normalizeComment(comment, fallbackUser) {
  if (!comment || typeof comment !== 'object') {
    return { body: '', created: new Date().toISOString(), owner: { name: fallbackUser?.name || 'You' } };
  }

  if (comment.owner?.name || comment.author?.name) {
    return comment;
  }

  return {
    ...comment,
    owner: { name: fallbackUser?.name || 'You' },
    created: comment.created ?? new Date().toISOString(),
  };
}

function getCommentAuthorName(comment) {
  return comment?.owner?.name || comment?.author?.name || 'Explorer';
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

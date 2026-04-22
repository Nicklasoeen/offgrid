# Offgrid

Offgrid is a front-end social media app built for the Noroff Social Media API assignment.

The app lets users register, log in, browse posts, create their own posts, edit/delete their own content, and follow/unfollow other profiles.

## Tech stack

- JavaScript (ES6 modules)
- HTML
- CSS
- Vite
- Noroff Social API v2

## Features

- Register a new user
- Log in as an existing user
- View all posts in a feed
- Search posts in the feed
- Open a single post page
- Create a post
- Edit your own post
- Delete your own post
- View your own profile
- View other user profiles and their posts
- Follow / unfollow users

## Getting started

### 1) Install dependencies

```bash
npm install
```

### 2) Run locally

```bash
npm run dev
```

### 3) Build for production

```bash
npm run build
```

### 4) Preview production build

```bash
npm run preview
```

## Project pages

- `login.html`
- `register.html`
- `index.html` (feed)
- `post.html` (single post)
- `profile.html` (user profile)

## API notes

This project uses authenticated Noroff endpoints.

- Auth: register/login + API key creation
- Posts: fetch/create/update/delete
- Profiles: fetch profile, fetch profile posts, follow/unfollow

Session data is stored in `localStorage` (token, user, API key).

## Deployment

Deployed app:

## Author

- Nicklas Øen

# Offgrid

Offgrid is a front-end social media app built for the Noroff JS2 course assignment.

The app includes authentication, feed browsing, post interactions, profile views, and follow functionality using the Noroff Social API v2.

## CSS Frameworks Assignment (Bootstrap + Sass)

This submission is styled with Bootstrap and Sass installed via npm (no CDN).

### Assignment checklist

- Style at least 3 pages: completed
- At least one page with a form and HTML validation: completed
- Use npm packages for framework (not CDN): completed
- package.json includes development and production scripts, with --watch in development: completed
- Work on branch named css-frameworks: completed

## Tech stack

- JavaScript (ES6 modules)
- HTML
- Bootstrap 5
- Sass
- Vite
- Noroff Social API v2

## Implemented pages

- login.html
- register.html
- index.html (feed)
- post.html (single post)
- profile.html

## Features

- Register a new user
- Log in as an existing user
- View all posts in a feed
- Search and sort posts in the feed
- Open a single post page
- Create a post
- React to posts
- Comment on posts
- Edit and delete own post
- View own and other profiles
- Follow and unfollow profiles

## Bootstrap and Sass setup

- Bootstrap is installed as a dependency in package.json
- Bootstrap Sass is imported in src/styles/main.scss
- Compiled CSS output is written to src/styles/main.css

## Scripts

- npm run dev: starts Vite and Sass in watch mode
- npm run build: compiles Sass and builds Vite production bundle
- npm run preview: previews the production build

## Getting started

1. Install dependencies:

	npm install

2. Run development mode:

	npm run dev

3. Build for production:

	npm run build

4. Preview production build:

	npm run preview

## API notes

Authenticated Noroff endpoints used:

- Auth: register, login, API key creation
- Posts: fetch, create, update, delete, react, comment
- Profiles: fetch profile, fetch profile posts, follow, unfollow

Session data is stored in localStorage (token, user, API key).

## Deployment

Deployed app: https://nicklasoeen.github.io/offgrid/

## Author

- Nicklas Øen

## Submission note

This commit is added on the css-frameworks branch to provide a branch-to-main PR link for submission.

# Twitter Clone

A small Twitter-style social app. Posts are called **chirps**. Users can sign up, write chirps, like and rechirp them, follow other users, and scroll through an infinite feed.

The project has two parts:

- **Backend**: a REST API built with Node.js, Express and PostgreSQL.
- **Frontend**: a React app built with Vite, Tailwind CSS and React Query.

## Features

- **Accounts**: register, log in, log out. Passwords are hashed with bcrypt, and the session is a JWT stored in an `httpOnly` cookie.
- **Chirps**: write, edit and delete chirps.
- **Feed**: two tabs. *For you* shows all chirps, and *Following* shows chirps from people you follow.
- **Likes**: like and unlike a chirp. The UI updates right away, before the server responds.
- **Rechirps**: rechirp and un-rechirp a chirp. Each profile has a Rechirps tab.
- **Profiles**: display name, username, bio, and counts for chirps, followers and following.
- **Follows**: follow and unfollow users, and see follower and following lists.
- **Infinite scroll**: every list loads more items as you scroll, using cursor-based pagination.

## Tech stack

| Part     | Tools |
|----------|-------|
| Backend  | Node.js, Express 5, PostgreSQL (`pg`), JWT, bcrypt, cookie-parser, cors |
| Frontend | React 19, Vite, React Router, TanStack React Query, Axios, Tailwind CSS 4, react-icons |

## Project structure

```
twitter-clone/
├── package.json            # backend dependencies and scripts
├── .env                    # backend environment variables (not committed)
├── backend/src/
│   ├── index.js            # loads .env and starts the server
│   ├── app.js              # Express app: middleware and route mounting
│   ├── config/database.js  # PostgreSQL connection pool
│   ├── middleware/auth.js  # protect (login required) and optionalAuth
│   ├── routes/             # one file per resource (auth, chirps, likes, ...)
│   └── services/           # reusable SQL queries (feeds, follow lists, rechirps)
└── frontend/
    ├── .env                # frontend environment variables (not committed)
    └── src/
        ├── api/            # Axios calls to the backend, one file per resource
        ├── hooks/          # React Query hooks (useFeed, useToggleLike, ...)
        ├── components/     # reusable UI (Chirp, ChirpList, Navbar, ...)
        ├── pages/          # Feed, Profile, FollowList, Login, Register
        └── utils/          # helpers such as timestamp formatting
```

## Getting started

### 1. Requirements

- Node.js 20 or newer
- PostgreSQL

### 2. Create the database

Create a PostgreSQL database, then create the tables in the [Database](#database) section below.

### 3. Set the environment variables

Create a `.env` file in the **project root** for the backend (you can copy `env.example`):

Create `frontend/.env` for the frontend (you can copy `frontend/.env.example`):

### 4. Install and run

```bash
# Backend (from the project root)
npm install
npm run dev          # starts the API with nodemon on PORT

# Frontend (in a second terminal)
cd frontend
npm install
npm run dev          # starts Vite on http://localhost:5173
```

Open http://localhost:5173 in your browser.

## Database

There are five tables. `likes`, `rechirps` and `follows` are join tables: each row links two other rows, and the composite primary key stops the same link from being added twice.

```sql
CREATE TABLE users (
    id                SERIAL PRIMARY KEY,
    username          VARCHAR(50)  UNIQUE NOT NULL,
    email             VARCHAR(255) UNIQUE NOT NULL,
    password_hash     TEXT NOT NULL,
    display_name      VARCHAR(100),
    bio               TEXT,
    profile_image_url TEXT,
    created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chirps (
    id         SERIAL PRIMARY KEY,
    user_id    INT REFERENCES users(id) ON DELETE CASCADE,
    content    TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE likes (
    user_id    INT REFERENCES users(id)  ON DELETE CASCADE,
    chirp_id   INT REFERENCES chirps(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, chirp_id)
);

CREATE TABLE rechirps (
    user_id    INT REFERENCES users(id)  ON DELETE CASCADE,
    chirp_id   INT REFERENCES chirps(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, chirp_id)
);

CREATE TABLE follows (
    follower_id  INT REFERENCES users(id) ON DELETE CASCADE,  -- the user who follows
    following_id INT REFERENCES users(id) ON DELETE CASCADE,  -- the user being followed
    created_at   TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (follower_id, following_id)
);
```

## API

The base URL is `http://localhost:3000`.

- 🔒 means you must be logged in.
- Other routes work without logging in, but if you are logged in they also return fields such as `liked_by_me` and `is_following`.

### Auth

| Method | Path             | Description |
|--------|------------------|-------------|
| POST   | `/auth/register` | Create an account and log in. Body: `{ username, email, password }` |
| POST   | `/auth/login`    | Log in. Body: `{ email, password }` |
| GET    | `/auth/me` 🔒    | Get the logged-in user |
| POST   | `/auth/logout`   | Log out (clears the cookie) |

### Chirps

| Method | Path                | Description |
|--------|---------------------|-------------|
| GET    | `/chirps`           | All chirps, newest first. Add `?authorId=` to get one user's chirps |
| GET    | `/chirps/following` | Chirps from users you follow |
| GET    | `/chirps/:id`       | A single chirp |
| POST   | `/chirps` 🔒        | Create a chirp. Body: `{ content }` |
| PUT    | `/chirps/:id` 🔒    | Edit a chirp. Body: `{ content }` |
| DELETE | `/chirps/:id` 🔒    | Delete a chirp |

### Likes and rechirps

| Method | Path                    | Description |
|--------|-------------------------|-------------|
| POST   | `/chirps/:id/likes` 🔒    | Like a chirp |
| DELETE | `/chirps/:id/likes` 🔒    | Unlike a chirp |
| POST   | `/chirps/:id/rechirps` 🔒 | Rechirp a chirp (returns `409` if you already rechirped it) |
| DELETE | `/chirps/:id/rechirps` 🔒 | Undo a rechirp |

### Users and follows

| Method | Path                    | Description |
|--------|-------------------------|-------------|
| GET    | `/users/:username`      | A profile with chirp, follower and following counts |
| GET    | `/users/:id/followers`  | Users who follow this user |
| GET    | `/users/:id/followings` | Users this user follows |
| GET    | `/users/:id/rechirps`   | Chirps this user rechirped, most recent rechirp first |
| POST   | `/users/:id/follow` 🔒  | Follow a user |
| DELETE | `/users/:id/follow` 🔒  | Unfollow a user |

### Pagination

All list endpoints use **cursor-based pagination** with two query parameters:

- `limit`: how many items to return (default 20, max 50)
- `before`: the cursor from the previous page

Responses look like this:

```json
{ "chirps": [ ... ], "nextCursor": 42 }
```

To load the next page, send `?before=42`. When `nextCursor` is `null`, there are no more items.

A cursor is used instead of page numbers because new chirps arrive all the time. With `?page=2`, a new chirp at the top pushes everything down, so the next page would repeat items. A cursor means "everything older than this item", so pages stay correct while the data changes.

## How the frontend works

- **API layer (`src/api/`)**: small functions that call the backend with Axios. The shared client in `client.js` sends cookies with every request (`withCredentials: true`).
- **React Query hooks (`src/hooks/`)**: handle fetching, caching and loading states.
  - Lists use `useInfiniteQuery`, which loads pages from `nextCursor` as you scroll.
  - Likes, rechirps and follows use **optimistic updates**: the UI changes immediately and goes back if the server request fails.
- **Query keys**: every chirp list key starts with `'chirps'`, for example `['chirps', 'following']` or `['chirps', 'user', userId]`. That lets one call like `setQueriesData({ queryKey: ['chirps'] })` update a liked chirp in every list at once. Each list must still have its own full key. Two lists with the same key share one cache entry and show the same data.
- **Auth state**: `App.jsx` calls `/auth/me` on load to find the logged-in user. On login or logout, the React Query cache is cleared so no data from the previous user stays on screen.

## Roadmap

Ideas for next steps:

- Show rechirps in the home feed at the time they were rechirped
- Quote chirps (rechirp with your own comment)
- Replies
- Profile editing and image uploads

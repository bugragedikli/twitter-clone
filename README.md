# Twitter Clone

A full-stack Twitter-style social app where users post, like, rechirp and quote short messages called **chirps**.

## Overview

Users can sign up, write chirps, follow each other and scroll through an infinite feed. The Following feed mixes chirps and rechirps from people you follow, in the order they happened. I built this project after graduating to practice building a complete web app on my own: a REST API, a relational database design, and a React frontend with caching and optimistic updates.

## Demo

<!-- Add a live link and/or a screenshot or GIF here, for example: ![Demo](docs/demo.gif) -->

## Tech Stack

- **Frontend:** React 19, Vite, React Router, TanStack React Query, Axios, Tailwind CSS 4
- **Backend:** Node.js, Express 5
- **Database:** PostgreSQL
- **Auth:** JWT in an `httpOnly` cookie, bcrypt password hashing

## Features

- Sign up, log in and log out
- Write chirps, and edit or delete your own
- Like, rechirp and quote chirps; quotes show the original chirp as a card
- *For you* and *Following* feeds, with rechirps labeled "Rechirped by …"
- Profiles with chirps and rechirps tabs, and follower and following lists
- Infinite scroll on every list

**Worth mentioning:**

- **Cursor-based pagination** instead of page numbers, so new chirps don't cause repeated items when you load the next page.
- **Rechirps and quotes are modeled differently.** A plain rechirp is a row in a `rechirps` table. A quote is a real chirp with a `quote_of_id`, so it can be liked and rechirped like any other chirp.
- **The Following feed** combines chirps and rechirps in a single SQL query (`UNION ALL`). Its cursor is made of the time, the chirp id and who rechirped it, because the same chirp can appear more than once.
- **One request per list:** each chirp comes back with its counts and its quoted chirp, so there are no extra requests per chirp.
- **Optimistic updates:** likes, rechirps and follows update the UI instantly and roll back if the request fails.
- **Ownership checks:** users can only edit or delete their own chirps.

## Getting Started

Requirements: Node.js 20+ and PostgreSQL.

```bash
git clone https://github.com/bugragedikli/twitter-clone.git
cd twitter-clone

# Backend
cp .env.example .env              # fill in your database details and a JWT secret
npm install
npm run dev

# Frontend (in a second terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

Before starting the backend, create a PostgreSQL database with the `users`, `chirps`, `likes`, `rechirps` and `follows` tables.

Then open http://localhost:5173.

## Project Structure

```
backend/src/
├── routes/       # Express routes, one file per resource
├── services/     # shared SQL queries (feeds, follow lists)
└── middleware/   # authentication
frontend/src/
├── api/          # requests to the backend
├── hooks/        # React Query hooks
├── components/   # Chirp, ChirpList, QuotePanel, ...
└── pages/        # Feed, Profile, FollowList, Login, Register
```

## Future Improvements

- Replies
- Profile editing and image uploads
- Show "This chirp is unavailable" when a quoted chirp is deleted
- Deploy a live demo

## Author

**Buğra Gedikli**

- GitHub: [@bugragedikli](https://github.com/bugragedikli)
LinkedIn: https://www.linkedin.com/in/bugragedikli
Portfolio: https://bugragedikli.com

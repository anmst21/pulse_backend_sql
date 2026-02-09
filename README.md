# Pulse Backend

REST API backend for the Pulse social audio sharing platform. Built with Node.js, Express, PostgreSQL, and Socket.io.

## Features

- **Authentication** - User signup/signin with JWT and Passport.js (local strategy)
- **Audio Posts** - Upload and manage audio recordings and Spotify tracks with S3 presigned URLs
- **Spotify Integration** - OAuth flow for linking Spotify accounts, token refresh
- **Social** - Follow/unfollow users, subscription requests (pending/accepted/declined)
- **Comments** - Threaded comments with replies and likes
- **Voting** - Upvote/downvote system on posts
- **Bookmarks** - Save posts for later
- **Notifications** - Real-time notifications via Socket.io
- **Search** - Search users and genres
- **Moderation** - Report posts, submit bug reports, ban users
- **Profile Images** - Upload profile photos to S3 in multiple sizes
- **Genre Tags** - Tag posts with music genres

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express
- **Database**: PostgreSQL (via `pg`)
- **Migrations**: node-pg-migrate
- **Auth**: Passport.js, JWT, bcrypt
- **Storage**: AWS S3
- **Real-time**: Socket.io
- **Spotify**: OAuth 2.0

## Setup

### Prerequisites

- Node.js
- PostgreSQL database
- AWS S3 bucket
- Spotify Developer account (for Spotify features)

### Install

```bash
git clone https://github.com/anmst21/pulse_backend_sql.git
cd pulse_backend_sql
npm install
```

### Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AMAZON_ACCESS_KEY` | AWS access key ID |
| `AMAZON_SECRET_KEY` | AWS secret access key |
| `SPOTIFY_CLIENT_ID` | Spotify app client ID |
| `SPOTIFY_CLIENT_SECRET` | Spotify app client secret |
| `SPOTIFY_REDIRECT_URI` | Spotify OAuth callback URL |
| `JWT_SECRET` | Secret key for signing JWTs |

### Database Migrations

```bash
DATABASE_URL=your_connection_string npm run migrate up
```

### Run

```bash
npm start
```

The server starts on port **3005**.

## API Routes

| Method | Route | Description |
|---|---|---|
| `POST` | `/user/signup` | Register a new user |
| `POST` | `/user/signin` | Sign in |
| `GET` | `/user/:id` | Get user profile |
| `PUT` | `/users/username` | Update username |
| `PUT` | `/users/bio` | Update bio |
| `PUT` | `/users/link` | Update profile link |
| `GET` | `/audios` | Get audio feed |
| `GET` | `/user/:userId/audios` | Get user's audios |
| `POST` | `/audio/save` | Save a new audio post |
| `POST` | `/audio/delete` | Delete an audio post |
| `GET` | `/audio/upload` | Get S3 presigned upload URL |
| `POST` | `/user/follow` | Follow a user |
| `POST` | `/user/unfollow` | Unfollow a user |
| `GET` | `/user/:id/followers` | Get user's followers |
| `GET` | `/user/:id/following` | Get user's following |
| `POST` | `/user/sendSubscriptionRequest` | Send subscription request |
| `POST` | `/user/acceptSubscriptionRequest` | Accept subscription |
| `POST` | `/user/declineSubscriptionRequest` | Decline subscription |
| `POST` | `/comments` | Create a comment |
| `GET` | `/comments/:postId/:userId` | Get comments for a post |
| `DELETE` | `/comments/:id` | Delete a comment |
| `POST` | `/comments/like` | Like/unlike a comment |
| `POST` | `/vote` | Upvote/downvote a post |
| `POST` | `/bookmarks/toggle` | Bookmark/unbookmark a post |
| `GET` | `/bookmarks/fetch` | Get bookmarked posts |
| `GET` | `/notifications/fetch` | Get notifications |
| `POST` | `/notifications/markSeen` | Mark notification as seen |
| `GET` | `/search/profiles` | Search users |
| `GET` | `/search/genres` | Search genres |
| `POST` | `/report/post` | Report a post |
| `POST` | `/report/bug` | Submit a bug report |
| `POST` | `/ban/toggle` | Ban/unban a user |
| `GET` | `/spotify/login` | Start Spotify OAuth |
| `GET` | `/spotify/callback` | Spotify OAuth callback |
| `POST` | `/spotify/refresh` | Refresh Spotify token |

## License

MIT

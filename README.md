# Toys API

REST API for a toys store, built with **Node.js, Express and MongoDB**.
Any registered user can add toys (name, info, category, image, price) and everyone can browse, search and filter them.

**Student:** Tsivia Guetta – 348248634

---

## Table of contents

- [Installation](#installation)
- [Data structure](#data-structure)
- [Authentication](#authentication)
- [Users routes](#users-routes)
- [Toys routes](#toys-routes)
- [Errors](#errors)
- [Security](#security)
- [Project structure](#project-structure)

---

## Installation

```bash
git clone https://github.com/tsiviaguetta12345-ops/toys-api.git
cd toys-api
npm install
```

Create a `.env` file at the root (see `.env.example`):

```env
PORT=3001
MONGO_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/toys
TOKEN_SECRET=put_a_long_random_secret_here
ADMIN_EMAIL=admin@toys.com
ADMIN_PASSWORD=change_me_123
```

Fill the database with 12 toys in 3 categories (`building`, `vehicles`, `games`) and one admin user:

```bash
npm run seed
```

Start the server:

```bash
npm start        # or: npm run dev (with nodemon)
```

The API runs on `http://localhost:3001`. In the examples below, `domain` = `http://localhost:3001`.

---

## Data structure

### `toys` collection

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Created by MongoDB |
| `name` | String | Required, 2–100 characters |
| `info` | String | Required, 2–500 characters |
| `category` | String | Required, saved in lowercase |
| `img_url` | String | Optional, must be a valid URL |
| `price` | Number | Required, 0 or more |
| `user_id` | String | Id of the user who added the toy – **taken from the token**, never sent by the client |
| `createdAt` / `updatedAt` | Date | Automatic (`timestamps: true`) |

### `users` collection

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Created by MongoDB |
| `name` | String | Required, 2–50 characters |
| `email` | String | Required, **unique** |
| `password` | String | Required (min 6), **saved encrypted with bcrypt** |
| `role` | String | `user` (default) or `admin` |
| `createdAt` / `updatedAt` | Date | Automatic (`timestamps: true`) |

---

## Authentication

1. Create a user with `POST /users`.
2. Log in with `POST /users/login` → you receive a **token** (valid 10 hours).
3. Send this token in the **`x-api-key` header** for every route marked 🔒.

```
x-api-key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

If the token is missing or wrong, the API answers with status `401` and a JSON error.

---

## Users routes

### Sign up

`POST domain/users`

Body (JSON) – all fields are required:

```json
{
  "name": "Tsivia",
  "email": "tsivia@test.com",
  "password": "123456"
}
```

| Field | Rules |
|---|---|
| `name` | string, 2–50 characters |
| `email` | valid email, must not already exist |
| `password` | string, 6–50 characters |

You **cannot** send `role` or any other field: every new user is a `user`.

Response `201`:

```json
{
  "name": "Tsivia",
  "email": "tsivia@test.com",
  "role": "user",
  "_id": "66f6a1c2e4b0a1b2c3d4e5f6",
  "createdAt": "2026-09-27T10:00:00.000Z",
  "updatedAt": "2026-09-27T10:00:00.000Z",
  "__v": 0
}
```

The password is never returned. If the email already exists → `409`:

```json
{ "error": "This email is already registered" }
```

### Log in

`POST domain/users/login`

Body (JSON) – only `email` and `password`:

```json
{
  "email": "tsivia@test.com",
  "password": "123456"
}
```

Response `200`:

```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

Wrong email or password → `401`:

```json
{ "error": "Email or password is wrong" }
```

### My info 🔒

`GET domain/users/me` – returns the logged-in user (without the password).

### All users 🔒 (admin only)

`GET domain/users` – returns the list of all users (without passwords). A normal user gets `403`.

---

## Toys routes

All lists return **10 toys per page**.
`?skip` is the **page number**, starting at 0: `skip=0` → toys 1–10, `skip=1` → toys 11–20, etc.

### A. All toys

`GET domain/toys?skip=0`

```
GET http://localhost:3001/toys
GET http://localhost:3001/toys?skip=1
```

Response `200` – an array of toys:

```json
[
  {
    "_id": "66f6a1c2e4b0a1b2c3d4e5f7",
    "name": "Lego City Fire Station",
    "info": "Fire station with a truck, a helicopter and 6 minifigures",
    "category": "building",
    "img_url": "https://picsum.photos/seed/firestation/400/300",
    "price": 89.9,
    "user_id": "66f6a1c2e4b0a1b2c3d4e5f0",
    "createdAt": "2026-09-27T10:00:00.000Z",
    "updatedAt": "2026-09-27T10:00:00.000Z",
    "__v": 0
  }
]
```

**Bonus:** this route also accepts `?s=` (search) and `?cat=` (category), alone or together:

```
GET http://localhost:3001/toys?s=lego
GET http://localhost:3001/toys?cat=games
GET http://localhost:3001/toys?s=lego&cat=building&skip=0
```

### B. Search

`GET domain/toys/search?s=<word>&skip=0`

Searches the word in the **name or the info** of the toys (not case sensitive).

```
GET http://localhost:3001/toys/search?s=wooden
```

Without `?s=` → `400`.

### C. By category

`GET domain/toys/category/:catname?skip=0`

```
GET http://localhost:3001/toys/category/vehicles
```

Categories in the seed data: `building`, `vehicles`, `games`. The category is not case sensitive.

### D. Add a toy 🔒

`POST domain/toys`

Header: `x-api-key: <token>`

Body (JSON):

```json
{
  "name": "Teddy Bear",
  "info": "Soft brown teddy bear, 40 cm",
  "category": "dolls",
  "price": 30,
  "img_url": "https://picsum.photos/seed/teddy/400/300"
}
```

| Field | Rules |
|---|---|
| `name` | required, string, 2–100 characters |
| `info` | required, string, 2–500 characters |
| `category` | required, string, 2–50 characters |
| `price` | required, number, 0–100000 |
| `img_url` | optional, valid URL (or empty string) |

Do **not** send `user_id`: the server adds the id of the logged-in user from the token. Any unknown field → `400`.

Response `201`: the new toy.

### E. Edit a toy 🔒

`PUT domain/toys/:id`

Header: `x-api-key: <token>`

Body: same fields and rules as **Add a toy** (send the full toy).

You can only edit **your own** toys (an admin can edit any toy). Otherwise → `404`:

```json
{ "error": "Toy not found or it does not belong to you" }
```

Response `200`: the updated toy.

### F. Delete a toy 🔒

`DELETE domain/toys/:id`

Header: `x-api-key: <token>`

Same rule as edit: only the owner (or an admin). Response `200`:

```json
{ "msg": "Toy deleted", "deletedToy": { "_id": "...", "name": "Teddy Bear", "...": "..." } }
```

### G. By price range

`GET domain/toys/prices?min=10&max=40&skip=0`

Returns the toys with `min <= price <= max`, sorted from cheapest. `min` and `max` are optional.

```
GET http://localhost:3001/toys/prices?min=10&max=40
```

### H. One toy

`GET domain/toys/single/:id`

Returns **one object** (not an array).

```
GET http://localhost:3001/toys/single/66f6a1c2e4b0a1b2c3d4e5f7
```

Invalid id → `400`, id not found → `404`.

### I. Count

`GET domain/toys/count`

```json
{ "count": 12 }
```

---

## Errors

All errors are returned as JSON with an `error` field:

```json
{ "error": "\"price\" must be a number" }
```

| Status | Meaning |
|---|---|
| `400` | Invalid data (Joi validation, invalid id, invalid JSON, missing search word) |
| `401` | Missing/invalid token, or wrong email/password |
| `403` | Admin only |
| `404` | Route or toy not found (or the toy is not yours) |
| `409` | Email already registered |
| `500` | Server error |

---

## Security

- Passwords encrypted with **bcrypt** (never returned in a response)
- **JWT** token sent in the `x-api-key` header and checked by a middleware (`middlewares/auth.js`)
- All inputs validated with **Joi**
- `MONGO_URL` and `TOKEN_SECRET` are in `.env`, which is **not** on GitHub (`.gitignore`)

---

## Project structure

```
app.js               server start, routes, error handling
config/db.js         MongoDB connection
models/toyModel.js   toys schema + Joi validation
models/userModel.js  users schema + Joi validation + token creation
middlewares/auth.js  auth (token) and authAdmin (token + admin role)
routes/index.js      connects all the routers
routes/toys.js       toys routes (A–I)
routes/users.js      users routes
seed.js              fills the database with 12 toys and an admin
```


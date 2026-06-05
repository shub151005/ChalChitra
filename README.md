
# ChalChitra — Global Cinema Discovery & Hybrid Movie Recommendation Platform

ChalChitra is a full-stack movie discovery and recommendation platform built for global cinema exploration. It helps users discover movies through search, genres, directors, actors, ratings, reviews, watchlist behavior, hidden gems, and hybrid recommendation logic.

The project focuses on **taste-based movie discovery**, not just popularity-based browsing.

---

## Project Overview

Most movie platforms recommend films mainly through popularity, trending lists, or simple genre matching. ChalChitra improves discovery by combining:

- Movie metadata
- Story/description similarity
- Genre similarity
- Director and actor signals
- User ratings and reviews
- Watchlist behavior
- TF-IDF based ML similarity
- Hidden-gem ranking using quality and lower popularity preference

The result is a platform that can recommend both obvious similar films and less mainstream hidden gems.

---

## Live Demo

Frontend:

```txt
https://chal-chitra-eta.vercel.app
````

Backend:

```txt
https://chalchitra-2vov.onrender.com
```

---

## Features

### Public Features

* Global movie search
* Fast local fuzzy search suggestions
* Trending movies
* Top-rated movies
* Movie detail pages
* Poster, backdrop, cast, crew, runtime, language, rating, and overview
* Dedicated discovery pages
* Expanded recommendation pages
* Hidden-gem discovery

### User Features

* User signup and login
* JWT authentication
* Rate movies from 1 to 10
* Write and delete reviews
* Add movies to watchlist
* Follow directors and actors
* Personalized recommendation dashboard

### Discovery Sections

Homepage includes:

* Trending Worldwide
* Top Rated Classics
* Award-Winning & Acclaimed
* Festival & Art-House Favorites
* Romance & Emotional Dramas
* Thrillers & Psychological Cinema
* Global Hidden Gems

Each homepage row has a dedicated expanded discovery page with load-more support.

---

## Recommendation System

ChalChitra uses a hybrid recommendation approach.

### 1. Rule-Based Recommendation

Rule-based similarity considers:

* Genre overlap
* Description/story similarity
* Director overlap
* Actor overlap
* Language
* Rating
* Popularity

### 2. ML-Based Recommendation

The ML recommendation system uses:

* TF-IDF vectorization
* Movie description
* Genres
* Directors
* Cast
* Language
* Title and original title

This creates content-based similarity between movies.

### 3. Hybrid Recommendation

Hybrid recommendation combines:

```txt
ML similarity + rule-based taste signals + rating strength + poster availability
```

This improves recommendation quality compared to simple genre matching.

### 4. Hidden Gems

Hidden gems are selected using:

```txt
hybrid similarity
+ rating quality
+ lower popularity preference
- mainstream popularity penalty
```

This helps surface less obvious films that are still taste-relevant to the selected movie.

---

## Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* Framer Motion
* React Router
* Axios
* Lucide React

### Backend

* FastAPI
* SQLAlchemy
* PostgreSQL
* JWT authentication
* TMDb API integration
* scikit-learn
* RapidFuzz
* Joblib

### Database

* PostgreSQL
* Neon cloud database

### External API

* TMDb API for movie metadata, posters, cast, crew, trending movies, and search.

---

## Project Structure

```txt
ChalChitra/
├── backend/
│   ├── app/
│   │   ├── constants/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── ml/
│   │   ├── data/
│   │   ├── models/
│   │   └── scripts/
│   ├── requirements.txt
│   └── .python-version
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── docs/
│   ├── api_docs.md
│   ├── architecture.md
│   ├── deployment.md
│   └── ui_notes.md
│
└── README.md
```

---

## Backend Setup

### 1. Go to backend folder

```bash
cd backend
```

### 2. Create virtual environment

```bash
python -m venv venv
```

### 3. Activate virtual environment

Windows PowerShell:

```bash
venv\Scripts\activate
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Create `.env` file

Create:

```txt
backend/.env
```

Add:

```env
DATABASE_URL=your_postgresql_database_url
TMDB_API_KEY=your_tmdb_api_key
JWT_SECRET_KEY=your_jwt_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### 6. Run backend

```bash
uvicorn app.main:app --reload
```

Backend runs on:

```txt
http://127.0.0.1:8000
```

Health check:

```txt
http://127.0.0.1:8000/health
```

---

## Frontend Setup

### 1. Go to frontend folder

```bash
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create `.env` file

Create:

```txt
frontend/.env
```

Add:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### 4. Run frontend

```bash
npm run dev
```

Frontend runs on:

```txt
http://localhost:5173
```

---

## Production Build

Frontend production build:

```bash
cd frontend
npm run build
```

Backend production start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

## Important API Endpoints

### Health

```txt
GET /health
```

### Auth

```txt
POST /auth/signup
POST /auth/login
GET /auth/me
```

### Movies

```txt
GET /movies/trending?page=1
GET /movies/top-rated?page=1
GET /movies/search?query=psycho&page=1
GET /movies/suggest?query=psycho&limit=5
GET /movies/{tmdb_id}
POST /movies/{tmdb_id}/expand
```

### Discovery

```txt
GET /movies/discover/award-winning?page=1&limit=50
GET /movies/discover/festival-favorites?page=1&limit=50
GET /movies/discover/global-hidden-gems?page=1&limit=50
GET /movies/genre/romance?page=1&limit=50
GET /movies/genre/thriller?page=1&limit=50
```

### Recommendations

```txt
GET /recommendations/movie/{tmdb_id}?limit=10
GET /recommendations/ml/movie/{tmdb_id}?limit=10
GET /recommendations/hybrid/movie/{tmdb_id}?limit=10
GET /recommendations/hidden-gems/{tmdb_id}?limit=10
```

### User Interactions

```txt
POST /users/ratings
GET /users/ratings/me
POST /users/reviews
GET /users/reviews/me
POST /users/watchlist
GET /users/watchlist/me
POST /users/follows
GET /users/follows/me
```

---

## ML Model

The ML model is based on TF-IDF content similarity.

Movie text is built using:

* Description
* Genres
* Directors
* Cast
* Language
* Title
* Original title

The generated model files are stored inside:

```txt
backend/ml/models/
```

The recommendation backend loads these model files and uses them for movie similarity.

---

## Deployment Plan

### Backend

Recommended platform:

```txt
Render
```

Render settings:

```txt
Root Directory: backend
Runtime: Python
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
Health Check Path: /health
```

Environment variables:

```env
DATABASE_URL=your_neon_database_url
TMDB_API_KEY=your_tmdb_api_key
JWT_SECRET_KEY=your_generated_secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
PYTHON_VERSION=3.13.5
```

### Frontend

Recommended platform:

```txt
Vercel
```

Vercel settings:

```txt
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
```

Frontend environment variable:

```env
VITE_API_BASE_URL=https://your-render-backend-url.onrender.com
```

After frontend deployment, add the deployed frontend URL to backend CORS origins.

---

## Security Notes

The following files must not be committed:

```txt
backend/.env
frontend/.env
backend/venv/
frontend/node_modules/
frontend/dist/
```

Secrets such as database URLs, TMDb API keys, and JWT secret keys must be stored only in environment variables.

---

## Current Status

Completed:

* Authentication
* Movie search
* Movie detail pages
* TMDb integration
* Movie caching
* Ratings
* Reviews
* Watchlist
* Creator follows
* Hybrid recommendation system
* Hidden-gem recommendation logic
* Discovery pages
* Responsive UI polish
* Production build test

In progress:

* Backend deployment
* Frontend deployment
* Final demo preparation

---

## Future Improvements

Possible future upgrades:

* Collaborative filtering
* Advanced user taste matching
* Dedicated actor/director profile pages
* Recommendation evaluation dashboard
* Admin moderation panel
* Better code splitting for frontend bundles
* Larger global cinema dataset
* More refined festival/award metadata

---

## Author

Built by Subham as a full-stack portfolio project focused on data science, recommendation systems, and global cinema discovery.

---

## Project Identity

ChalChitra is designed around one idea:

```txt
Cinema discovery should understand taste, not just popularity.
```

````



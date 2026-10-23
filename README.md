# Online Learning Management System (Lumen LMS)

Cloud Computing project. Students browse and enroll in courses, finish lessons and take quizzes. Instructors create courses, add lessons and quiz questions.

**Tech used:** HTML, CSS, JavaScript (landing site) - React.js (single-page app) - Node.js + Express (REST API) - JWT authentication - Docker (cloud deployment)

## Folder structure

```
online-learning-management-system/
|-- backend/            Node.js + Express REST API
|   |-- server.js       routes, auth, quiz grading, static hosting
|   |-- db.js           JSON-file data store with seed data
|   `-- data/           db.json is created here on first run
|-- landing/            Plain HTML + CSS + JavaScript site (served at /)
|   |-- index.html
|   |-- css/style.css
|   `-- js/main.js
|-- frontend/           React.js app built with Vite (served at /app)
|   `-- src/            App, pages, components, auth context, api helper
|-- Dockerfile          Multi-stage build for cloud deployment
|-- docker-compose.yml
`-- README.md
```

## Run it locally (easiest way)

Requires Node.js 18 or newer.

```bash
cd backend
npm install
npm start
```

Open:

- http://localhost:5000/ - landing site (HTML, CSS, JS)
- http://localhost:5000/app/ - React learning app
- http://localhost:5000/api/health - API health check

A prebuilt React app is included in `frontend/dist`. To rebuild it after changing React code:

```bash
cd frontend
npm install
npm run build
```

## Run in development mode (hot reload for React)

Terminal 1:

```bash
cd backend && npm install && npm run dev
```

Terminal 2:

```bash
cd frontend && npm install && npm run dev
```

Open http://localhost:5173/app/ - Vite forwards `/api` calls to the backend on port 5000.

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Student | student@lms.com | student123 |
| Instructor | instructor@lms.com | instructor123 |

You can also create new accounts from the Log in page.

## Features

**Students**
- Search and filter the course catalog
- Enroll in a course
- Open lessons and mark them complete (progress bar updates)
- Take a quiz, see correct answers, best score is saved
- Dashboard with progress for every enrolled course

**Instructors**
- Create courses
- Add lessons and multiple-choice quiz questions
- Delete their own courses
- Dashboard with enrollment counts

**Security**
- Passwords hashed with bcrypt
- JWT tokens (7 day expiry)
- Role checks on every protected route
- Quiz answers never sent to the browser before submission

## REST API

| Method | Route | Access | Purpose |
|--------|-------|--------|---------|
| GET | /api/health | public | Health check for load balancers |
| POST | /api/auth/register | public | Create account |
| POST | /api/auth/login | public | Log in, returns JWT |
| GET | /api/auth/me | logged in | Current user |
| GET | /api/courses | public | List courses (`?search=&category=`) |
| GET | /api/courses/:id | public | Course details (lesson text only for enrolled users and the owner) |
| POST | /api/courses | instructor | Create course |
| DELETE | /api/courses/:id | owner | Delete course |
| POST | /api/courses/:id/lessons | owner | Add lesson |
| POST | /api/courses/:id/quiz | owner | Add quiz question |
| POST | /api/courses/:id/enroll | student | Enroll |
| GET | /api/me/enrollments | student | My courses with progress |
| POST | /api/courses/:id/lessons/:lessonId/complete | enrolled | Mark lesson complete |
| GET | /api/courses/:id/quiz | enrolled | Quiz questions (no answers) |
| POST | /api/courses/:id/quiz/submit | enrolled | Grade the quiz |
| GET | /api/instructor/courses | instructor | My created courses |

## Cloud deployment

### Option 1 - Docker (works on any cloud)

```bash
docker compose up --build
```

The app is then available at http://localhost:5000. Data is kept in the `lms-data` volume.

### Option 2 - AWS EC2

1. Launch an Ubuntu EC2 instance and open port 5000 (or 80) in the security group.
2. Install Docker, copy this project to the server.
3. Run `docker compose up -d --build`.
4. Set a strong `JWT_SECRET` in `docker-compose.yml`.

### Option 3 - Render / Railway / Elastic Beanstalk

Create a web service from the Dockerfile in this folder. Set the environment variable `JWT_SECRET`. Use `/api/health` as the health check path.

### Cloud concepts shown in this project

- **SaaS delivery:** users only need a browser
- **Three-tier architecture:** presentation (landing + React), application (Express API), data (store in `db.js`)
- **Stateless API:** JWT means any number of server copies can run behind a load balancer
- **Containerization:** Docker image with a health check
- **Scalability note:** the JSON file store is for demonstration. For production, replace `db.js` with MongoDB Atlas, Amazon RDS or DynamoDB so several servers can share data.

## Environment variables

| Name | Default | Meaning |
|------|---------|---------|
| PORT | 5000 | Server port |
| JWT_SECRET | dev-secret-change-me | Secret used to sign tokens - change in production |
| DB_FILE | backend/data/db.json | Location of the data file |
| VITE_API_URL | (empty) | Only needed when the React app is hosted on a different domain than the API |

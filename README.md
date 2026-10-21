# Calvary Christian College

Website and admissions portal for Calvary Christian College: public pages, account
registration, the application form, alumni registration, a student portal and admin views.

Built with Node.js, Express, EJS and MongoDB.

## Getting started

Requires Node.js 20 or later and a MongoDB database.

```bash
npm install
cp .env.example .env   # then fill in the values
npm run dev            # restarts on changes; use `npm start` in production
```

The site runs at http://localhost:3000.

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start the server |
| `npm run dev` | Start with auto-restart (nodemon) |
| `npm test` | Unit tests and a render test of every view for every role |
| `npm run lint` | ESLint |

## Roles

| Role | Lands on | Can do |
| --- | --- | --- |
| Applicant | `/apply` | Submit one application and follow its status |
| Student | `/student-portal` | See their profile and application |
| Alumni | `/alumni` | Submit one alumni registration |
| Admin | `/apply` | Review applications, alumni, students, users and contact messages |

Approving an application turns the applicant into a student in the program they applied for;
setting it back to Pending or Rejected undoes that. Admin sign-up requires `ADMIN_SECRET_KEY`.

## Project layout

```
app.js              Express setup, security middleware, routes
controllers/        Request handlers
routes/             URL → controller wiring
middleware/         Auth, CSRF protection, rate limits
utils/              Programs and intakes, input validation, pagination, mailer
views/              EJS templates (partials/ holds head, header, footer, pagination)
public/             CSS, browser script, images
test/               node:test suites
```

Programs of study and application intakes are defined once in `utils/programs.js`.
Intakes are January and July and are generated from today's date.

## Security notes

- Every POST form must include `<input type="hidden" name="_csrf" value="<%= csrfToken %>">`.
- The Content Security Policy blocks inline `<script>` blocks and `onclick` attributes; put
  browser code in `public/scripts/site.js`.
- Login, registration, password reset and the contact form are rate limited.

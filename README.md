# Job Application Tracker

[![CI](https://github.com/MarcoNdhukula/job-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/MarcoNdhukula/job-tracker/actions/workflows/ci.yml)

A full-stack app for tracking job applications through each stage of the process: Applied, Interviewing, Offer, or Rejected. It keeps a history of every status change, shows a summary of applications by status, and can extract the skills from a job description using a local AI model.

Built with ASP.NET Core and React to practise connecting a C# back end to a TypeScript front end.

![Job Application Tracker](screenshots/app.png)

## Features

- Create, edit, and delete applications
- Status history for each application, recorded automatically when the status changes
- Paginated list, newest first
- Summary of applications by status
- Skill extraction from a pasted job description, run locally with Ollama
- Validation on the client and the server, with consistent `ProblemDetails` error responses

## Tech stack

**Back end**
- ASP.NET Core Web API (.NET 10)
- Entity Framework Core with SQLite, using migrations and a one-to-many relationship
- Scalar for interactive API documentation
- Ollama (local AI model) for skill extraction

**Front end**
- React with TypeScript, built with Vite

**Testing and automation**
- xUnit integration tests with `WebApplicationFactory`
- Vitest and Testing Library for component tests
- GitHub Actions runs both test suites on every push

## Project structure

```
job-tracker/
  api/        ASP.NET Core Web API (models, DbContext, migrations, services, endpoints)
  web/        React app (components, API client)
  tests/      xUnit integration tests for the API
  .github/    GitHub Actions workflow
```

## API endpoints

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/applications?page=1&pageSize=10` | List applications, newest first, with paging |
| GET | `/api/applications/{id}` | Get one application |
| POST | `/api/applications` | Create an application |
| PUT | `/api/applications/{id}` | Update an application |
| DELETE | `/api/applications/{id}` | Delete an application |
| GET | `/api/applications/summary` | Count applications per status |
| GET | `/api/applications/{id}/history` | List the status changes for an application |
| POST | `/api/ai/extract-skills` | Extract required and nice-to-have skills from a job description |

Interactive docs are available at `/scalar/v1` when the API runs in Development.

## Getting started

### Prerequisites
- .NET 10 SDK (or 8 or later)
- Node.js LTS
- Ollama, for the skill extraction feature (optional; the rest of the app works without it)

### Run the API

```bash
cd api
dotnet run
```

Open `http://localhost:5216/scalar/v1` to see the endpoints.

### Run the skill extraction model (optional)

Install Ollama from ollama.com, then download the small model used by the app:

```bash
ollama pull llama3.2:1b
```

Ollama must be running for the skill extraction feature to work. If it isn't, the endpoint returns a clear error message instead of failing silently.

### Run the web app

In a second terminal:

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:5173`.

The API creates `jobtracker.db` in the `api` folder on first run. The database is excluded from Git.

## Running the tests

From the root folder, run the API tests:

```bash
dotnet test
```

From the `web` folder, run the component tests:

```bash
npm test
```

The API tests start the application in memory and send real HTTP requests. They use a separate SQLite file for each run, so they never touch `jobtracker.db`.

## Design decisions

- **Separate API and front end.** The API is a self-contained service, so a different client could use it later.
- **Status stored as text.** EF Core saves the enum as a string (`Applied`, not `0`), which makes the database readable.
- **Status history is its own table.** Each change is a row linked to the application, and deleting an application removes its history through a cascade delete.
- **Migrations applied on startup.** `Migrate()` runs when the API starts, so a fresh clone needs no manual database setup.
- **Validation in two places.** The form checks required fields before sending, and the API checks again, since the API can't assume every client validates.
- **One error format.** Every error uses `ProblemDetails`, and the React app reads the same fields for every failure.
- **AI output is validated, not trusted.** The model's reply is parsed, cleaned, and limited in size. Only skills that appear word for word in the job description are kept, which catches guessed skills from a small model.
- **Local AI model.** Skill extraction runs on the user's own machine through Ollama, so job descriptions are never sent to a third-party service.

## Known limitations

- No user accounts or authentication. Anyone who can reach the API can read and change its data.
- No encryption of stored data.
- CORS allows only `http://localhost:5173`, so the app runs locally only.
- The database is a local SQLite file, not suitable for multiple servers.
- The skill extraction model is small, so its results vary. The validation keeps only skills found in the text, but it can still miss skills.

## What I'd add next

- Styling and responsive layout for narrow screens
- Sorting and filtering by status or date
- Authentication before deploying anywhere public
- Deployment to a hosted service

## Author

Marco Ndhukula
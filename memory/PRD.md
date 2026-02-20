# PRD: Todo Full-Stack Web App

## Original Problem Statement
build a todo full stack web app

## Architecture Decisions
- **Frontend**: React + React Router, axios for API calls, framer-motion for micro-animations, Tailwind + custom CSS for Swiss-inspired design.
- **Backend**: FastAPI with Motor (MongoDB) using REST endpoints under `/api`.
- **Data Model**: Todo `{ id, title, description, due_date, priority, status, created_at, updated_at }`.

## Implemented Features
- Todo CRUD APIs (`/api/todos`, `/api/todos/{id}`) and summary endpoint (`/api/todos/summary`).
- Board page with bento grid layout, filters (status/priority/search), inline actions (toggle, edit, delete).
- New Todo page and Edit Todo page with full form handling.
- Insights page with Swiss poster-style stats.
- Responsive layout, noise texture overlay, and data-testid coverage for all interactive/critical UI.

## Prioritized Backlog
- **P0**: None (core flows are working).
- **P1**: User accounts with per-user todo lists; reminders/notifications for due dates.
- **P2**: Drag-and-drop ordering, recurring todos, export/share functionality.

## Next Tasks
- Add tags and tag-based filtering.
- Add pagination or archiving for completed tasks.
- Add optional dark-mode toggle using the existing theme tokens.

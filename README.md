JSON ToDo App (Server + React client) — Updated with:
- Edit-task UI
- Cookie-based httpOnly JWT auth (server sets cookie; client uses credentials:'include')
- Dockerfiles and docker-compose for easy local run

How to run locally (no Docker):

1) Server
   cd server
   npm install
   npm start
   Server runs at http://localhost:5000

2) Client
   cd client
   npm install
   npm run dev
   Open http://localhost:5173 (or the URL vite prints)
   Note: client fetches backend using credentials:'include' so cookies are used for auth.

Or run with Docker (recommended for clean setup):

- Ensure Docker is installed.
- From project root:
    docker compose up --build
  This builds both images and starts services.
  - Server will be available at http://localhost:5000
  - Client will be served at http://localhost:5173 (proxied through nginx in container)

Deployment notes:
- For production, set JWT_SECRET to a strong secret in the server environment.
- Set cookie secure flag to true when serving over HTTPS (server.js: secure: true).
- Consider persistent storage for users/tasks (JSON is for local/demo only).
- To deploy to Heroku/Render: push server to a Node web service and client to a static site (or serve client via server). Ensure CORS and cookie domains are configured correctly.

Files of interest:
- server/server.js  (backend)
- server/users.json, server/tasks.json (data)
- client/src/pages/* (Login, Register, Dashboard)
- docker-compose.yml, server/Dockerfile, client/Dockerfile

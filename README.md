# CDCI

Basic Node.js recipe sharing app with Express, MySQL storage, and GitHub Actions CI.

## Local Run

1. Install dependencies with `npm install`
2. Use `.env.example` as the reference for local environment variables
3. Make sure MySQL is running and the `recipes` database exists
4. Start the app with `npm start`
5. Open `http://localhost:3000`

## Health Check

The app exposes `GET /health`.
It reports success only when the web app is running and the MySQL connection is reachable.

## Environment Variables

Use `.env.example` as the baseline configuration.
The app supports database settings in this order:

1. `MYSQL_URL`
2. `DATABASE_URL`
3. `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

## CI

GitHub Actions runs on pushes to `main` and on pull requests.
The workflow installs dependencies with `npm ci` and runs `npm run check`.

## CD

GitHub Actions can deploy this app to Render.

### Render Setup

1. Create a Render web service connected to this repository
2. In Render, set the start command to `npm start`
3. Add the GitHub repository secret `RENDER_DEPLOY_HOOK_URL`
4. Add a MySQL database that is reachable from the Render web service
5. In Render, set these environment variables for the app:
	`PORT` and either `MYSQL_URL` or `DATABASE_URL`
6. If you prefer separate variables instead of one connection string, set:
	`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
7. Set the Render health check path to `/health`

The workflow in [.github/workflows/deploy-render.yml](.github/workflows/deploy-render.yml) triggers a Render deploy on every push to `main` and can also be run manually.

The app now supports Render-friendly MySQL configuration by reading `MYSQL_URL` first, then `DATABASE_URL`, and finally the individual `DB_*` variables.

### Render Blueprint

The repository includes [render.yaml](render.yaml) so the Render web service settings are tracked in version control.
It defines the Node runtime, `npm ci` build command, `npm start` start command, and `/health` as the health check path.

`MYSQL_URL` is marked as `sync: false`, which means you still need to set the real MySQL connection string securely in Render.
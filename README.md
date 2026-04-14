# CDCI

Basic Node.js recipe sharing app with Express, MySQL storage, and GitHub Actions CI.

## Local Run

1. Install dependencies with `npm install`
2. Make sure MySQL is running and the `recipes` database exists
3. Start the app with `npm start`
4. Open `http://localhost:3000`

## CI

GitHub Actions runs on pushes to `main` and on pull requests.
The workflow installs dependencies with `npm ci` and runs `npm run check`.

## CD

GitHub Actions can deploy this app to Render.

### Render Setup

1. Create a Render web service connected to this repository
2. In Render, set the start command to `npm start`
3. Add the GitHub repository secret `RENDER_DEPLOY_HOOK_URL`
4. In Render, set these environment variables for the app:
	`PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

The workflow in [.github/workflows/deploy-render.yml](.github/workflows/deploy-render.yml) triggers a Render deploy on every push to `main` and can also be run manually.
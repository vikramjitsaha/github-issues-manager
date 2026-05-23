# GitHub Issues Manager

A clean, dark-themed React + Vite app to **browse, create, and edit GitHub issues** in a private repository.

## Features

- 🔍 **Browse issues** — filter by state (open/closed/all), label, and sort order
- ✏️ **Create issues** — with Markdown editor, label picker, and assignee picker
- 🖊️ **Edit issues** — update title, body, labels; close or reopen
- 💬 **Comment** — add comments with Markdown support and live preview
- 🔒 **Private repos** — uses your GitHub Personal Access Token

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables (optional)

Create `.env` in this folder and set:

```bash
VITE_GITHUB_BASE_URL=https://api.github.com
VITE_GITHUB_TOKEN=ghp_your_token
VITE_GITHUB_ALLOWED_REPOS=owner1/repo1,owner2/repo2
VITE_GITHUB_REPO_DESC=Optional repo description
```

If `TOKEN` and `ALLOWED_REPOS` are set, the setup screen will only allow selecting repositories from that list.

You can still use legacy `VITE_GITHUB_OWNER` and `VITE_GITHUB_REPO` when no allowlist is provided.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 4. Connect your repository

On first launch you'll see a setup screen. Enter:

| Field | Example |
|---|---|
| **Personal Access Token** | `ghp_xxxxxxxxxxxx` |
| **Owner** | `myorg` or `myusername` |
| **Repository** | `my-private-repo` |

#### Generating a PAT

1. Go to [github.com/settings/tokens/new](https://github.com/settings/tokens/new)
2. Give it a name like *Issues Manager*
3. Select the **`repo`** scope (full repo access)
4. Click **Generate token** and copy it

> Your token is stored only in `localStorage` in your browser — never sent anywhere except the GitHub API.

## Build for production

```bash
npm run build
npm run preview
```

## Tech Stack

- [React 18](https://react.dev/)
- [Vite 5](https://vitejs.dev/)
- [React Router v6](https://reactrouter.com/)
- [Octokit REST](https://github.com/octokit/rest.js/) — GitHub API client
- [react-markdown](https://github.com/remarkjs/react-markdown) — Markdown rendering
- [date-fns](https://date-fns.org/) — Date formatting

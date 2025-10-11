# transit-line

[![Deploy to Cloudflare Workers](https://github.com/luthpg/transit-line/actions/workflows/deploy.yml/badge.svg)](https://github.com/luthpg/transit-line/actions/workflows/deploy.yml)

A LIFF App to notify you of the best route to get home, powered by Cloudflare Workers and the Navitime API.

## ✨ Features

- **Transit Route Search**: Find the optimal transit route based on your current location.
- **LINE Bot Integration**: Receive route information directly in your LINE chats.
- **LIFF Interface**: A rich, interactive user interface within the LINE app.
- **Customizable Settings**: Save your home station and other preferences.

## 🛠️ Tech Stack

- **Framework**: [Hono](https://hono.dev/) with [Honox](https://github.com/honojs/honox) for file-based routing.
- **Frontend**: [React](https://react.dev/) (via Honox) with an Islands Architecture.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with `clsx` and `tailwind-merge`.
- **Build Tool**: [Vite](https://vitejs.dev/).
- **Deployment**: [Cloudflare Workers](https://workers.cloudflare.com/).
- **LINE Integration**:
  - [@line/liff](https://developers.line.biz/en/docs/liff/overview/) for the front-end app.
  - [@line/bot-sdk](https://github.com/line/line-bot-sdk-nodejs) for the backend bot.
- **Linting & Formatting**: [Biome](https://biomejs.dev/).
- **Package Manager**: [pnpm](https://pnpm.io/).

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20.x or later)
- [pnpm](https://pnpm.io/installation)
- A [Cloudflare account](https://dash.cloudflare.com/sign-up)
- A [LINE Developers account](https://developers.line.biz/en/)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/luthpg/transit-line.git
    cd transit-line
    ```

2.  Install dependencies:
    ```bash
    pnpm install
    ```

### Environment Variables

This project uses `wrangler` to manage environment variables. For local development, create a `.dev.vars` file in the root of the project. For production, use `wrangler secret put`.

```ini
# .dev.vars

# LINE Bot Credentials
LINE_CHANNEL_SECRET = "..."
LINE_CHANNEL_ACCESS_TOKEN = "..."

# Navitime API Keys (RapidAPI or SBU API Hub)
RAPID_API_KEY = "..."
SBU_API_HUB_KEY = "..."

# The LIFF ID from your LINE Developers console
# This can also be set in wrangler.jsonc for non-secret values
VITE_LIFF_ID = "..."
```

### Running Locally

The development server uses Vite for HMR and `wrangler` to simulate the Cloudflare environment.

1.  **For frontend development (Vite Dev Server)**:
    This is ideal for focusing on UI changes with fast hot-reloading.
    ```bash
    pnpm dev
    ```

2.  **For full-stack local testing (Wrangler)**:
    This runs the application on a local version of the Cloudflare Workers runtime, including backend functions.
    ```bash
    pnpm preview
    ```

## 📦 Build & Deployment

### Build

To build the application for production:

```bash
pnpm build
```

This command builds both the client-side assets and the server-side worker script.

### Deployment

Deploy the application to your Cloudflare account:

1.  **Set Secrets**:
    Ensure you have set the required production secrets in your Cloudflare project:
    ```bash
    npx wrangler secret put LINE_CHANNEL_SECRET
    npx wrangler secret put LINE_CHANNEL_ACCESS_TOKEN
    npx wrangler secret put RAPID_API_KEY
    npx wrangler secret put SBU_API_HUB_KEY
    ```

2.  **Deploy**:
    ```bash
    pnpm deploy
    ```
    This command automatically builds the project before deploying.

## Available Scripts

- `pnpm dev`: Starts the Vite development server for frontend work.
- `pnpm check`: Lints and formats code using Biome.
- `pnpm build`: Builds the client and server for production.
- `pnpm preview`: Runs the app locally using `wrangler dev`.
- `pnpm deploy`: Builds and deploys the app to Cloudflare Workers.
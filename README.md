# Zapp Data Manager

This project is a full-stack application for managing stock item data.

## Project Overview

### Approach & Structure

**Monorepo:** The project uses a monorepo structure managed with `pnpm` workspaces.

- **Backend:** (`backend/`)
  - Built on Cloudflare Workers, exposing a serverless CRUD API
  - Uses Cloudflare D1 as its database.
- **Frontend:** (`ui/`)
  - React + Vite
  - Uses a proxy during local development to forward API requests to the backend

## Running Locally

### Prerequisites

- Node.js
- pnpm

### Setup & Running

1.  **Clone the repository:**
2.  **Install dependencies:**
    From the root of the monorepo install dependencies:

    ```bash
    pnpm install
    ```

3.  **Backend Setup**

    - Navigate to the backend directory:
      ```bash
      cd backend
      ```
    - **Apply D1 Migrations (Local):**
      This command sets up the D1 database schema. The `stock-db` is defined in `wrangler.jsonc`.
      ```bash
      pnpm run migrations:apply:local
      ```

4.  **Access the Application:**
    Navigate back to the root and start the app:

    ```bash
    pnpm run dev
    ```

    Open your browser and navigate to `http://localhost:5173`. The UI will be served and it will communicate with the backend API running on `http://localhost:8787` via the configured proxy.

## Cloud Deployment Strategy

The app can be deployed on CloudFlare.

### Backend (Cloudflare Worker) + Database (D1)

- **Deployment Steps:**
  1.  **Configure `wrangler.jsonc`:** The file has the correct production settings, including the binding for the production D1 database.
  2.  **D1 Database:**
      - Apply migrations to the production D1 database:
        ```bash
        # From the backend/ directory
        pnpm run migrations:apply:remote
        ```
  3.  **Deploy:**
      From the `backend/` directory:
      ```bash
      pnpm run deploy
      ```
  4.  **CI/CD:** For automated deployments, set up a GitHub Action to run the `deploy` script on pushes/merges.

### Frontend (Cloudflare Pages)

- **Deployment Steps:**
  1.  **Push to Git:** Ensure the code is pushed to a Git repository (e.g., GitHub).
  2.  **Connect and configure to Cloudflare Pages:**
  3.  **Deploy:** Cloudflare Pages will automatically build and deploy the site. Subsequent pushes to the configured branch will trigger new deployments.

#### Why this stack?

My go-to tech stack for simple CRUD APIs is AWS Lambda + API Gateway + DynamoDB + Serverless Framework. It’s a powerful combination that makes development and deployment very easy.

For this particular project, I ended up using Cloudflare because it offers a better developer experience for local development. In AWS I typically use a development stack and deploy everything to a non-prod environment. However if I want to provide a simple local developer environment in AWS, I would need to rely on third-party plugins which I personally don’t prefer. That’s why I chose Cloudflare. It provides an easy, out-of-the-box experience without even requiring a Cloudflare account.

## TODO

- Setup more sophisticated API routing (e.g.Hano)
- Write tests
- CI/CD with Github Actions
- ...

# Fiinora (MumbaiHacks)

Monorepo used during MumbaiHacks. Contains backend, mobile app, and web frontend projects, plus infra and tooling.

## Overview

This repository is organized to support local development and containerized deployment:

- `Backend/` — Node/TypeScript backend services and APIs.
- `Frontend-App/` — React Native mobile app.
- `Frontend-Web/` — Web frontend and server.
- `prisma/` — Prisma schemas and migrations shared by services.
- `infra/` — Kubernetes & Terraform configs.
- `scripts/` — Helpful scripts for DB migrations, backups, and deploy helpers.

## Quick Start

Requirements:
- Node.js (v16+)
- npm or pnpm
- Docker (optional, for containers)
- PostgreSQL (or use docker-compose provided DB)

Examples:

Install dependencies (web):

```powershell
cd "c:\Me\AppDev\Fiinora\New folder\Frontend-Web"
npm install
```

Start web dev server:

```powershell
npm run dev
```

Backend (example):

```powershell
cd "c:\Me\AppDev\Fiinora\New folder\Backend\Backend"
npm install
npm run dev
```

Run DB migrations (Prisma):

```powershell
cd "c:\Me\AppDev\Fiinora\New folder\Frontend-Web\prisma"
npx prisma migrate dev
npx prisma db seed
```

Containerized dev:

```powershell
# from subproject with docker-compose.yml (e.g. Frontend-Web)
cd "c:\Me\AppDev\Fiinora\New folder\Frontend-Web"
docker-compose up --build
```

## Running tests

Each subproject contains its own test scripts (Jest). Example:

```powershell
cd "c:\Me\AppDev\Fiinora\New folder\Frontend-Web"
npm test
```

## Contributing

- Create a branch: `git checkout -b feat/your-feature`
- Make small focused commits
- Open a pull request to `main`

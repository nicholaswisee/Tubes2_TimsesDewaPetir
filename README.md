# DOM Vector — TimsesDewaPetir

A web-based DOM tree visualization and traversal tool. Input a URL or raw HTML with a CSS selector, and the app fetches the page, parses its DOM, and animates the traversal in real-time using BFS or DFS with an interactive tree graph. Built as **Tugas Besar 2** for IF2211 — Strategi Algoritma.

## Features

- **URL / raw HTML input** — Fetch and parse any public webpage, or paste HTML directly.
- **CSS selector matching** — Custom CSS selector parser supporting tags, IDs, classes, attributes, and combinators (` `, `>`, `+`, `~`).
- **Traversal algorithms** — BFS and DFS, each with a parallel (goroutine-based) variant.
- **Animated playback** — Step through the traversal with a playhead, speed control, and live highlights on the tree.
- **DOM tree visualization** — Rendered as an interactive directed graph using React Flow.
- **LCA Finder** — Pick any two traversal steps and compute their Lowest Common Ancestor via binary lifting (O(log n) query).
- **Traversal log** — Download a timestamped `.log` file for any completed search.
- **Raw HTML viewer** — Inspect the fetched source in a dark-mode modal.
- **Hot reload dev** — Backend (Go + Air) and frontend (Bun + Vite + HMR) both auto-reload on save.
- **Production deployment** — Docker Compose with Caddy reverse proxy, ready for Azure VM.

## Tech Stack

| Layer      | Technology                                                       |
| ---------- | ---------------------------------------------------------------- |
| Frontend   | React 19, TanStack Start (SSR), React Flow, Tailwind CSS 4, Vite |
| Backend    | Go 1.26, Gin, `golang.org/x/net/html`                            |
| Traversal  | BFS / DFS with parallel (goroutine) variants                     |
| LCA        | Binary lifting (O(log n) query, O(n log n) preprocessing)        |
| CSS Parser | Custom recursive-descent parser (selector.go)                    |
| Dev Infra  | Docker Compose, Air (Go hot reload), Vite HMR                    |
| Prod Infra | Docker Compose, Caddy (reverse proxy), Azure VM                  |

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Running Locally (Development)

```bash
# 1. Clone the repo
git clone https://github.com/nicholaswisee/Tubes2_TimsesDewaPetir
cd Tubes2_TimsesDewaPetir

# 2. Start both services
docker compose up --build
```

| Service  | URL                              | Notes                           |
| -------- | -------------------------------- | ------------------------------- |
| Frontend | http://localhost:3000            | Bun dev server with HMR         |
| Backend  | http://localhost:8080            | Gin with air hot-reload         |
| Health   | http://localhost:8080/api/health | Should return `{"status":"ok"}` |

### Hot reload

- **Backend** — edit any `.go` file and air automatically rebuilds and restarts the server. No manual step needed.
- **Frontend** — Bun's dev server reloads the browser on file save via HMR.

### Stopping

```bash
docker compose down
```

### Rebuilding after dependency changes

If you add a Go module (`go get ...`) or a new npm/bun package, rebuild the images:

```bash
docker compose up --build
```

## Running in Production

```bash
# 1. Set your VM's public IP
echo "VM_IP=your.vm.public.ip" > .env

# 2. Deploy
docker compose -f docker-compose.prod.yml up -d --build
```

The production stack runs:

- **Caddy** on port 80 as a reverse proxy
- **Backend** in release mode (compiled binary, no hot reload)
- **Frontend** as a production SSR server

A deployment script is available at `scripts/deploy.sh` (pulls latest, rebuilds, restarts).

## Project Structure

```
.
├── docker-compose.yml              # Dev: hot-reload services
├── docker-compose.prod.yml         # Prod: Caddy + compiled backend + SSR frontend
├── Caddyfile                        # Caddy reverse proxy config (/api/* → backend, /* → frontend)
├── .env.example                     # Template for VM_IP variable
│
├── backend/
│   ├── Dockerfile                   # Multi-stage: base / dev (air) / builder / final (alpine)
│   ├── .air.toml                    # Air hot-reload configuration
│   ├── go.mod / go.sum              # Go module dependencies
│   ├── main.go                      # Entry point: CORS setup, Gin engine, route registration
│   └── internal/
│       ├── handler/
│       │   └── scrape.go            # HTTP handlers + route registration (RegisterRoutes)
│       ├── model/
│       │   ├── node.go              # DOMNode, TraversalStep, request/response structs
│       │   └── utils.go             # MaxDepth helper
│       ├── scraper/
│       │   └── scraper.go           # HTTP fetch + HTML → DOM tree parser
│       ├── selector/
│       │   ├── models.go            # Matcher interface + Group/Combinator/Compound types
│       │   ├── selector.go          # Recursive-descent CSS selector parser + matching
│       │   └── selector_test.go     # Selector tests
│       ├── traversal/
│       │   ├── bfs.go               # BFS traversal sequential
│       │   ├── bfs_parallel.go      # BFS traversal parallel (goroutines)
│       │   ├── dfs.go               # DFS traversal sequential
│       │   └── dfs_parallel.go      # DFS traversal parallel (goroutines)
│       ├── lca/
│       │   └── binary_lifting.go    # Binary lifting precomputation + O(log n) LCA queries
│       └── logger/
│           └── logger.go            # Traversal log file writer
│
├── frontend/
│   ├── Dockerfile                    # Production SSR build
│   ├── package.json                  # Bun dependencies (React 19, TanStack, React Flow, etc.)
│   ├── vite.config.ts                # Vite config with dev proxy (/api → backend:8080)
│   ├── tsconfig.json
│   └── src/
│       ├── api/
│       │   ├── client.ts             # Axios API client (search, LCA, HTML, log download)
│       │   └── types.ts              # TypeScript interfaces matching backend models
│       ├── components/
│       │   ├── SearchForm.tsx         # URL/HTML/selector/algorithm form
│       │   ├── DomTreeGraph.tsx      # Interactive React Flow tree visualization
│       │   └── ThemeToggle.tsx       # Light/dark mode toggle
│       ├── routes/
│       │   ├── __root.tsx            # TanStack root layout
│       │   ├── index.tsx             # Main page (search + viz + LCA + log)
│       │   └── about.tsx             # About page
│       ├── routeTree.gen.ts          # Auto-generated TanStack route tree
│       ├── router.tsx                # Router config
│       └── styles.css                # Global styles + CSS variables
│
├── scripts/
│   ├── deploy.sh                     # Linux deploy script
│   └── deploy.ps1                    # Windows PowerShell deploy script
│
└── docs/
    └── Tubes2_TimsesDewaPetir.pdf    # Assignment specification
```

## API Endpoints

| Method | Path               | Description                                    |
| ------ | ------------------ | ---------------------------------------------- |
| GET    | `/api/health`      | Health check → `{"status":"ok"}`               |
| POST   | `/api/search`      | Run a DOM traversal search                     |
| POST   | `/api/lca`         | Compute LCA of two traversal steps             |
| GET    | `/api/html/latest` | Get the raw HTML from the most recent search   |
| GET    | `/api/log/latest`  | Download the last traversal log as `.log` file |

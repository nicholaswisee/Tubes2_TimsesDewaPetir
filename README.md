# Tubes2 — TimsesDewaPetir

Tubes 2 hahahaha

## Prerequisites

yh just intall docker and docker-compose

---

## Running locally (development)

```bash
# 1. Clone the repo
git clone https://github.com/nicholaswisee/Tubes2_TimsesDewaPetir
cd Tubes2_TimsesDewaPetir

# 2. Start both services
docker compose up --build
```

| Service  | URL                        | Notes |
|----------|----------------------------|-------|
| Frontend | http://localhost:3000      | Bun dev server with HMR |
| Backend  | http://localhost:8080      | Gin with air hot-reload |
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

---

## Project structure

```
.
├── docker-compose.yml          # Dev (hot reload)
├── docker-compose.prod.yml     # Prod (Azure VM + Caddy)
├── Caddyfile                   # HTTP reverse proxy config
├── backend/
│   ├── .air.toml               # air hot-reload config
│   ├── Dockerfile              # Multi-stage: base / dev / builder / final
│   ├── main.go                 # Entry point — wires CORS + routes
│   └── internal/
│       ├── handler/            # HTTP handlers + route registration
│       ├── model/              # Request / response structs
│       ├── scraper/            # Wikipedia scraping logic
│       ├── selector/           # Link selection logic
│       └── traversal/          # BFS / IDDFS algorithms
└── frontend/
    ├── Dockerfile
    ├── vite.config.ts          # Vite dev proxy: /api → localhost:8080
    └── src/
```

### Adding a new API route

1. Define structs in `backend/internal/model/`
2. Write the handler function in `backend/internal/handler/`
3. Register it in `RegisterRoutes()` in the same file — `main.go` never changes

```go
func RegisterRoutes(r *gin.Engine) {
    api := r.Group("/api")
    {
        api.GET("/health", Health)
        api.POST("/search", Search)
        api.GET("/your-new-route", YourNewHandler) // add here
    }
}
```

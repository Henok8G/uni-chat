# ethi-uni-chat – Deployment Guide

This guide covers production deployment of ethi-uni-chat (a Next.js + Socket.IO + WebRTC app). **Phase 11** consolidated everything onto a single custom Node.js server entry point.

---

## Architecture Overview

```
[Browser] ──HTTP/WS──► [Nginx / Reverse Proxy]
                              │
                              └──► [Node.js: server.ts (port 3000)]
                                        ├── Next.js (pages, API routes)
                                        └── Socket.IO (/socket.io)
```

- **One port** for both Next.js and Socket.IO.
- The reverse proxy must forward **WebSocket upgrade requests** on the same path.
- Socket.IO uses the path `/socket.io` (explicit, not default detection).

---

## Required Environment Variables

### Database
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (for Prisma + connection pooling) |
| `DIRECT_URL` | Direct PostgreSQL URL (for migrations) |

### Authentication
| Variable | Description |
|---|---|
| `JWT_SECRET` | Secret for signing session JWTs |
| `NEXTAUTH_URL` | Full URL of your deployment (e.g. `https://myapp.com`) |

### Email
| Variable | Description |
|---|---|
| `EMAIL_HOST` | SMTP host |
| `EMAIL_PORT` | SMTP port |
| `EMAIL_USER` | SMTP username |
| `EMAIL_PASS` | SMTP password |
| `EMAIL_FROM` | From address for outgoing email |

### Payment
| Variable | Description |
|---|---|
| `PAYMENT_SECRET_KEY` | Payment processor secret key |

### Server (Phase 11)
| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | TCP port to listen on |
| `CORS_ORIGIN` | `*` | Allowed origin for Socket.IO CORS. **Set to your domain in production.** |
| `NODE_ENV` | `development` | Set to `production` for prod build |

### WebRTC (Phase 11)
| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_STUN_SERVERS` | Google STUN | Comma-separated STUN URLs |
| `NEXT_PUBLIC_TURN_SERVERS` | *(none)* | Comma-separated TURN URLs — **recommended for production** |
| `NEXT_PUBLIC_TURN_USERNAME` | *(none)* | TURN credential username |
| `NEXT_PUBLIC_TURN_PASSWORD` | *(none)* | TURN credential password |

> **Why TURN?** Users behind symmetric NAT or corporate firewalls cannot establish direct peer-to-peer WebRTC connections. A TURN relay server is required for reliable connectivity on production networks (universities, offices). Self-host with [coturn](https://github.com/coturn/coturn) or use a managed service.

### Rate Limits (Phase 11)
| Variable | Default | Description |
|---|---|---|
| `MAX_IPS_PER_USER_24H` | `3` | Max distinct login IPs per user per 24 h |
| `MAX_USERS_PER_IP_1H` | `5` | Max distinct users per IP per 1 h |
| `MAX_REPORTS_PER_HOUR` | `5` | Max reports a user can file per hour |
| `MATCH_START_RATE_LIMIT_PER_MINUTE` | `10` | Max Start/Next queue joins per socket per minute |

---

## Building and Starting

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment
```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Run database migrations
```bash
npx prisma migrate deploy
```

### 4. Build
```bash
npm run build
# Builds: Next.js app + compiles server.ts → dist/server.js
```

### 5. Start
```bash
npm run start
# Runs: NODE_ENV=production node dist/server.js
# Listens on PORT (default 3000)
```

---

## Reverse Proxy Configuration

### Nginx (WebSocket support required)

```nginx
server {
    listen 80;
    server_name myapp.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name myapp.com;

    ssl_certificate     /etc/letsencrypt/live/myapp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/myapp.com/privkey.pem;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;

        # WebSocket upgrade headers (required for Socket.IO)
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;

        # Increase timeouts for long-lived WebSocket connections
        proxy_read_timeout  3600s;
        proxy_send_timeout  3600s;
    }

    # Block external access to internal metrics endpoint
    location /api/internal/ {
        deny all;
    }
}
```

---

## Process Management

Use a process manager to keep the server running and restart on crashes:

```bash
# PM2 example
npm install -g pm2
pm2 start dist/server.js --name ethi-uni-chat
pm2 save
pm2 startup
```

Or use Docker + a restart policy.

---

## Scaling & Multi-Node (Phase 12)

If you are graduating from a single-node deployment to a horizontal cluster to support large audiences across multiple universities, you must satisfy two requirements: Sticky Sessions and Redis Pub/Sub.

### 1. Sticky Sessions (IP Hash)
Because the queuing and matching mechanics (`searchingUserMap`, `queue`) rely on node-local algorithms to match pairs securely without global database locking, **you must configure your Load Balancer to use Sticky Sessions.** 
* When using **Nginx**: rely on `ip_hash;` in your `upstream` block.
* When using **AWS ALB**: enable target group stickiness with a reasonable duration (e.g. 1 hour).
* **Why**: The life of a socket connection and sequential re-queues (`Next`) must remain locked to the same instance where the user's Socket state exists.

### 2. Redis Event Adapter
Since two matching users might be routed to different backend pods natively behind the load balancer, their chat and WebRTC connection events must bridge across different Node instances.
* Provide a single, shared `REDIS_URL` across all your production nodes (e.g., `redis://your-redis-host:6379`).
* The startup process will detect `REDIS_URL` and bind the `@socket.io/redis-adapter`. 
* All WebRTC `offer`, `answer`, `ice_candidate` and textual `message` payloads will transparently route between instances perfectly securely.

### Scaling TURN/STUN capacity
You **must** monitor TURN capacity. A single Coturn server typically bridges 2k-5k streams. Deploying to more than a few universities demands managed cloud TURN providers (like Twilio or Metered) routing users via GeoDNS, eliminating media bottlenecks.

---

## Observability

### Logs
All server events are logged as structured JSON to stdout. Pipe to your log aggregator (Datadog, Logtail, etc.):
```bash
node dist/server.js 2>&1 | your-log-shipper
```

### Metrics (internal)
A basic in-memory metrics endpoint is available at `/api/internal/metrics`.  
**Blocked externally by the Nginx config above.** Access internally:
```bash
curl http://localhost:3000/api/internal/metrics
```
Returns: `{ activeConnections, activeChatSessions, totalReportsCreated, serverStartedAt }`

---

## Dev Mode

```bash
npm run dev
# Runs: ts-node --project tsconfig.server.json server.ts
# Hot-reload is NOT provided by ts-node – use next dev separately for UI changes
# Or: use nodemon for server restarts
```

For a better dev experience, you can run Next.js and the custom server separately:
```bash
# Terminal 1 – just Next.js (UI hot-reload)
npx next dev

# Terminal 2 – Socket.IO only (if you split it out)
# (not applicable after Phase 11 consolidation – use npm run dev for full stack)
```

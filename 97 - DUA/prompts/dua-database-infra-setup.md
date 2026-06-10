# Dua Platform — Database & Infrastructure Setup

> **How to use this file:** This is your ops reference. Follow it top to bottom when setting up a new environment. Everything here is reproducible — if your server dies, you can rebuild from this file in under an hour.

---

## Table of Contents

1. [Local Development Setup](#1-local-development-setup)
2. [PostgreSQL](#2-postgresql)
3. [Redis](#3-redis)
4. [Prisma Workflow](#4-prisma-workflow)
5. [Nginx Configuration](#5-nginx-configuration)
6. [SSL — Let's Encrypt](#6-ssl--lets-encrypt)
7. [KVM2 VPS — First-Time Server Setup](#7-kvm2-vps--first-time-server-setup)
8. [Docker & Docker Compose](#8-docker--docker-compose)
9. [Environment Files](#9-environment-files)
10. [Backups](#10-backups)
11. [Maintenance Runbook](#11-maintenance-runbook)

---

## 1. Local Development Setup

### Prerequisites

Install these on your dev machine:

```bash
node --version    # should be v20+
npm --version     # v10+
docker --version  # v24+
git --version
```

### Clone and bootstrap

```bash
git clone https://github.com/yourusername/dua-platform.git
cd dua-platform

# Install all workspace deps (root + apps/web + apps/api)
npm install

# Copy env examples
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### Start local services with Docker

For local dev, only run the infrastructure (Postgres + Redis) in Docker. Run the app itself with `npm run dev` so you get hot reload.

```bash
# Start only postgres + redis
docker compose up -d postgres redis

# Verify they are running
docker compose ps
```

### Run the app locally

```bash
# Terminal 1 — API (port 5000)
cd apps/api
npx prisma migrate dev   # run on first setup only
npm run dev

# Terminal 2 — Frontend (port 5173)
cd apps/web
npm run dev
```

App is now at `http://localhost:5173`. API at `http://localhost:5000`.

---

## 2. PostgreSQL

### Local Docker config (`docker-compose.yml`)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: dua_postgres_dev
    environment:
      POSTGRES_USER: dua_user
      POSTGRES_PASSWORD: dua_dev_password
      POSTGRES_DB: dua_db
    ports:
      - "5432:5432"           # exposed locally for Prisma Studio / psql
    volumes:
      - pg_data_dev:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dua_user -d dua_db"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pg_data_dev:
```

### Production config (`docker-compose.prod.yml`)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: dua_postgres_prod
    env_file: .env.prod
    volumes:
      - pg_data_prod:/var/lib/postgresql/data
    # NO ports exposed — only internal Docker network access
    networks:
      - internal
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pg_data_prod:
```

### Useful psql commands

```bash
# Connect to local postgres
docker exec -it dua_postgres_dev psql -U dua_user -d dua_db

# Inside psql
\dt                          -- list all tables
\d "User"                    -- describe User table
SELECT COUNT(*) FROM "Dua";  -- count rows
\q                           -- quit

# Connect to production postgres (from inside KVM2)
docker exec -it dua_postgres_prod psql -U $POSTGRES_USER -d $POSTGRES_DB
```

### PostgreSQL performance settings

For KVM2 (2 vCPU, 4GB RAM), add these to a `postgresql.conf` override. Create `infra/docker/postgres/postgresql.conf`:

```ini
# Memory
shared_buffers = 512MB           # ~25% of RAM
effective_cache_size = 1536MB    # ~75% of RAM
work_mem = 16MB
maintenance_work_mem = 128MB

# Connections
max_connections = 50             # keep low — Prisma pools connections

# Write performance
wal_buffers = 16MB
synchronous_commit = on          # keep on for production safety

# Logging slow queries (helpful for debugging)
log_min_duration_statement = 500  # log queries slower than 500ms
```

Mount it in compose:

```yaml
postgres:
  volumes:
    - pg_data_prod:/var/lib/postgresql/data
    - ./infra/docker/postgres/postgresql.conf:/etc/postgresql/postgresql.conf
  command: postgres -c config_file=/etc/postgresql/postgresql.conf
```

---

## 3. Redis

### Local Docker config

```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: dua_redis_dev
    ports:
      - "6379:6379"
    volumes:
      - redis_data_dev:/data
    command: redis-server --appendonly yes   # persist data to disk
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
```

### Production config

```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: dua_redis_prod
    volumes:
      - redis_data_prod:/data
    command: >
      redis-server
      --appendonly yes
      --requirepass ${REDIS_PASSWORD}
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
    networks:
      - internal
    restart: unless-stopped
```

If you set a Redis password in production, update `REDIS_URL` to:
```
redis://:yourpassword@redis:6379
```

### Useful Redis commands

```bash
# Connect to local redis
docker exec -it dua_redis_dev redis-cli

# Inside redis-cli
KEYS *                  -- list all keys (careful in production)
TTL rate_limit:1.2.3.4  -- check TTL on a rate limit key
FLUSHDB                 -- clear all keys (dev only!)
INFO memory             -- memory usage stats
```

---

## 4. Prisma Workflow

### Initial setup

```bash
cd apps/api

# Install Prisma
npm install prisma @prisma/client

# Initialize (creates prisma/schema.prisma)
npx prisma init
```

### Daily workflow

```bash
# After changing schema.prisma — create and apply a migration
npx prisma migrate dev --name describe_what_changed
# Example: npx prisma migrate dev --name add_isPaused_to_user

# Regenerate Prisma Client after schema change
npx prisma generate

# Open Prisma Studio (visual DB browser) — dev only
npx prisma studio
# Opens at http://localhost:5555

# Check migration status
npx prisma migrate status
```

### Production migration (run during deploy)

```bash
# Never use migrate dev in production — use deploy
npx prisma migrate deploy
```

Add this to your deploy script / GitHub Actions before starting the API container:

```bash
docker exec dua_api_prod npx prisma migrate deploy
```

Or add it as the CMD in your Dockerfile entrypoint script.

### Reset database (dev only — destroys all data)

```bash
npx prisma migrate reset
```

### Seed data (optional dev helper)

Create `apps/api/src/prisma/seed.js`:

> **ESM note:** This file uses `import` syntax. Make sure `"type": "module"` is in `apps/api/package.json`, OR rename the file to `seed.mjs` and update the `prisma.seed` path accordingly.

```js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('password123', 12);
  const adminHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'AdminPass123!', 12);

  // Regular test user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      username: 'testuser',
      password: hash,
      name: 'Test User',
      bio: 'Send me a dua 🤲',
      role: 'USER',
    },
  });

  // Admin user — use ADMIN_EMAIL / ADMIN_PASSWORD from .env
  await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@yourdomain.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@yourdomain.com',
      username: 'admin',
      password: adminHash,
      name: 'Admin',
      role: 'ADMIN',
    },
  });

  await prisma.dua.createMany({
    data: [
      { message: 'May Allah bless you with health and happiness.', ownerId: user.id },
      { message: 'Ameen ya Rabb. May your prayers be answered.', ownerId: user.id },
      { message: 'May Allah make things easy for you.', ownerId: user.id },
    ],
  });

  console.log('Seed complete.');
  console.log('Test user:  test@example.com / password123');
  console.log(`Admin user: ${process.env.ADMIN_EMAIL || 'admin@yourdomain.com'} / ${process.env.ADMIN_PASSWORD || 'AdminPass123!'}`);
  console.log('⚠️  Change ADMIN_PASSWORD in .env before running seed in production!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Add to `package.json`:
```json
"prisma": {
  "schema": "src/prisma/schema.prisma",
  "seed": "node src/prisma/seed.js"
}
```

Run with:
```bash
npx prisma db seed
```

### Migration naming convention

```
YYYY-MM-DD_short_description
Examples:
  init_schema
  add_isPaused_to_user
  add_role_and_isBanned_to_user
  add_report_model
  add_isHidden_to_dua
  add_email_notifications_field
```

---

## 5. Nginx Configuration

### Directory structure on KVM2

```
infra/nginx/
├── nginx.conf              # main nginx config (http block)
└── sites-enabled/
    ├── api.conf            # api.yourdomain.com
    └── app.conf            # app.yourdomain.com (or yourdomain.com)
```

### `infra/nginx/nginx.conf`

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent"';

    access_log /var/log/nginx/access.log main;

    sendfile        on;
    keepalive_timeout 65;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    client_max_body_size 5M;   # for avatar uploads

    include /etc/nginx/conf.d/*.conf;
}
```

### `infra/nginx/sites-enabled/api.conf`

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect HTTP to HTTPS (after SSL is set up)
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    location / {
        proxy_pass         http://api:5000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

### `infra/nginx/sites-enabled/app.conf`

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://yourdomain.com$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    location / {
        proxy_pass         http://web:80;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

---

## 6. SSL — Let's Encrypt

### First-time SSL setup on KVM2

Before getting a cert, make sure:
- DNS A records for `yourdomain.com` and `api.yourdomain.com` point to your KVM2 IP
- Port 80 and 443 are open in your firewall (`ufw allow 80` and `ufw allow 443`)

```bash
# On KVM2 — install certbot
sudo apt install certbot -y

# Stop nginx temporarily (certbot needs port 80 free)
docker compose -f docker-compose.prod.yml stop nginx

# Get certificates (do this for each subdomain)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
sudo certbot certonly --standalone -d api.yourdomain.com

# Certs are saved to:
# /etc/letsencrypt/live/yourdomain.com/
# /etc/letsencrypt/live/api.yourdomain.com/

# Mount the letsencrypt dir into nginx container (in docker-compose.prod.yml):
# volumes:
#   - /etc/letsencrypt:/etc/letsencrypt:ro

# Start nginx back
docker compose -f docker-compose.prod.yml up -d nginx
```

### Auto-renewal (cron on KVM2)

```bash
# Open crontab
sudo crontab -e

# Add this line — renews at 3am every Monday
0 3 * * 1 certbot renew --quiet --pre-hook "docker stop dua_nginx_prod" --post-hook "docker start dua_nginx_prod"
```

---

## 7. KVM2 VPS — First-Time Server Setup

Run these commands once on a fresh Hostinger KVM2 Ubuntu 24.04 server.

### Step 1 — Initial login and security

```bash
# SSH in as root
ssh root@YOUR_KVM2_IP

# Update packages
apt update && apt upgrade -y

# Create a non-root deploy user
adduser deploy
usermod -aG sudo deploy

# Copy your SSH key to the deploy user
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Disable root SSH login
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart sshd

# Log out and log back in as deploy user
```

### Step 2 — Firewall

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3001/tcp    # Uptime Kuma (restrict to your IP if possible)
ufw enable
ufw status
```

### Step 3 — Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add deploy user to docker group (no sudo needed)
sudo usermod -aG docker deploy

# Log out and back in for group change to take effect
# Verify
docker --version
docker compose version
```

### Step 4 — Create project directory

```bash
mkdir -p /home/deploy/dua-platform
cd /home/deploy/dua-platform

# Create .env.prod — fill in real values
nano .env.prod
```

### Step 5 — Clone repo and deploy

```bash
git clone https://github.com/yourusername/dua-platform.git .

# Pull latest images and start
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Run DB migrations
docker exec dua_api_prod npx prisma migrate deploy

# Check logs
docker compose -f docker-compose.prod.yml logs -f
```

### Step 6 — Configure log rotation (prevent disk fill)

Create `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
sudo systemctl restart docker
```

---

## 8. Docker & Docker Compose

### Full `docker-compose.yml` (local dev)

```yaml
# version: field is deprecated in Docker Compose v2+ — omit it

services:
  postgres:
    image: postgres:16-alpine
    container_name: dua_postgres_dev
    environment:
      POSTGRES_USER: dua_user
      POSTGRES_PASSWORD: dua_dev_password
      POSTGRES_DB: dua_db
    ports:
      - "5432:5432"
    volumes:
      - pg_data_dev:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dua_user -d dua_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: dua_redis_dev
    ports:
      - "6379:6379"
    volumes:
      - redis_data_dev:/data
    command: redis-server --appendonly yes
    restart: unless-stopped

volumes:
  pg_data_dev:
  redis_data_dev:
```

### Full `docker-compose.prod.yml` (production on KVM2)

```yaml
# version: field is deprecated in Docker Compose v2+ — omit it

networks:
  internal:
    driver: bridge
  external:
    driver: bridge

services:
  nginx:
    image: nginx:alpine
    container_name: dua_nginx_prod
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infra/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./infra/nginx/sites-enabled:/etc/nginx/conf.d:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - nginx_logs:/var/log/nginx
    depends_on:
      - api
      - web
    networks:
      - external
      - internal
    restart: unless-stopped

  api:
    image: ghcr.io/yourusername/dua-api:latest
    container_name: dua_api_prod
    env_file: .env.prod
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - internal
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:5000/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s

  web:
    image: ghcr.io/yourusername/dua-web:latest
    container_name: dua_web_prod
    networks:
      - internal
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    container_name: dua_postgres_prod
    env_file: .env.prod
    volumes:
      - pg_data_prod:/var/lib/postgresql/data
      - ./infra/docker/postgres/postgresql.conf:/etc/postgresql/postgresql.conf
    command: postgres -c config_file=/etc/postgresql/postgresql.conf
    networks:
      - internal
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: dua_redis_prod
    volumes:
      - redis_data_prod:/data
    command: >
      redis-server
      --appendonly yes
      --requirepass ${REDIS_PASSWORD}
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
    networks:
      - internal
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  uptime-kuma:
    image: louislam/uptime-kuma:1
    container_name: dua_kuma
    volumes:
      - kuma_data:/app/data
    ports:
      - "3001:3001"     # restrict to your IP via firewall
    networks:
      - internal      # to reach postgres/redis by container name
      - external      # must be on external network to reach the internet (api.yourdomain.com etc.)
    restart: unless-stopped

volumes:
  pg_data_prod:
  redis_data_prod:
  kuma_data:
  nginx_logs:
```

### Common Docker commands

```bash
# See all running containers
docker compose -f docker-compose.prod.yml ps

# Tail logs for a specific service
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f postgres

# Restart a single service
docker compose -f docker-compose.prod.yml restart api

# Pull new images and redeploy (what CI does)
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Enter a running container's shell
docker exec -it dua_api_prod sh

# Check resource usage
docker stats

# Remove unused images (free up disk)
docker image prune -f
```

---

## 9. Environment Files

### `apps/api/.env.example`

```env
NODE_ENV=development
PORT=5000

# PostgreSQL
DATABASE_URL=postgresql://dua_user:dua_dev_password@localhost:5432/dua_db

# JWT
JWT_SECRET=change-this-to-a-long-random-string-in-production
JWT_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379

# CORS — frontend origin
CORS_ORIGIN=http://localhost:5173

# Admin seed (used by prisma seed script to create first admin account)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=change-this-before-deploy

# Phase 2 — leave empty for now
EMAIL_FROM=
RESEND_API_KEY=
```

### `.env.prod` (on KVM2 only — never commit this file)

```env
NODE_ENV=production
PORT=5000

# PostgreSQL
POSTGRES_USER=dua_user
POSTGRES_PASSWORD=use-a-strong-random-password-here
POSTGRES_DB=dua_db
DATABASE_URL=postgresql://dua_user:use-a-strong-random-password-here@postgres:5432/dua_db

# JWT
JWT_SECRET=use-a-64-char-random-string-openssl-rand-hex-32
JWT_EXPIRES_IN=7d

# Redis
REDIS_PASSWORD=another-strong-password
REDIS_URL=redis://:another-strong-password@redis:6379

# CORS
CORS_ORIGIN=https://yourdomain.com

# Admin seed
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=use-a-very-strong-password-here

# Phase 2
EMAIL_FROM=
RESEND_API_KEY=
```

### Generate secure secrets

```bash
# Generate JWT_SECRET (run on your local machine)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or with openssl
openssl rand -hex 32

# Generate a strong DB password
openssl rand -base64 24
```

### `.gitignore` — make sure these are never committed

```
.env
.env.prod
.env.local
*.pem
*.key
```

---

## 10. Backups

### Automated Postgres backup script

Create `/home/deploy/backup-db.sh` on KVM2:

```bash
#!/bin/bash

# Config
DB_CONTAINER="dua_postgres_prod"
DB_USER="dua_user"
DB_NAME="dua_db"
BACKUP_DIR="/home/deploy/backups/db"
RETENTION_DAYS=7

# Create backup dir if missing
mkdir -p "$BACKUP_DIR"

# Filename with timestamp
FILENAME="$BACKUP_DIR/dua_db_$(date +%Y-%m-%d_%H-%M).sql.gz"

# Dump and compress
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$FILENAME"

# Check if dump succeeded
if [ $? -eq 0 ]; then
  echo "$(date): Backup successful: $FILENAME"
else
  echo "$(date): Backup FAILED" >&2
  exit 1
fi

# Delete backups older than RETENTION_DAYS
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "$(date): Old backups cleaned. Current backups:"
ls -lh "$BACKUP_DIR"
```

```bash
# Make it executable
chmod +x /home/deploy/backup-db.sh

# Create the logs directory
mkdir -p /home/deploy/logs

# Test it manually first
/home/deploy/backup-db.sh

# Schedule with cron — runs at 2am every day
crontab -e
0 2 * * * /home/deploy/backup-db.sh >> /home/deploy/logs/backup.log 2>&1
```

### Restore from backup

```bash
# List available backups
ls -lh /home/deploy/backups/db/

# Restore (this OVERWRITES current data — be careful)
gunzip -c /home/deploy/backups/db/dua_db_2025-06-01_02-00.sql.gz | \
  docker exec -i dua_postgres_prod psql -U dua_user -d dua_db
```

### Offsite backup (optional but recommended)

If Hostinger gives you an FTP/SFTP location or you have an S3-compatible bucket, add to the backup script:

```bash
# Upload to remote (using rclone or scp)
# rclone copy "$FILENAME" remote:dua-backups/
# scp "$FILENAME" user@backup-server:/backups/
```

### What else to back up

```bash
# .env.prod — store a copy in a password manager (1Password, Bitwarden)
# SSL certificates — Let's Encrypt auto-renews, but keep a note of the certbot setup
# docker-compose.prod.yml — it's in git
# nginx configs — they're in git
```

---

## 11. Maintenance Runbook

### Health check commands (run these after any deployment)

```bash
# All containers running?
docker compose -f docker-compose.prod.yml ps

# API responding?
curl -s https://api.yourdomain.com/health | python3 -m json.tool

# Check recent API logs for errors
docker compose -f docker-compose.prod.yml logs --tail=50 api

# DB accepting connections?
docker exec dua_postgres_prod pg_isready -U dua_user -d dua_db

# Redis alive?
docker exec dua_redis_prod redis-cli -a $REDIS_PASSWORD ping
```

### Disk space check

```bash
# Overall disk usage
df -h

# Docker-specific usage (images, volumes, containers)
docker system df

# Which volumes use the most space
docker system df -v
```

### Manual redeploy (if GitHub Actions fails)

```bash
cd /home/deploy/dua-platform

# Pull latest code
git pull origin main

# Pull latest images from GHCR
docker compose -f docker-compose.prod.yml pull

# Run migrations
docker exec dua_api_prod npx prisma migrate deploy

# Restart
docker compose -f docker-compose.prod.yml up -d

# Verify
curl -s https://api.yourdomain.com/health
```

### Uptime Kuma monitors to set up

After first deploy, go to `http://YOUR_KVM2_IP:3001` and add these monitors:

| Name | Type | URL / Target | Interval | Alert |
|---|---|---|---|---|
| API health | HTTP(s) | `https://api.yourdomain.com/health` | 60s | Telegram |
| Frontend | HTTP(s) | `https://yourdomain.com` | 60s | Telegram |
| Postgres | TCP port | `dua_postgres_prod:5432` | 60s | Telegram |
| Redis | TCP port | `dua_redis_prod:6379` | 60s | Telegram |
| API SSL cert | HTTP(s) | `https://api.yourdomain.com` | 1h | Telegram (14d before expiry) |

> **Note on Postgres/Redis monitoring:** In production these containers have no public ports — they are only reachable by Docker container name inside the `internal` network. Uptime Kuma must be on the `internal` network (see `docker-compose.prod.yml`) to reach them by container name. Use `dua_postgres_prod` and `dua_redis_prod` as the hostnames, not `localhost`.

### Disk space alert (cron on KVM2)

```bash
# Add to crontab — alerts if disk > 80%
*/30 * * * * df / | awk 'NR==2 {if ($5+0 > 80) print "ALERT: Disk at " $5 " on dua server"}' | grep ALERT | mail -s "Disk Alert" you@example.com
```

Or use a simple Telegram bot alert script:

```bash
#!/bin/bash
USAGE=$(df / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$USAGE" -gt 80 ]; then
  curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_TOKEN/sendMessage" \
    -d chat_id="$TELEGRAM_CHAT_ID" \
    -d text="⚠️ Dua server disk is at ${USAGE}%"
fi
```

### Common issues and fixes

| Symptom | Likely cause | Fix |
|---|---|---|
| API returns 502 | API container crashed | `docker compose logs api` → fix error → `docker compose up -d api` |
| Can't connect to DB | Postgres not healthy yet | Wait 15s, check `docker compose ps postgres` |
| SSL cert expired | Certbot renewal failed | `sudo certbot renew --force-renewal` then restart nginx |
| Disk full | Docker logs or old images | `docker image prune -f` + check backup dir size |
| Rate limit broken | Redis down | `docker compose restart redis` |
| Migration failed on deploy | Schema conflict | `docker exec dua_api_prod npx prisma migrate status` — resolve conflict manually |

---

## Checklist: New Environment Launch

- [ ] KVM2 provisioned, `deploy` user created, root SSH disabled
- [ ] Firewall configured (80, 443, SSH only public)
- [ ] Docker installed, `deploy` in docker group
- [ ] DNS A records pointing to KVM2 IP
- [ ] Repo cloned to `/home/deploy/dua-platform`
- [ ] `.env.prod` created with real secrets
- [ ] SSL certificates obtained via certbot
- [ ] `docker compose -f docker-compose.prod.yml up -d` — all containers green
- [ ] `npx prisma migrate deploy` run inside API container
- [ ] `GET /health` returns 200
- [ ] Frontend loads at `https://yourdomain.com`
- [ ] Uptime Kuma monitors configured + Telegram alerts tested
- [ ] Daily DB backup cron set up and tested manually
- [ ] Log rotation configured in `/etc/docker/daemon.json`
- [ ] GitHub Actions deploy workflow tested end-to-end
- [ ] Seed script run to create admin user (`npx prisma db seed`)
- [ ] Admin panel accessible at `https://yourdomain.com/admin` with admin credentials
- [ ] Admin password changed from seed default

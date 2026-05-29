# Docker Deployment

This project runs as one Node.js container. The container listens on port `3001`,
while Docker publishes it only on `127.0.0.1:3101` by default. Put Nginx in
front of it to serve `http://124.220.103.120/` without exposing the app port to
the public internet.

## 1. Prepare the server

```bash
sudo apt update
sudo apt install -y git nginx docker.io docker-compose-plugin
sudo systemctl enable --now docker nginx
```

## 2. Clone the repository

```bash
sudo mkdir -p /opt/cloudladder
sudo chown "$USER:$USER" /opt/cloudladder
git clone https://github.com/caijuren/CloudLadder.git /opt/cloudladder
cd /opt/cloudladder
```

If the repository already exists on the server:

```bash
cd /opt/cloudladder
git pull
```

## 3. Create production environment variables

```bash
cp -n .env.example .env
nano .env
```

Use a long random value for `JWT_SECRET`. Keep these defaults unless port `3101`
is already used:

```env
DB_PATH=/app/data/cloudladder.db
APP_BIND_HOST=127.0.0.1
APP_HOST_PORT=3101
```

If port `3101` is occupied, change `APP_HOST_PORT` and update
`deploy/nginx-cloudladder.conf` to the same port.

If `.env` was previously committed to Git, remove it from Git tracking while
keeping the server file:

```bash
git rm --cached .env
```

## 4. Start the app

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f app
```

Verify locally on the server:

```bash
curl http://127.0.0.1:3101/api/health
```

## 5. Configure Nginx

Check existing site configs before enabling this file:

```bash
sudo nginx -T | grep -E "server_name|listen"
```

If no other Nginx server block is already using `server_name 124.220.103.120`,
install the config:

```bash
sudo cp deploy/nginx-cloudladder.conf /etc/nginx/sites-available/cloudladder.conf
sudo ln -s /etc/nginx/sites-available/cloudladder.conf /etc/nginx/sites-enabled/cloudladder.conf
sudo nginx -t
sudo systemctl reload nginx
```

Then open:

```text
http://124.220.103.120/
```

## Updating

```bash
cd /opt/cloudladder
git pull
docker compose up -d --build
docker image prune -f
```

## Rollback

```bash
cd /opt/cloudladder
git log --oneline -5
git checkout <previous-commit>
docker compose up -d --build
```

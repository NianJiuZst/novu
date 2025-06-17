# Dockerfile for Novu Development Environment - Ultra-optimized for Cursor AI Agent
# This creates the smallest possible image while maintaining full Novu development capability
# Usage: docker build -t novu-cursor . && docker run -it --name novu-cursor -p 3000:3000 -p 4000:4000 -p 27017:27017 -p 6379:6379 novu-cursor

# Use Alpine for much smaller base image
FROM node:20-alpine3.19 AS builder

# Install minimal build dependencies for native modules
RUN apk add --no-cache \
    g++ \
    make \
    python3 \
    py3-pip \
    git \
    curl

# Install pnpm and essential Node.js tools
RUN npm --no-update-notifier --no-fund --global install \
    pnpm@10.11.0 \
    typescript@5.6.2 \
    && npm cache clean --force

# === RUNTIME STAGE ===
FROM node:20-alpine3.19 AS runtime

# Install runtime dependencies (including GNU coreutils for Cursor compatibility)
RUN apk add --no-cache \
    git \
    curl \
    wget \
    bash \
    supervisor \
    redis \
    gnupg \
    coreutils \
    # Build tools needed for native modules
    g++ \
    make \
    python3 \
    py3-pip \
    && rm -rf /var/cache/apk/*

# Install MongoDB - use a working approach for both x86_64 and ARM64
RUN set -eux; \
    ARCH="$(apk --print-arch)"; \
    case "$ARCH" in \
        x86_64) MONGODB_ARCH='x86_64' ;; \
        aarch64) MONGODB_ARCH='aarch64' ;; \
        *) echo "Unsupported architecture: $ARCH" && exit 1 ;; \
    esac; \
    MONGODB_VERSION='7.0.14'; \
    wget -O mongodb.tgz "https://fastdl.mongodb.org/linux/mongodb-linux-${MONGODB_ARCH}-ubuntu2204-${MONGODB_VERSION}.tgz"; \
    tar -xzf mongodb.tgz; \
    mv mongodb-linux-*-${MONGODB_VERSION}/bin/* /usr/local/bin/; \
    rm -rf mongodb.tgz mongodb-linux-*-${MONGODB_VERSION}; \
    adduser -D -s /bin/false mongodb

# Install pnpm and TypeScript directly in runtime stage
RUN npm --no-update-notifier --no-fund --global install \
    pnpm@10.11.0 \
    typescript@5.6.2 \
    && npm cache clean --force

# Set up optimized environment
ENV NX_DAEMON=false \
    NODE_ENV=local \
    PNPM_STORE_DIR="/tmp/.pnpm-store" \
    PNPM_CACHE_DIR="/tmp/.pnpm-cache" \
    NODE_OPTIONS="--max-old-space-size=4096"

# Create minimal directory structure
RUN mkdir -p \
    /var/log/supervisor \
    /etc/supervisor/conf.d \
    /data/db \
    /data/redis \
    /workspace \
    /tmp/.pnpm-store \
    && chown -R mongodb:mongodb /data/db \
    && chown -R redis:redis /data/redis

# Configure pnpm for speed and efficiency
RUN pnpm config set store-dir /tmp/.pnpm-store \
    && pnpm config set cache-dir /tmp/.pnpm-cache \
    && pnpm config set network-timeout 60000 \
    && pnpm config set fetch-retries 3

# Create ultra-lightweight supervisor config
RUN mkdir -p /etc/supervisor/conf.d \
    && printf '[supervisord]\n\
nodaemon=false\n\
silent=true\n\
logfile=/dev/null\n\
pidfile=/var/run/supervisord.pid\n\
\n\
[include]\n\
files = /etc/supervisor/conf.d/*.conf\n' > /etc/supervisor/supervisord.conf \
    && printf '[program:mongodb]\n\
command=mongod --dbpath /data/db --bind_ip_all --port 27017 --replSet rs0 --quiet\n\
user=mongodb\n\
autorestart=true\n\
redirect_stderr=true\n\
stdout_logfile=/dev/null\n\
\n\
[program:redis]\n\
command=redis-server --bind 0.0.0.0 --port 6379 --dir /data/redis --save "" --logfile ""\n\
user=redis\n\
autorestart=true\n\
redirect_stderr=true\n\
stdout_logfile=/dev/null\n' > /etc/supervisor/conf.d/services.conf

# Create optimized startup script
RUN printf '#!/bin/bash\n\
set -e\n\
echo "🚀 Novu Cursor Environment"\n\
supervisord -c /etc/supervisor/supervisord.conf\n\
timeout=15\n\
while ! mongosh --eval "db.runCommand('\''ping'\'')" >/dev/null 2>&1 && [ $timeout -gt 0 ]; do\n\
    sleep 1; timeout=$((timeout-1))\n\
done\n\
[ $timeout -gt 0 ] && mongosh --eval "try { rs.initiate() } catch(e) {}" >/dev/null 2>&1 || true\n\
timeout=10\n\
while ! redis-cli ping >/dev/null 2>&1 && [ $timeout -gt 0 ]; do\n\
    sleep 1; timeout=$((timeout-1))\n\
done\n\
echo "✅ MongoDB & Redis ready!"\n\
echo "🚀 Quick start: git clone https://github.com/novuhq/novu.git /workspace/novu"\n\
exec /bin/bash\n' > /usr/local/bin/start-dev.sh \
    && chmod +x /usr/local/bin/start-dev.sh

# Keep workspace as working directory
WORKDIR /workspace

# Expose all necessary ports
EXPOSE 3000 4000 27017 6379

# Labels
LABEL version="cursor-1.3.0" \
      description="Complete Novu environment for Cursor AI with MongoDB & Redis"

# Health check for both services
HEALTHCHECK --interval=60s --timeout=5s --start-period=30s --retries=2 \
    CMD mongosh --eval "db.runCommand('ping')" >/dev/null 2>&1 && redis-cli ping >/dev/null 2>&1 || exit 1

ENTRYPOINT ["/usr/local/bin/start-dev.sh"]

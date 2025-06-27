# Dockerfile for Novu Development Environment - Optimized for Cursor AI Agent
# Ubuntu-based for full Cursor compatibility while maintaining significant optimizations
# Usage: docker build -t novu-cursor . && docker run -it --name novu-cursor -p 3000:3000 -p 4000:4000 -p 27017:27017 -p 6379:6379 novu-cursor

FROM ubuntu:22.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install essential dependencies and MongoDB/Redis in a single layer
RUN apt-get update && apt-get install -y \
    # Essential tools
    curl \
    wget \
    git \
    bash \
    ca-certificates \
    gnupg \
    lsb-release \
    sudo \
    # Build tools for native modules
    build-essential \
    python3 \
    python3-pip \
    # Process management
    supervisor \
    # Clean up immediately
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Install Node.js 20 using NodeSource repository (faster than using Node image)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install MongoDB and Redis from official repositories
RUN wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add - \
    && echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list \
    && apt-get update \
    && apt-get install -y \
        mongodb-org \
        redis-server \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Install pnpm and TypeScript globally
RUN npm --no-update-notifier --no-fund --global install \
    pnpm@10.11.0 \
    typescript@5.6.2 \
    && npm cache clean --force

# Create system directories first (as root)
RUN mkdir -p \
    /var/log/supervisor \
    /etc/supervisor/conf.d \
    /data/db \
    /data/redis \
    /workspace \
    /tmp/.pnpm-store \
    && chown mongodb:mongodb /data/db \
    && chown redis:redis /data/redis \
    && chmod 755 /data/db /data/redis

# Create non-root user as recommended for background agents
RUN useradd -m -s /bin/bash ubuntu \
    && echo "ubuntu ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers \
    && mkdir -p /home/ubuntu/.pnpm-store /home/ubuntu/.pnpm-cache \
    && chown -R ubuntu:ubuntu /home/ubuntu /workspace

# Switch to non-root user
USER ubuntu

# Set working directory to home directory as recommended
WORKDIR /home/ubuntu

# Set up optimized environment variables
ENV NX_DAEMON=false \
    NODE_ENV=local \
    PNPM_STORE_DIR="/home/ubuntu/.pnpm-store" \
    PNPM_CACHE_DIR="/home/ubuntu/.pnpm-cache"

# Switch back to root temporarily for system configuration
USER root

# Create optimized supervisor configuration
RUN printf '[supervisord]\n\
nodaemon=false\n\
silent=false\n\
logfile=/var/log/supervisor/supervisord.log\n\
logfile_maxbytes=10MB\n\
logfile_backups=2\n\
loglevel=info\n\
pidfile=/var/run/supervisord.pid\n\
childlogdir=/var/log/supervisor\n\
\n\
[unix_http_server]\n\
file=/var/run/supervisor.sock\n\
chmod=0700\n\
\n\
[supervisorctl]\n\
serverurl=unix:///var/run/supervisor.sock\n\
\n\
[rpcinterface:supervisor]\n\
supervisor.rpcinterface_factory = supervisor.rpcinterface:make_main_rpcinterface\n\
\n\
[include]\n\
files = /etc/supervisor/conf.d/*.conf\n' > /etc/supervisor/supervisord.conf \
    && printf '[program:mongodb]\n\
command=mongod --dbpath /data/db --bind_ip_all --port 27017 --replSet rs0 --logpath /var/log/mongodb.log\n\
user=mongodb\n\
autostart=true\n\
autorestart=true\n\
startretries=3\n\
redirect_stderr=true\n\
stdout_logfile=/var/log/supervisor/mongodb.log\n\
stderr_logfile=/var/log/supervisor/mongodb_err.log\n\
\n\
[program:redis]\n\
command=redis-server --bind 0.0.0.0 --port 6379 --dir /data/redis --save "" --logfile /var/log/redis.log\n\
user=redis\n\
autostart=true\n\
autorestart=true\n\
startretries=3\n\
redirect_stderr=true\n\
stdout_logfile=/var/log/supervisor/redis.log\n\
stderr_logfile=/var/log/supervisor/redis_err.log\n' > /etc/supervisor/conf.d/services.conf

# Create optimized startup script using cat with heredoc to avoid printf escaping issues
RUN cat > /usr/local/bin/start-dev.sh << 'EOF'
#!/bin/bash
set -e
echo "🚀 Novu Cursor Environment"

# Start supervisor in background
sudo supervisord -c /etc/supervisor/supervisord.conf
sleep 2

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB..."
timeout=30
while ! mongosh --quiet --eval "db.runCommand('ping')" >/dev/null 2>&1 && [ $timeout -gt 0 ]; do
    sleep 1; timeout=$((timeout-1))
    if [ $((timeout % 5)) -eq 0 ]; then
        echo "   Still waiting for MongoDB... ($timeout seconds left)"
    fi
done

if [ $timeout -gt 0 ]; then
    echo "✅ MongoDB is ready!"
    # Initialize replica set if needed
    mongosh --quiet --eval "try { rs.initiate() } catch(e) { if (e.code !== 23) throw e }" >/dev/null 2>&1 || true
else
    echo "❌ MongoDB failed to start"
fi

# Wait for Redis to be ready
echo "⏳ Waiting for Redis..."
timeout=15
while ! redis-cli ping >/dev/null 2>&1 && [ $timeout -gt 0 ]; do
    sleep 1; timeout=$((timeout-1))
done

if [ $timeout -gt 0 ]; then
    echo "✅ Redis is ready!"
else
    echo "❌ Redis failed to start"
fi

# Show service status
echo "📊 Service Status:"
sudo supervisorctl status

echo "🚀 Environment ready for development!"
echo "📁 Workspace: /workspace"
echo "🔗 MongoDB: localhost:27017"
echo "🔗 Redis: localhost:6379"

# Keep container running and start bash
exec /bin/bash
EOF

# Make the script executable
RUN chmod +x /usr/local/bin/start-dev.sh

# Switch back to ubuntu user
USER ubuntu

# Configure pnpm for speed and efficiency
RUN pnpm config set store-dir /home/ubuntu/.pnpm-store \
    && pnpm config set cache-dir /home/ubuntu/.pnpm-cache \
    && pnpm config set network-timeout 60000 \
    && pnpm config set fetch-retries 3

# Set workspace as working directory
WORKDIR /workspace

# Expose all necessary ports
EXPOSE 3000 4000 27017 6379

# Labels for identification
LABEL version="cursor-background-agent-1.0.0" \
      description="Novu development environment optimized for Cursor background agents"

# Health check for both services
HEALTHCHECK --interval=60s --timeout=5s --start-period=30s --retries=2 \
    CMD mongosh --eval "db.runCommand('ping')" >/dev/null 2>&1 && redis-cli ping >/dev/null 2>&1 || exit 1

ENTRYPOINT ["/usr/local/bin/start-dev.sh"]

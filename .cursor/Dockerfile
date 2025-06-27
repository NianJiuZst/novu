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

# Create optimized startup script using echo to avoid escaping issues
RUN echo '#!/bin/bash' > /usr/local/bin/start-dev.sh && \
    echo 'set -e' >> /usr/local/bin/start-dev.sh && \
    echo 'echo "🚀 Novu Cursor Environment"' >> /usr/local/bin/start-dev.sh && \
    echo '' >> /usr/local/bin/start-dev.sh && \
    echo '# Start supervisor in background' >> /usr/local/bin/start-dev.sh && \
    echo 'sudo supervisord -c /etc/supervisor/supervisord.conf' >> /usr/local/bin/start-dev.sh && \
    echo 'sleep 2' >> /usr/local/bin/start-dev.sh && \
    echo '' >> /usr/local/bin/start-dev.sh && \
    echo '# Wait for MongoDB to be ready' >> /usr/local/bin/start-dev.sh && \
    echo 'echo "⏳ Waiting for MongoDB..."' >> /usr/local/bin/start-dev.sh && \
    echo 'timeout=30' >> /usr/local/bin/start-dev.sh && \
    echo 'while ! mongosh --quiet --eval "db.runCommand('"'"'ping'"'"')" >/dev/null 2>&1 && [ $timeout -gt 0 ]; do' >> /usr/local/bin/start-dev.sh && \
    echo '    sleep 1; timeout=$((timeout-1))' >> /usr/local/bin/start-dev.sh && \
    echo '    remainder=$((timeout % 5))' >> /usr/local/bin/start-dev.sh && \
    echo '    if [ $remainder -eq 0 ]; then' >> /usr/local/bin/start-dev.sh && \
    echo '        echo "   Still waiting for MongoDB... ($timeout seconds left)"' >> /usr/local/bin/start-dev.sh && \
    echo '    fi' >> /usr/local/bin/start-dev.sh && \
    echo 'done' >> /usr/local/bin/start-dev.sh && \
    echo '' >> /usr/local/bin/start-dev.sh && \
    echo 'if [ $timeout -gt 0 ]; then' >> /usr/local/bin/start-dev.sh && \
    echo '    echo "✅ MongoDB is ready!"' >> /usr/local/bin/start-dev.sh && \
    echo '    mongosh --quiet --eval "try { rs.initiate() } catch(e) { if (e.code !== 23) throw e }" >/dev/null 2>&1 || true' >> /usr/local/bin/start-dev.sh && \
    echo 'else' >> /usr/local/bin/start-dev.sh && \
    echo '    echo "❌ MongoDB failed to start"' >> /usr/local/bin/start-dev.sh && \
    echo 'fi' >> /usr/local/bin/start-dev.sh && \
    echo '' >> /usr/local/bin/start-dev.sh && \
    echo '# Wait for Redis to be ready' >> /usr/local/bin/start-dev.sh && \
    echo 'echo "⏳ Waiting for Redis..."' >> /usr/local/bin/start-dev.sh && \
    echo 'timeout=15' >> /usr/local/bin/start-dev.sh && \
    echo 'while ! redis-cli ping >/dev/null 2>&1 && [ $timeout -gt 0 ]; do' >> /usr/local/bin/start-dev.sh && \
    echo '    sleep 1; timeout=$((timeout-1))' >> /usr/local/bin/start-dev.sh && \
    echo 'done' >> /usr/local/bin/start-dev.sh && \
    echo '' >> /usr/local/bin/start-dev.sh && \
    echo 'if [ $timeout -gt 0 ]; then' >> /usr/local/bin/start-dev.sh && \
    echo '    echo "✅ Redis is ready!"' >> /usr/local/bin/start-dev.sh && \
    echo 'else' >> /usr/local/bin/start-dev.sh && \
    echo '    echo "❌ Redis failed to start"' >> /usr/local/bin/start-dev.sh && \
    echo 'fi' >> /usr/local/bin/start-dev.sh && \
    echo '' >> /usr/local/bin/start-dev.sh && \
    echo '# Show service status' >> /usr/local/bin/start-dev.sh && \
    echo 'echo "📊 Service Status:"' >> /usr/local/bin/start-dev.sh && \
    echo 'sudo supervisorctl status' >> /usr/local/bin/start-dev.sh && \
    echo '' >> /usr/local/bin/start-dev.sh && \
    echo 'echo "🚀 Environment ready for development!"' >> /usr/local/bin/start-dev.sh && \
    echo 'echo "📁 Workspace: /workspace"' >> /usr/local/bin/start-dev.sh && \
    echo 'echo "🔗 MongoDB: localhost:27017"' >> /usr/local/bin/start-dev.sh && \
    echo 'echo "🔗 Redis: localhost:6379"' >> /usr/local/bin/start-dev.sh && \
    echo '' >> /usr/local/bin/start-dev.sh && \
    echo '# Keep container running and start bash' >> /usr/local/bin/start-dev.sh && \
    echo 'exec /bin/bash' >> /usr/local/bin/start-dev.sh && \
    chmod +x /usr/local/bin/start-dev.sh

# Switch back to ubuntu user
USER ubuntu

# Configure pnpm for speed and efficiency
RUN pnpm config set store-dir /home/ubuntu/.pnpm-store \
    && pnpm config set cache-dir /home/ubuntu/.pnpm-cache \
    && pnpm config set network-timeout 60000 \
    && pnpm config set fetch-retries 3

# Add MongoDB and Redis binaries to PATH and create helpful aliases
RUN echo 'export PATH="/usr/bin:$PATH"' >> /home/ubuntu/.bashrc \
    && echo 'alias redis="redis-cli"' >> /home/ubuntu/.bashrc \
    && echo 'alias mongodb="mongosh"' >> /home/ubuntu/.bashrc \
    && echo 'alias mongo="mongosh"' >> /home/ubuntu/.bashrc \
    && echo 'alias check-services="check-services.sh"' >> /home/ubuntu/.bashrc \
    && echo 'echo "🚀 Novu Development Environment"' >> /home/ubuntu/.bashrc \
    && echo 'echo "📊 Service Status: sudo supervisorctl status"' >> /home/ubuntu/.bashrc \
    && echo 'echo "🔗 MongoDB: mongosh (or just: mongo)"' >> /home/ubuntu/.bashrc \
    && echo 'echo "🔗 Redis: redis-cli (or just: redis)"' >> /home/ubuntu/.bashrc \
    && echo 'echo "🔍 Check Services: check-services"' >> /home/ubuntu/.bashrc \
    && echo 'echo "📁 Workspace: /workspace"' >> /home/ubuntu/.bashrc

# Switch back to root to create service check script
USER root

# Create a service status check script
RUN echo '#!/bin/bash' > /usr/local/bin/check-services.sh \
    && echo 'echo "🔍 Checking Novu Development Services..."' >> /usr/local/bin/check-services.sh \
    && echo 'echo ""' >> /usr/local/bin/check-services.sh \
    && echo 'echo "📊 Supervisor Status:"' >> /usr/local/bin/check-services.sh \
    && echo 'sudo supervisorctl status' >> /usr/local/bin/check-services.sh \
    && echo 'echo ""' >> /usr/local/bin/check-services.sh \
    && echo 'echo "🍃 MongoDB Connection Test:"' >> /usr/local/bin/check-services.sh \
    && echo 'if mongosh --quiet --eval "db.runCommand({ping: 1})" >/dev/null 2>&1; then' >> /usr/local/bin/check-services.sh \
    && echo '    echo "✅ MongoDB is running and accessible"' >> /usr/local/bin/check-services.sh \
    && echo '    echo "   Connection: mongosh mongodb://localhost:27017"' >> /usr/local/bin/check-services.sh \
    && echo 'else' >> /usr/local/bin/check-services.sh \
    && echo '    echo "❌ MongoDB connection failed"' >> /usr/local/bin/check-services.sh \
    && echo '    echo "   Try: sudo supervisorctl restart mongodb"' >> /usr/local/bin/check-services.sh \
    && echo 'fi' >> /usr/local/bin/check-services.sh \
    && echo 'echo ""' >> /usr/local/bin/check-services.sh \
    && echo 'echo "🔴 Redis Connection Test:"' >> /usr/local/bin/check-services.sh \
    && echo 'if redis-cli ping >/dev/null 2>&1; then' >> /usr/local/bin/check-services.sh \
    && echo '    echo "✅ Redis is running and accessible"' >> /usr/local/bin/check-services.sh \
    && echo '    echo "   Connection: redis-cli -h localhost -p 6379"' >> /usr/local/bin/check-services.sh \
    && echo 'else' >> /usr/local/bin/check-services.sh \
    && echo '    echo "❌ Redis connection failed"' >> /usr/local/bin/check-services.sh \
    && echo '    echo "   Try: sudo supervisorctl restart redis"' >> /usr/local/bin/check-services.sh \
    && echo 'fi' >> /usr/local/bin/check-services.sh \
    && echo 'echo ""' >> /usr/local/bin/check-services.sh \
    && echo 'echo "💡 Usage Commands:"' >> /usr/local/bin/check-services.sh \
    && echo 'echo "  MongoDB: mongosh (or mongo)"' >> /usr/local/bin/check-services.sh \
    && echo 'echo "  Redis: redis-cli (or redis)"' >> /usr/local/bin/check-services.sh \
    && echo 'echo "  Services: sudo supervisorctl status|start|stop|restart <service>"' >> /usr/local/bin/check-services.sh \
    && echo 'echo "  Logs: sudo tail -f /var/log/supervisor/<service>.log"' >> /usr/local/bin/check-services.sh \
    && chmod +x /usr/local/bin/check-services.sh

# Switch back to ubuntu user
USER ubuntu

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

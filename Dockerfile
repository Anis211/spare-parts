# Use Debian-based image instead of Alpine
FROM node:18-slim

# 1. Install Python 3.11 (Debian version)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    # Scrapy dependencies
    gcc \
    python3-dev \
    libffi-dev \
    libssl-dev \
    libxml2-dev \
    libxslt-dev \
    # Playwright dependencies
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libatspi2.0-0 \
    libwayland-client0 \
    libpango-1.0-0 \
    libcairo2 \
    && rm -rf /var/lib/apt/lists/*

# 2. Create virtual environment
RUN python3 -m venv /python && \
    ln -sf /python/bin/python /usr/bin/python-venv && \
    ln -sf /python/bin/pip /usr/bin/pip-venv

ENV PATH="/python/bin:$PATH"

WORKDIR /carmax/src/

# 3. Copy requirements.txt FIRST for better caching
COPY requirements.txt ./

# 4. Install Python packages
RUN pip-venv install --no-cache-dir --upgrade pip && \
    pip-venv install --no-cache-dir -r requirements.txt

# 5. Install Node.js dependencies
COPY package.json package-lock.json ./
RUN npm install

# 6. Copy the rest of the application
COPY . .

# 7. Verify installations
RUN python-venv --version && \
    pip-venv --version && \
    npx playwright --version

# 8. Build Next.js
RUN npm run build

# Activate virtual environment for runtime
ENV VIRTUAL_ENV="/python"
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

EXPOSE 3000
ENV NEXT_TELEMETRY_DISABLED=1
CMD ["sh", "-c", "cp .env.local .env.production && npm start"]
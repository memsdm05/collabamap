# Use Node.js as base image for building frontend
FROM node:20-alpine AS frontend-builder

# # Install pnpm
# RUN npm install -g pnpm

# # Set working directory
# WORKDIR /app/frontend

# # Copy frontend package files
# COPY frontend/package.json frontend/pnpm-lock.yaml* ./

# # Install dependencies
# RUN pnpm install

# # Copy frontend source code
# COPY frontend/ ./

# # Build frontend
# RUN pnpm build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile
RUN pnpm run build

# Use Python as base image for backend
FROM python:3.12-slim AS server-builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY pyproject.toml ./
RUN pip install --no-cache-dir -e .

# Copy backend code
COPY app/ ./app/

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Command to run the application
CMD ["uvicorn", "app.server:app", "--host", "0.0.0.0", "--port", "8000"]
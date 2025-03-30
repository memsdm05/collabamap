FROM node:20-alpine AS frontend-builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY . /app

# This stage doesn't exist and causes an error
FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile
RUN pnpm run build

FROM python:3.12-slim AS server-builder
WORKDIR /app

# Install dependencies
COPY pyproject.toml ./
RUN pip install --no-cache-dir -e .

# Copy backend code
COPY app/ ./app/

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

CMD ["uvicorn", "app.server:app", "--host", "0.0.0.0", "--port", "8000"]
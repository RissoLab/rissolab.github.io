# Risso Lab homepage — static site.
#
# Build stage: runs the usual static export (npm run build:static), which
# leaves the final site in out/ (including sitemap/robots/llms + debrand).
# Runtime stage: plain nginx serving the static files — no Node process.
#
# To deploy to another domain, override the public URL:
#   --build-arg SITE_URL=https://your-domain.example

FROM node:24-alpine AS build
WORKDIR /app

# Some native modules (sharp) expect glibc shims on musl.
RUN apk add --no-cache libc6-compat

# Final public URL of the site (og:url, canonical links, sitemap).
ARG SITE_URL=https://rissolab.stat.unipd.it

# Install dependencies (this layer is cached while the lockfile is unchanged).
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Bake the deployment URL into config.json (same patch CI applies, see
# .github/workflows/deploy-new-gh-pages.yml).
ENV SITE_URL=$SITE_URL
RUN node -e '
  const fs = require("fs");
  const p = "src/config/config.json";
  const c = JSON.parse(fs.readFileSync(p, "utf8"));
  c.site.base_url = process.env.SITE_URL;
  fs.writeFileSync(p, JSON.stringify(c, null, 2) + "\n");
'

RUN npm run build:static

FROM nginx:stable-alpine
# Railway injects PORT at runtime; 3000 is the sensible local default.
ENV PORT=3000
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/out /usr/share/nginx/html

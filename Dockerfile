# Node 22 rather than the 20.11 the README names: 20 reached end of life in
# April 2026, and discord.js 14 runs on either.
FROM node:22-slim

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

# Where the emoji counts live. Kamal mounts a volume here; a new volume
# starts out owned like this directory, so the node user can write to it.
RUN mkdir -p /app/storage && chown node:node /app/storage

USER node

# Straight to node rather than `npm start`, which runs nodemon and a version
# check meant for a development machine.
# The warning is node:sqlite announcing itself as experimental on every start.
CMD ["node", "--disable-warning=ExperimentalWarning", "index.js"]

#
# ---- Base Node ----
FROM node:20-alpine AS base
ENV TZ="Europe/Moscow"
WORKDIR /app

#
# ---- Dependencies ----
FROM base AS build

COPY . .
RUN npm ci && \
    npm run build && \
    npm prune --production
# RUN npm run test

#
# ---- Release ----
FROM base AS release

# copy work dirs
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
#COPY --from=build /app/migrations ./migrations


# copy work files
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/nest-cli.json ./nest-cli.json
#COPY --from=build /app/migrate-mongo-config.js ./migrate-mongo-config.js

EXPOSE 9000
# Build a shell script because the ENTRYPOINT command doesn't like using ENV
RUN printf "#!/bin/bash\nnode /app/dist/main.js\n" > ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
#
ENTRYPOINT ["sh","./entrypoint.sh"]

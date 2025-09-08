### Build stage
FROM node:18-alpine AS build
WORKDIR /app

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

### Runtime stage with Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Custom Nginx config to serve SPA, static/media and proxy API
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Mount points for shared static/media
VOLUME ["/static", "/media"]

EXPOSE 80


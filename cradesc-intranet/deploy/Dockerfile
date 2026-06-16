# Image statique : sert hosting/ via nginx. Le routage TLS/domaine est
# assuré par Traefik (voir docker-compose.yml).
FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY hosting/ /usr/share/nginx/html/
EXPOSE 80

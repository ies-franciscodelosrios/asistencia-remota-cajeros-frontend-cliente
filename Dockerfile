FROM nginx:1.23-alpine
 
COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./dist/proyecto-video-call2 /usr/share/nginx/html
COPY cajero.cer /etc/ssl/certs/
COPY cajero.key /etc/ssl/private/

EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
FROM nginx:1.23-alpine
 
COPY ./CajeroCiudadano/nginx.conf /etc/nginx/nginx.conf
COPY ./dist/proyecto-video-call2 /usr/share/nginx/html
COPY ./CajeroCiudadano/cajero.cer /etc/ssl/certs/
COPY ./CajeroCiudadano/cajero.key /etc/ssl/private/
EXPOSE 443

CMD ["/bin/sh", "-c", "envsubst < /usr/share/nginx/html/assets/env.pre.js > /usr/share/nginx/html/assets/env.js && exec nginx -g 'daemon off;'"]
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static web application files
COPY . /usr/share/nginx/html

# Expose port 80 inside container
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

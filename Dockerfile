FROM php:8.2-cli

WORKDIR /app

# install dependency
RUN apt-get update && apt-get install -y \
    libpq-dev \
    unzip \
    git \
    curl \
    && docker-php-ext-install pdo pdo_pgsql

# install composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# copy project
COPY . .

# install laravel dependency
RUN composer install

EXPOSE 8000

CMD php artisan serve --host=0.0.0.0 --port=8000

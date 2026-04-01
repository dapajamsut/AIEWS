FROM php:8.2-cli

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev \
    unzip \
    git \
    curl \
    && docker-php-ext-install pdo pdo_pgsql

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# COPY composer dulu
COPY composer.json composer.lock ./

#  install dependency (ini bakal di-cache)
RUN composer install --no-dev --no-scripts --prefer-dist

#  baru copy semua project
COPY . .

# env + key
RUN cp .env.example .env && php artisan key:generate

EXPOSE 8000

CMD php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8000
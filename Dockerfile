FROM php:8.2-cli

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev \
    unzip \
    git \
    curl \
    && docker-php-ext-install pdo pdo_pgsql

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# install dependency dulu (biar cache optimal)
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --prefer-dist

# copy semua file project (TANPA .env ideally)
COPY . .

EXPOSE 8000

CMD php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8000

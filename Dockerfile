FROM php:8.2-cli

# Install dependencies yang dibutuhkan Laravel & PostgreSQL & MQTT
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql

# Install Composer
COPY --from=composer:2.6 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy seluruh file backend
COPY . .

# Install PHP dependencies
RUN composer install --no-interaction --optimize-autoloader

# Expose port yang dipakai Laravel
EXPOSE 8002

# Jalankan server bawaan artisan (untuk development AWS)
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8002"]

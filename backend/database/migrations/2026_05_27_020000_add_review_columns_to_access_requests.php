<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('access_requests', function (Blueprint $table) {
            $table->timestamp('reviewed_at')->nullable()->after('note');
            $table->string('rejection_reason', 500)->nullable()->after('reviewed_at');
            $table->string('approved_email', 150)->nullable()->after('rejection_reason');
        });
    }

    public function down(): void
    {
        Schema::table('access_requests', function (Blueprint $table) {
            $table->dropColumn(['reviewed_at', 'rejection_reason', 'approved_email']);
        });
    }
};

# PowerShell script to run Laravel scheduler every minute
# Save this as scheduler.ps1 and run it in background

while ($true) {
    # Change to Laravel project directory
    Set-Location "c:\laragon\www\Proyek Kekhususan TMJ\makesens-laravel"

    # Run the scheduler
    php artisan schedule:run

    # Wait for 60 seconds
    Start-Sleep -Seconds 60
}
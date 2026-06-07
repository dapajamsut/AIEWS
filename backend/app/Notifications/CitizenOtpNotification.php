<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CitizenOtpNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $otp,
        public string $purpose = 'register'
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $isReset = $this->purpose === 'reset';

        $subject = $isReset
            ? 'Kode OTP Reset Password MakeSens'
            : 'Kode OTP Pendaftaran MakeSens';

        $intro = $isReset
            ? 'Kami menerima permintaan reset password untuk akun MakeSens Anda. Gunakan kode OTP di bawah untuk melanjutkan.'
            : 'Terima kasih telah mendaftar di MakeSens. Gunakan kode OTP di bawah untuk menyelesaikan pendaftaran Anda.';

        return (new MailMessage)
            ->subject($subject)
            ->view('emails.citizen-otp', [
                'otp' => $this->otp,
                'purpose' => $this->purpose,
                'subject' => $subject,
                'intro' => $intro,
            ]);
    }
}

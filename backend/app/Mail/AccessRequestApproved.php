<?php

namespace App\Mail;

use App\Models\AccessRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AccessRequestApproved extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public AccessRequest $request,
        public string $loginEmail,
        public string $plainPassword,
    ) {}

    public function envelope(): Envelope
    {
        $replyTo = env('ACCESS_ADMIN_EMAIL') ?: env('MAIL_FROM_ADDRESS');

        return new Envelope(
            subject: 'Permohonan Akses Disetujui — MakeSens Early Warning System',
            replyTo: $replyTo ? [new Address($replyTo, 'MakeSens Admin')] : [],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.access-approved',
            text: 'emails.access-approved-text',
            with: [
                'data'           => $this->request,
                'loginEmail'     => $this->loginEmail,
                'plainPassword'  => $this->plainPassword,
                'loginUrl'       => rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/') . '/login',
            ],
        );
    }
}

<?php

namespace App\Mail;

use App\Models\AccessRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AccessRequestRejected extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public AccessRequest $request,
        public string $reason,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Permohonan Akses Tidak Disetujui — MakeSens Early Warning System',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.access-rejected',
            with: [
                'data'   => $this->request,
                'reason' => $this->reason,
            ],
        );
    }
}

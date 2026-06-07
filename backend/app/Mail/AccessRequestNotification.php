<?php

namespace App\Mail;

use App\Models\AccessRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AccessRequestNotification extends Mailable
{
    use Queueable, SerializesModels;

    public AccessRequest $request;
    public string $absoluteLetterPath;

    public function __construct(AccessRequest $request, string $absoluteLetterPath)
    {
        $this->request = $request;
        $this->absoluteLetterPath = $absoluteLetterPath;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Permohonan Akses MakeSens — '
                . $this->request->name
                . ' (' . $this->request->instansi . ')',
            replyTo: [
                new Address($this->request->email, $this->request->name),
            ],
        );
    }

    public function content(): Content
    {
        // Signed URL ke halaman web review — admin klik dari email,
        // halaman buka dengan form Setujui (dengan input email+password)
        // atau Tolak (dengan input alasan). Email ke applicant didesain
        // di server-side dengan Blade.
        $reviewUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'admin.access.show',
            now()->addDays(14),
            ['id' => $this->request->id]
        );

        return new Content(
            view: 'emails.access-request',
            with: [
                'data' => $this->request,
                'submissionDate' => $this->request->created_at
                    ->setTimezone('Asia/Jakarta')
                    ->translatedFormat('l, j F Y H:i'),
                'reviewUrl' => $reviewUrl,
            ],
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        if (!$this->absoluteLetterPath || !file_exists($this->absoluteLetterPath)) {
            return [];
        }

        return [
            Attachment::fromPath($this->absoluteLetterPath)
                ->as($this->request->letter_original_name ?: 'surat-permohonan')
                ->withMime($this->request->letter_mime ?: 'application/octet-stream'),
        ];
    }
}

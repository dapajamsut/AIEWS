<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject }}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:32px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06);">
                    <tr>
                        <td style="background:linear-gradient(135deg,#2563eb 0%,#1e40af 100%);padding:32px 24px;text-align:center;">
                            <h1 style="margin:0;color:#ffffff;font-size:28px;letter-spacing:1px;">MakeSens</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px 32px 8px 32px;">
                            <h2 style="margin:0 0 16px 0;font-size:20px;color:#111827;">{{ $subject }}</h2>
                            <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#374151;">
                                {{ $intro }}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:0 32px;">
                            <div style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:24px;text-align:center;">
                                <p style="margin:0 0 8px 0;font-size:13px;color:#1e40af;text-transform:uppercase;letter-spacing:2px;">Kode OTP Anda</p>
                                <p style="margin:0;font-size:36px;font-weight:bold;letter-spacing:8px;color:#1e3a8a;font-family:'Courier New',monospace;">
                                    {{ $otp }}
                                </p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:24px 32px;">
                            <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#374151;">
                                Kode ini berlaku selama <strong>10 menit</strong>. Jangan bagikan kode ini kepada siapa pun.
                            </p>
                            <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">
                                Jika Anda tidak meminta kode ini, abaikan email ini dan akun Anda tetap aman.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
                            <p style="margin:0;font-size:12px;color:#9ca3af;">
                                &copy; {{ date('Y') }} MakeSens.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

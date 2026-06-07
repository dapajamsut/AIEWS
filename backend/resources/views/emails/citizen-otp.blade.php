<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject }}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 20px;">
        <tr>
            <td align="center">
                <!-- Card Container -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
                    
                    <!-- Decorative Top Border (Blue-to-Cyan Gradient Accent) -->
                    <tr>
                        <td height="6" style="background: linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%);"></td>
                    </tr>

                    <!-- Content Body -->
                    <tr>
                        <td style="padding: 40px 32px; text-align: center;">
                            <!-- App Brand Header -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                                <tr>
                                    <td align="center">
                                        <div style="display: inline-flex; align-items: center; justify-content: center; background-color: #eff6ff; border-radius: 12px; padding: 8px 16px; border: 1px solid #dbeafe;">
                                            <span style="font-size: 20px; font-weight: 800; color: #1e40af; letter-spacing: 0.5px; font-family: sans-serif;">🌊 MakeSens</span>
                                            <span style="font-size: 11px; font-weight: 600; color: #0369a1; background-color: #e0f2fe; border-radius: 6px; padding: 2px 6px; margin-left: 8px; font-family: sans-serif; letter-spacing: 0.2px;">AIEWS</span>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <!-- Subject Header -->
                            <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; line-height: 1.3;">
                                {{ $subject }}
                            </h1>

                            <!-- Intro Text -->
                            <p style="font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 32px 0; font-family: inherit;">
                                {{ $intro }}
                            </p>

                            <!-- OTP Box -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
                                <tr>
                                    <td align="center">
                                        <div style="background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; display: inline-block; min-width: 220px; box-sizing: border-box;">
                                            <span style="font-family: 'Courier New', Courier, monospace, sans-serif; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e293b; display: block; line-height: 1; text-align: center; margin-left: 8px;">{{ $otp }}</span>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <!-- Expiry Note -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #f1f5f9; padding-top: 24px; margin-bottom: 8px;">
                                <tr>
                                    <td align="center">
                                        <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin: 0; max-width: 380px;">
                                            Kode OTP ini hanya berlaku selama <strong>10 menit</strong>. Demi keamanan, jangan berikan atau sebarkan kode ini kepada siapa pun.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                            <p style="font-size: 11px; line-height: 1.4; color: #94a3b8; margin: 0 0 8px 0;">
                                Email ini dikirim secara otomatis oleh sistem MakeSens Early Warning System.
                            </p>
                            <p style="font-size: 11px; line-height: 1.4; color: #94a3b8; margin: 0;">
                                &copy; 2026 MakeSens AIEWS. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

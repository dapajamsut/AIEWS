<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Permohonan Akses Disetujui</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fb;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(15,23,42,.08);">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#065f46 0%,#10b981 50%,#059669 100%);padding:40px 32px;text-align:center;color:#ffffff;">
<div style="display:inline-block;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);border-radius:18px;padding:10px 18px;margin-bottom:14px;font-size:42px;line-height:1;">
💧
</div>
<div style="font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#d1fae5;font-weight:700;margin-bottom:6px;">MakeSens</div>
<div style="font-size:22px;font-weight:800;letter-spacing:.5px;">Early Warning System</div>
</td></tr>

<!-- Status banner -->
<tr><td style="padding:20px 32px 0;">
<div style="background:#dcfce7;border:1px solid #bbf7d0;border-radius:12px;padding:14px 16px;font-size:13px;color:#065f46;line-height:1.5;">
<span style="font-size:18px;line-height:1;margin-right:8px;">✅</span>
<strong>Permohonan akses Anda telah disetujui.</strong>
</div>
</td></tr>

<!-- Greeting -->
<tr><td style="padding:24px 32px 0;">
<h2 style="margin:0 0 6px;font-size:18px;font-weight:700;color:#0f172a;">Halo, {{ $data->name }}</h2>
<p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
Selamat! Akses Anda untuk masuk ke sistem <strong>MakeSens Early Warning System</strong>
telah dibuka oleh tim administrator. Berikut detail kredensial login Anda:
</p>
</td></tr>

<!-- Credentials Box -->
<tr><td style="padding:18px 32px 0;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;font-size:14px;">
<tr>
<td style="padding:14px 16px;background:#f8fafc;color:#475569;font-weight:600;width:36%;border-bottom:1px solid #e2e8f0;">Email Login</td>
<td style="padding:14px 16px;background:#f8fafc;color:#0f172a;font-family:Menlo,Consolas,monospace;font-weight:700;border-bottom:1px solid #e2e8f0;letter-spacing:.3px;">{{ $loginEmail }}</td>
</tr>
<tr>
<td style="padding:14px 16px;background:#ffffff;color:#475569;font-weight:600;">Password</td>
<td style="padding:14px 16px;background:#ffffff;color:#059669;font-family:Menlo,Consolas,monospace;font-weight:700;letter-spacing:.5px;font-size:15px;">{{ $plainPassword }}</td>
</tr>
</table>
</td></tr>

<!-- Login button -->
<tr><td style="padding:22px 32px 0;text-align:center;">
<a href="{{ $loginUrl }}"
   style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#1e3a8a);color:#ffffff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:.3px;box-shadow:0 4px 12px rgba(29,78,216,.3);">
   Login ke Dashboard →
</a>
</td></tr>

<!-- Security warning -->
<tr><td style="padding:24px 32px 0;">
<div style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:16px 18px;font-size:13px;color:#92400e;line-height:1.6;">
<strong style="display:block;margin-bottom:6px;color:#78350f;font-size:14px;">⚠️ Jaga Kerahasiaan Kredensial</strong>
Password ini bersifat rahasia dan menjadi tanggung jawab pribadi Anda.
<strong>Jangan bagikan kepada siapapun</strong>, termasuk sesama rekan kerja.
Setiap aktivitas yang dilakukan menggunakan akun ini menjadi tanggung jawab Anda sebagai pemegang akun.
</div>
</td></tr>

<!-- Footer -->
<tr><td style="padding:32px;text-align:center;border-top:1px solid #e2e8f0;margin-top:24px;">
<p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
Email ini dikirim otomatis oleh sistem MakeSens Early Warning System.<br>
Bila ada pertanyaan, silakan balas email ini secara langsung.
</p>
<p style="margin:14px 0 0;font-size:12px;color:#cbd5e1;">PBL Semester 6 — TMJ 6A</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>

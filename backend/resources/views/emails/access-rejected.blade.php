<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Permohonan Akses Tidak Disetujui</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fb;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(15,23,42,.08);">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#7f1d1d 0%,#dc2626 50%,#991b1b 100%);padding:40px 32px;text-align:center;color:#ffffff;">
<div style="display:inline-block;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);border-radius:18px;padding:10px 18px;margin-bottom:14px;font-size:42px;line-height:1;">
💧
</div>
<div style="font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#fecaca;font-weight:700;margin-bottom:6px;">MakeSens</div>
<div style="font-size:22px;font-weight:800;letter-spacing:.5px;">Early Warning System</div>
</td></tr>

<!-- Status banner -->
<tr><td style="padding:20px 32px 0;">
<div style="background:#fee2e2;border:1px solid #fecaca;border-radius:12px;padding:14px 16px;font-size:13px;color:#991b1b;line-height:1.5;">
<span style="font-size:18px;line-height:1;margin-right:8px;">⚠️</span>
<strong>Permohonan akses Anda tidak dapat kami setujui saat ini.</strong>
</div>
</td></tr>

<!-- Greeting -->
<tr><td style="padding:24px 32px 0;">
<h2 style="margin:0 0 6px;font-size:18px;font-weight:700;color:#0f172a;">Halo, {{ $data->name }}</h2>
<p style="margin:0 0 6px;color:#64748b;font-size:13px;line-height:1.6;">
Mohon maaf, permohonan akses Anda untuk <strong>MakeSens Early Warning System</strong>
belum dapat kami setujui pada kesempatan ini.
</p>
</td></tr>

<!-- Reason Box -->
<tr><td style="padding:18px 32px 0;">
<div style="background:#fff7ed;border:1px solid #fed7aa;border-left:4px solid #dc2626;border-radius:12px;padding:18px 20px;">
<div style="font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">Alasan Penolakan</div>
<div style="font-size:14px;color:#7c2d12;line-height:1.7;">
{!! nl2br(e($reason)) !!}
</div>
</div>
</td></tr>

<!-- Next steps -->
<tr><td style="padding:24px 32px 0;">
<div style="background:#f1f5f9;border-radius:12px;padding:16px 18px;font-size:13px;color:#334155;line-height:1.6;">
<strong style="display:block;margin-bottom:6px;color:#0f172a;font-size:14px;">Langkah Selanjutnya</strong>
Bila Anda merasa keputusan ini perlu ditinjau ulang atau ada dokumen tambahan
yang ingin dikirimkan, silakan <strong>balas email ini secara langsung</strong>
atau ajukan permohonan ulang dengan data yang lebih lengkap melalui halaman pendaftaran.
</div>
</td></tr>

<!-- Footer -->
<tr><td style="padding:32px;text-align:center;border-top:1px solid #e2e8f0;margin-top:24px;">
<p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
Email ini dikirim otomatis oleh sistem MakeSens Early Warning System.<br>
Untuk klarifikasi atau banding, silakan balas email ini.
</p>
<p style="margin:14px 0 0;font-size:12px;color:#cbd5e1;">PBL Semester 6 — TMJ 6A</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>

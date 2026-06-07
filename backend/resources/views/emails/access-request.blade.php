<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Permohonan Akses MakeSens</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fb;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(15,23,42,.08);">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 50%,#7f1d1d 100%);padding:40px 32px;text-align:center;color:#ffffff;">
<div style="display:inline-block;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);border-radius:18px;padding:10px 18px;margin-bottom:14px;font-size:42px;line-height:1;">
💧
</div>
<div style="font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#dbeafe;font-weight:700;margin-bottom:6px;">MakeSens</div>
<div style="font-size:22px;font-weight:800;letter-spacing:.5px;">Early Warning System</div>
</td></tr>

<!-- Alert -->
<tr><td style="padding:20px 32px 0;">
<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px 16px;font-size:13px;color:#9a3412;display:flex;align-items:flex-start;">
<span style="font-size:18px;line-height:1;margin-right:8px;">⚠️</span>
<span style="flex:1;line-height:1.5;">Ada permohonan akses baru yang masuk dan perlu diverifikasi.</span>
</div>
</td></tr>

<!-- Content -->
<tr><td style="padding:24px 32px 0;">
<h2 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a;">Detail Pemohon</h2>
<p style="margin:0 0 18px;color:#64748b;font-size:13px;">Diterima: {{ $submissionDate }} WIB</p>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;font-size:14px;">
@php
$rows = [
['Nama Lengkap',  $data->name],
['Username',       $data->username],
['Instansi',       $data->instansi],
['Email',          $data->email],
['NIP / ID Pegawai', $data->nip],
['Nomor Telepon',  $data->phone],
];
@endphp
@foreach ($rows as $i => $r)
<tr>
<td style="padding:12px 16px;background:{{ $i % 2 === 0 ? '#f8fafc' : '#ffffff' }};color:#475569;font-weight:600;width:38%;border-bottom:1px solid #e2e8f0;">{{ $r[0] }}</td>
<td style="padding:12px 16px;background:{{ $i % 2 === 0 ? '#f8fafc' : '#ffffff' }};color:#0f172a;border-bottom:1px solid #e2e8f0;">{{ $r[1] }}</td>
</tr>
@endforeach
</table>
</td></tr>

<!-- Letter info -->
<tr><td style="padding:18px 32px 0;">
<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:14px 16px;">
<div style="font-size:12px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Surat Permohonan</div>
<div style="font-size:14px;color:#1e3a8a;font-weight:600;">{{ $data->letter_original_name ?: 'surat-permohonan' }}</div>
<div style="font-size:12px;color:#475569;margin-top:4px;">
Ukuran: {{ $data->letter_size_bytes ? number_format($data->letter_size_bytes / 1024, 1) . ' KB' : '-' }} • Terlampir di email ini
</div>
</div>
</td></tr>

<!-- Action info -->
<tr><td style="padding:24px 32px 0;">
<div style="background:#f1f5f9;border-radius:12px;padding:18px 20px;font-size:13px;color:#334155;line-height:1.6;">
<strong style="display:block;margin-bottom:6px;color:#0f172a;font-size:14px;">Langkah Selanjutnya</strong>
Klik tombol di bawah untuk membuka halaman verifikasi. Di sana Anda dapat menyetujui
(masukkan email & password yang sudah dibuat di DB) atau menolak (dengan alasan).
Email ke pemohon akan dikirim otomatis dengan template yang sudah di-design.
</div>
</td></tr>

<!-- Action Button -->
<tr><td style="padding:18px 32px 0;text-align:center;">
<a href="{{ $reviewUrl }}" target="_blank"
   style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#1e3a8a);color:#ffffff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:.3px;box-shadow:0 4px 12px rgba(29,78,216,.3);">
   Buka Halaman Verifikasi
</a>
<p style="margin:12px 0 0;font-size:11px;color:#94a3b8;line-height:1.5;">
Link aktif 14 hari. Pemohon akan menerima email <strong style="color:#059669;">persetujuan</strong> atau <strong style="color:#dc2626;">penolakan</strong> sesuai pilihan Anda.
</p>
</td></tr>

<!-- Footer -->
<tr><td style="padding:32px;text-align:center;border-top:1px solid #e2e8f0;margin-top:24px;">
<p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
Email ini dikirim otomatis oleh sistem MakeSens Early Warning System.<br>
Mohon tidak membalas email ini secara langsung. Untuk membalas pemohon, gunakan tombol <em>Reply</em> di email Anda.
</p>
<p style="margin:14px 0 0;font-size:12px;color:#cbd5e1;">PBL Semester 6 — TMJ 6A</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>

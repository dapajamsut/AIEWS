<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Review Permohonan #{{ $req->id }} — MakeSens</title>
<style>
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f4f6fb;color:#0f172a;min-height:100vh;padding:32px 16px;}
.wrap{max-width:760px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,.08);}
.head{background:linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 50%,#7f1d1d 100%);color:#fff;padding:32px 36px;text-align:center;}
.head .logo{display:inline-block;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);border-radius:18px;padding:8px 16px;font-size:32px;line-height:1;margin-bottom:10px;}
.head .brand{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#dbeafe;font-weight:700;margin-bottom:4px}
.head h1{margin:0;font-size:18px;font-weight:800;letter-spacing:.3px}
.head p{margin:4px 0 0;color:#dbeafe;font-size:12px}
.body{padding:28px 36px}
.banner{padding:14px 16px;border-radius:12px;font-size:13px;font-weight:600;margin-bottom:20px}
.banner-info{background:#eff6ff;color:#1e3a8a;border:1px solid #bfdbfe}
.banner-ok{background:#dcfce7;color:#065f46;border:1px solid #bbf7d0}
.banner-err{background:#fee2e2;color:#991b1b;border:1px solid #fecaca}
table.detail{width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:24px;font-size:14px}
table.detail td{padding:11px 16px;border-bottom:1px solid #e2e8f0}
table.detail tr:last-child td{border-bottom:0}
table.detail .lbl{background:#f8fafc;color:#475569;font-weight:600;width:36%}
.tab-bar{display:flex;gap:8px;margin-bottom:0;border-bottom:1px solid #e2e8f0}
.tab{flex:1;text-align:center;padding:12px 16px;border-radius:10px 10px 0 0;font-weight:700;font-size:13px;letter-spacing:.3px;background:#f1f5f9;color:#64748b;border:1px solid transparent;border-bottom:0;cursor:pointer;user-select:none}
.tab.approve.active{background:#ecfdf5;border-color:#a7f3d0;color:#065f46}
.tab.reject.active{background:#fef2f2;border-color:#fecaca;color:#991b1b}
.panel{display:none;padding:22px 0 0}
.panel.active{display:block}
label{display:block;font-size:13px;font-weight:600;color:#334155;margin-bottom:6px}
input[type=email],input[type=text],textarea{width:100%;padding:12px 14px;border:1px solid #cbd5e1;border-radius:10px;font-size:14px;font-family:inherit;background:#f8fafc;outline:0}
input:focus,textarea:focus{border-color:#1d4ed8;background:#fff}
textarea{resize:vertical;min-height:120px}
.row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.row.single{grid-template-columns:1fr}
.help{font-size:12px;color:#64748b;margin-top:4px;line-height:1.5}
.actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}
.btn{display:inline-block;padding:12px 22px;border:0;border-radius:10px;font-weight:700;font-size:13px;letter-spacing:.3px;cursor:pointer;text-decoration:none}
.btn-approve{background:linear-gradient(135deg,#059669,#047857);color:#fff}
.btn-reject{background:linear-gradient(135deg,#dc2626,#991b1b);color:#fff}
.btn-ghost{background:#f1f5f9;color:#475569}
.foot{padding:18px 36px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;color:#64748b;font-size:12px}
a.letter{color:#1d4ed8;font-weight:700;text-decoration:none}
a.letter:hover{text-decoration:underline}
.note{background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:12px 14px;font-size:12px;color:#9a3412;line-height:1.6;margin-bottom:14px}
.note code{background:#fdba74;padding:2px 6px;border-radius:4px;font-size:11px;color:#7c2d12}
</style>
</head>
<body>
<div class="wrap">
<div class="head">
<div class="logo">💧</div>
<div class="brand">MakeSens</div>
<h1>Review Permohonan #{{ $req->id }}</h1>
<p>{{ $req->created_at->setTimezone('Asia/Jakarta')->translatedFormat('l, j F Y H:i') }} WIB</p>
</div>

<div class="body">

@if (session('approved'))
<div class="banner banner-ok">✅ Permohonan disetujui. Email kredensial sudah dikirim ke <strong>{{ $req->email }}</strong>.</div>
@elseif (session('rejected'))
<div class="banner banner-err">⛔ Permohonan ditolak. Email pemberitahuan sudah dikirim ke <strong>{{ $req->email }}</strong>.</div>
@elseif ($req->status === 'approved')
<div class="banner banner-ok">Permohonan ini sudah <strong>disetujui</strong> pada {{ $req->reviewed_at?->setTimezone('Asia/Jakarta')->translatedFormat('j F Y H:i') }} WIB.</div>
@elseif ($req->status === 'rejected')
<div class="banner banner-err">Permohonan ini sudah <strong>ditolak</strong> pada {{ $req->reviewed_at?->setTimezone('Asia/Jakarta')->translatedFormat('j F Y H:i') }} WIB.</div>
@elseif ($errors->any())
<div class="banner banner-err">{{ $errors->first() }}</div>
@else
<div class="banner banner-info">Tinjau detail di bawah, lalu pilih <strong>Setujui</strong> atau <strong>Tolak</strong>.</div>
@endif

<table class="detail">
<tr><td class="lbl">Nama Lengkap</td><td>{{ $req->name }}</td></tr>
<tr><td class="lbl">Username Diajukan</td><td>{{ $req->username }}</td></tr>
<tr><td class="lbl">Instansi</td><td>{{ $req->instansi }}</td></tr>
<tr><td class="lbl">Email Pemohon</td><td>{{ $req->email }}</td></tr>
<tr><td class="lbl">NIP / ID Pegawai</td><td>{{ $req->nip }}</td></tr>
<tr><td class="lbl">Telepon</td><td>{{ $req->phone }}</td></tr>
<tr><td class="lbl">Surat Permohonan</td>
<td>
<a class="letter" href="{{ url('/admin/access-requests/' . $req->id . '/letter?signature=' . request('signature') . '&expires=' . request('expires')) }}" target="_blank">
📄 {{ $req->letter_original_name ?: 'Lihat Surat' }}
</a>
@if ($req->letter_size_bytes)
<span style="color:#64748b;font-size:12px;margin-left:6px;">({{ number_format($req->letter_size_bytes / 1024, 1) }} KB)</span>
@endif
</td></tr>
</table>

@if ($req->status === 'pending')
<div class="tab-bar">
<div class="tab approve {{ ($errors->has('rejection_reason') || old('action') === 'reject') ? '' : 'active' }}" id="tab-approve">✅ Setujui</div>
<div class="tab reject {{ ($errors->has('rejection_reason') || old('action') === 'reject') ? 'active' : '' }}" id="tab-reject">⛔ Tolak</div>
</div>

<!-- ===== APPROVE PANEL ===== -->
<div class="panel {{ ($errors->has('rejection_reason') || old('action') === 'reject') ? '' : 'active' }}" id="panel-approve">
<div class="note">
<strong>Buat akun login:</strong> isi email & password yang diinginkan untuk pemohon.
Akun akan <strong>dibuat otomatis</strong> di database saat Anda menekan tombol setujui,
lalu kredensial ini langsung dikirim ke email pemohon. Jika email sudah terdaftar,
password-nya akan diperbarui ke yang Anda isi.
</div>
<form method="POST" action="{{ url('/admin/access-requests/' . $req->id . '/approve') }}">
@csrf
<input type="hidden" name="action" value="approve">
<div class="row">
<div>
<label for="login_email">Email Login</label>
<input type="email" id="login_email" name="login_email" value="{{ old('login_email', $req->email) }}" required>
<div class="help">Email untuk akun login (akan dibuat otomatis).</div>
</div>
<div>
<label for="login_password">Password Login</label>
<input type="text" id="login_password" name="login_password" value="{{ old('login_password') }}" required minlength="6">
<div class="help">Password ini akan dikirim ke email pemohon.</div>
</div>
</div>
<div class="actions">
<a href="{{ rtrim(env('FRONTEND_URL', '/'), '/') }}" class="btn btn-ghost">Batal</a>
<button type="submit" class="btn btn-approve">Setujui & Kirim Kredensial</button>
</div>
</form>
</div>

<!-- ===== REJECT PANEL ===== -->
<div class="panel {{ ($errors->has('rejection_reason') || old('action') === 'reject') ? 'active' : '' }}" id="panel-reject">
<form method="POST" action="{{ url('/admin/access-requests/' . $req->id . '/reject') }}">
@csrf
<input type="hidden" name="action" value="reject">
<div class="row single">
<div>
<label for="rejection_reason">Alasan Penolakan</label>
<textarea id="rejection_reason" name="rejection_reason" required minlength="10" placeholder="Contoh: Surat permohonan tidak ditandatangani oleh atasan yang berwenang. Mohon kirim ulang dengan dokumen yang valid.">{{ old('rejection_reason') }}</textarea>
<div class="help">Alasan ini akan dikirim ke email pemohon. Tulis dengan jelas dan profesional.</div>
</div>
</div>
<div class="actions">
<a href="{{ rtrim(env('FRONTEND_URL', '/'), '/') }}" class="btn btn-ghost">Batal</a>
<button type="submit" class="btn btn-reject">Tolak & Kirim Email</button>
</div>
</form>
</div>
@endif

</div>

<div class="foot">
MakeSens Early Warning System • PBL Semester 6 — TMJ 6A
</div>
</div>

<script>
(function(){
  var tA = document.getElementById('tab-approve');
  var tR = document.getElementById('tab-reject');
  var pA = document.getElementById('panel-approve');
  var pR = document.getElementById('panel-reject');
  if (!tA || !tR) return;
  function show(which){
    if (which === 'approve'){
      tA.classList.add('active'); tR.classList.remove('active');
      pA.classList.add('active'); pR.classList.remove('active');
    } else {
      tR.classList.add('active'); tA.classList.remove('active');
      pR.classList.add('active'); pA.classList.remove('active');
    }
  }
  tA.addEventListener('click', function(){ show('approve'); });
  tR.addEventListener('click', function(){ show('reject'); });
})();
</script>
</body>
</html>

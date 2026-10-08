# Portfolio — Muhammad Najril Adla

Static site (HTML + CSS + vanilla JS). Tidak perlu build step. Buka `index.html` atau jalankan:

    python3 -m http.server 8000

## Yang perlu diedit
- **Nama & judul**: `config.js` (`SITE_CONFIG.name`, `SITE_CONFIG.title`) — otomatis mengisi logo, hero, kartu kode, teks "Tentang", footer, dan `<title>`.
- **Peran di efek typing hero**: `config.js` → `extraRoles` (peran pertama selalu `title`).
- **Autoplay carousel proyek**: `config.js` → `carouselAutoplayMs` (0 = mati).
- **Daftar teknologi (marquee)**: `index.html`, section `#keahlian` → `<ul class="marquee-track">`.
  Untuk SEO/no-JS, samakan juga `<title>` dan `<meta name="description">` di bagian `<head>` `index.html`.
- **Kontak (PLACEHOLDER)**: `index.html`, section `#kontak` — ganti `href` dan teks untuk Email, LinkedIn, GitHub, lalu hapus elemen `<span class="contact-hint">`.

## File
- `index.html` — konten & struktur
- `styles.css` — tampilan (dark theme, responsive)
- `script.js` — mobile nav, reveal, typing, marquee, carousel, parallax + scroll progress (semua menghormati `prefers-reduced-motion`)
- `config.js` — nama & judul

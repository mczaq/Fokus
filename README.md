# FOKUS STUDIO

Platform web untuk penyewaan peralatan fotografi, pemesanan (booking) studio, dan pemesanan jasa foto. Aplikasi mencakup katalog produk, keranjang belanja, proses checkout, verifikasi pembayaran oleh admin, monitoring sewa, perhitungan denda keterlambatan otomatis, serta dasbor manajemen untuk admin.

Aplikasi dibangun dengan Next.js (App Router) dan Prisma ORM di atas database PostgreSQL.

---

## Fitur Utama

### Untuk Pelanggan
- Katalog peralatan, studio, dan jasa foto beserta halaman detail.
- Keranjang belanja dan checkout dengan validasi stok pada rentang tanggal sewa.
- Pembayaran melalui transfer bank (unggah bukti transfer) atau tunai, dengan persetujuan Kontrak Sewa (EULA) sebelum konfirmasi.
- Halaman "Pesanan Saya": memantau status pesanan, pembayaran, dan denda.
- Pengajuan perpanjangan sewa (extend), penjadwalan ulang (reschedule), dan pembatalan (cancel).
- Denda keterlambatan otomatis yang bertambah setiap hari selama barang belum dikembalikan.
- Pembayaran denda keterlambatan yang wajib disetujui admin terlebih dahulu.
- Notifikasi melalui ikon lonceng dan pop-up pengingat (keterlambatan, status pembayaran, perpanjangan, refund).

### Untuk Admin dan Superuser
- Monitoring Sewa untuk peralatan, studio, dan jasa foto dalam satu halaman.
- Pencatatan waktu aktual pengambilan (actual pickup) dan pengembalian (actual return).
- Form inspeksi pengembalian dengan tiga kondisi: normal, rusak, dan hilang, lengkap dengan perhitungan biaya.
- Rekap dan verifikasi pembayaran (terima, tolak, refund).
- Monitoring keuangan dengan pemisahan buku kas sewa dan buku kas denda/kerusakan/kehilangan.
- Manajemen peralatan, studio, layanan, galeri/portofolio, dan pengguna.
- Jadwal dan ketersediaan studio dengan pencegahan tabrakan jadwal.
- Chat dengan pelanggan.

Dokumentasi rinci setiap fitur beserta alur kerjanya tersedia di berkas `FITUR.md`.

---

## Teknologi

- Next.js 16 (App Router) dan React 19
- TypeScript
- Prisma ORM 7 dengan adapter PostgreSQL (`@prisma/adapter-pg`)
- Tailwind CSS 4
- lucide-react untuk ikon
- Cloudinary untuk penyimpanan unggahan gambar
- Nodemailer untuk notifikasi email
- bcryptjs untuk hashing kata sandi

---

## Prasyarat

- Node.js versi 20 atau lebih baru
- Database PostgreSQL (lokal atau layanan terkelola)
- npm

---

## Instalasi dan Menjalankan

1. Pasang dependensi:

   ```bash
   npm install
   ```

2. Buat berkas `.env` di direktori root dan isi variabel lingkungan (lihat bagian Variabel Lingkungan di bawah).

3. Siapkan database dan jalankan migrasi:

   ```bash
   npm run db:migrate
   ```

4. Isi data awal (akun demo, contoh produk, dan lainnya):

   ```bash
   npm run db:seed
   ```

5. Jalankan server pengembangan:

   ```bash
   npm run dev
   ```

   Aplikasi akan tersedia di `http://localhost:3000`.

---

## Variabel Lingkungan

Buat berkas `.env` di root proyek. Hanya `DATABASE_URL` yang wajib; variabel lain bersifat opsional dan hanya diperlukan apabila fitur terkait digunakan.

```env
# Wajib: koneksi database PostgreSQL
DATABASE_URL="postgres://user:password@host:5432/nama_database?sslmode=require"

# Opsional: unggah gambar via Cloudinary
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# Opsional: notifikasi email via SMTP
SMTP_HOST=""
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM=""

# Opsional: integrasi pembayaran Midtrans
MIDTRANS_SERVER_KEY=""
MIDTRANS_IS_PRODUCTION="false"
```

Catatan: jangan membagikan atau menyimpan kredensial asli di dalam repositori publik. Berkas `.env` sudah diabaikan oleh Git.

---

## Perintah yang Tersedia

| Perintah | Keterangan |
| --- | --- |
| `npm run dev` | Menjalankan server pengembangan. |
| `npm run build` | Membangun aplikasi untuk produksi. |
| `npm run start` | Menjalankan hasil build produksi. |
| `npm run lint` | Menjalankan ESLint. |
| `npm run db:migrate` | Membuat dan menerapkan migrasi database (pengembangan). |
| `npm run db:seed` | Mengisi database dengan data awal. |
| `npm run db:reset` | Mereset database lalu menjalankan ulang migrasi dan seed. |
| `npm run db:studio` | Membuka Prisma Studio untuk menelusuri data. |
| `npm run db:generate` | Menghasilkan Prisma Client. |

---

## Akun Demo

Setelah menjalankan `npm run db:seed`, tersedia akun berikut untuk pengujian:

| Peran | Email | Kata Sandi |
| --- | --- | --- |
| Admin | admin@fokus.id | admin123 |
| Superuser | super@fokus.id | super123 |
| Pengguna | user@fokus.id | user123 |

Disarankan mengganti kata sandi akun ini sebelum digunakan di lingkungan produksi.

---

## Peran Pengguna

- Pengguna (user): menyewa alat, memesan studio dan jasa foto, serta mengelola pesanan miliknya.
- Admin: mengakses seluruh dasbor manajemen, verifikasi pembayaran, monitoring sewa, dan inspeksi pengembalian.
- Superuser: memiliki akses setingkat admin ditambah kewenangan tambahan pada manajemen pengguna.

---

## Struktur Direktori Singkat

```
app/
  api/            Route handler (REST) untuk order, pembayaran, sewa, notifikasi, dll.
  components/     Komponen UI dan modal (pembayaran, inspeksi, pembatalan, dll.)
  context/        React Context (autentikasi, notifikasi, data aplikasi)
  dashboard/      Halaman dasbor pelanggan dan admin
  lib/            Utilitas (Prisma client, perhitungan denda/biaya, email, dll.)
prisma/
  schema.prisma   Skema database
  seed.ts         Skrip pengisian data awal
```

---

## Dokumentasi Tambahan

- `FITUR.md` berisi penjelasan teknis dan alur kerja setiap fitur.
- `AGENTS.md` berisi catatan konvensi pengembangan untuk proyek ini.

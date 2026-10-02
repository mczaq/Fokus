import fs from 'fs';

const emojiMap = {
  '⚠': 'AlertTriangle',
  '⚠️': 'AlertTriangle',
  '✕': 'X',
  '🎟': 'Ticket',
  '✓': 'Check',
  '⏳': 'Hourglass',
  '©': 'Copyright',
  '📋': 'ClipboardList',
  '🚨': 'BellRing',
  '🏦': 'Landmark',
  '📱': 'Smartphone',
  '💬': 'MessageCircle',
  '📅': 'Calendar',
  '📆': 'CalendarDays',
  '💳': 'CreditCard',
  '💵': 'Banknote',
  '⚡': 'Zap',
  '❌': 'XCircle',
  '📷': 'Camera',
  '🔒': 'Lock',
  '🎙': 'Mic',
  '📸': 'Camera',
  '📞': 'Phone',
  '✉': 'Mail',
  '🔴': 'AlertCircle',
  '★': 'Star',
  '💰': 'Wallet',
  '🔍': 'Search',
  '📊': 'BarChart3',
  '✅': 'CheckCircle2',
  '🏠': 'Home',
  '📦': 'Package',
  '🙏': 'HeartHandshake',
  '📍': 'MapPin',
  '📹': 'Video',
  '⭐': 'Star'
};

const files = [
  './app/dashboard/orders/page.tsx',
  './app/dashboard/rentals/page.tsx',
  './app/dashboard/booking/page.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  let usedIcons = new Set();

  // Simple string replace for specific known patterns in dashboard
  const patterns = [
    ['"📷 Equipment ({equipmentCount})"', '<span><Camera className="w-4 h-4 inline-block mr-1" /> Equipment ({equipmentCount})</span>'],
    ['"🎙️ Studio ({studioCount})"', '<span><Mic className="w-4 h-4 inline-block mr-1" /> Studio ({studioCount})</span>'],
    ['"📸 Jasa Foto ({serviceCount})"', '<span><Camera className="w-4 h-4 inline-block mr-1" /> Jasa Foto ({serviceCount})</span>'],
    ['"📷"', '<Camera className="w-4 h-4 inline-block" />'],
    ['"🚨"', '<BellRing className="w-4 h-4 inline-block" />'],
    ['"✅"', '<CheckCircle2 className="w-4 h-4 inline-block" />'],
    ['"🔍"', '<Search className="w-4 h-4 inline-block" />'],
    ['"📞 {record.borrower.phone}"', '<span><Phone className="w-3 h-3 inline-block mr-1" /> {record.borrower.phone}</span>'],
    ['"✉️ {record.borrower.email}"', '<span><Mail className="w-3 h-3 inline-block mr-1" /> {record.borrower.email}</span>'],
    ['"🏠 {record.borrower.address}"', '<span><Home className="w-3 h-3 inline-block mr-1" /> {record.borrower.address}</span>'],
    ['record.type === "STUDIO" ? "🎙️" : record.type === "SERVICE" ? "📸" : "📷"', 'record.type === "STUDIO" ? <Mic className="w-4 h-4 inline-block" /> : record.type === "SERVICE" ? <Camera className="w-4 h-4 inline-block" /> : <Camera className="w-4 h-4 inline-block" />'],
    ['"📸 {record.items[0]?.service?.duration || record.items[0]?.equipment?.brand || \\"Jasa Fotografi\\"}"', '<span><Camera className="w-3 h-3 inline-block mr-1" /> {record.items[0]?.service?.duration || record.items[0]?.equipment?.brand || "Jasa Fotografi"}</span>'],
    ['"✓ Actual Pickup:"', '<span><Check className="w-3 h-3 inline-block mr-1" /> Actual Pickup:</span>'],
    ['"✓ Actual Return:"', '<span><Check className="w-3 h-3 inline-block mr-1" /> Actual Return:</span>'],
    ['"🔴 OVERDUE"', '<span><AlertCircle className="w-3 h-3 inline-block mr-1" /> OVERDUE</span>'],
    ['"🔴 Kerusakan"', '<span><AlertCircle className="w-3 h-3 inline-block mr-1" /> Kerusakan</span>'],
    ['"✓ (denda sudah lunas)"', '<span><Check className="w-3 h-3 inline-block mr-1" /> (denda sudah lunas)</span>'],
    ['"⚠️ (denda belum lunas)"', '<span><AlertTriangle className="w-3 h-3 inline-block mr-1" /> (denda belum lunas)</span>'],
    ['"❌ Hilang"', '<span><XCircle className="w-3 h-3 inline-block mr-1" /> Hilang</span>'],
    ['<span>🚨</span> Ada Pengajuan Batal User', '<BellRing className="w-3 h-3 inline-block mr-1" /> Ada Pengajuan Batal User'],
    ['<span>⚡</span> Proses Pembatalan &amp; Refund', '<Zap className="w-3 h-3 inline-block mr-1" /> Proses Pembatalan &amp; Refund'],
    ['"✓ ACC Cepat"', '<span><Check className="w-3 h-3 inline-block mr-1" /> ACC Cepat</span>'],
    ['"✕ Tolak"', '<span><X className="w-3 h-3 inline-block mr-1" /> Tolak</span>'],
    ['"📅 Ada Reschedule"', '<span><Calendar className="w-3 h-3 inline-block mr-1" /> Ada Reschedule</span>'],
    ['"✓ ACC Reschedule"', '<span><Check className="w-3 h-3 inline-block mr-1" /> ACC Reschedule</span>'],
    ['<span>✓</span> Setujui Perpanjangan', '<Check className="w-3 h-3 inline-block mr-1" /> Setujui Perpanjangan'],
    ['"✕ Tolak Perpanjangan"', '<span><X className="w-3 h-3 inline-block mr-1" /> Tolak Perpanjangan</span>'],
    ['"✓ Dibatalkan &amp; Direfund"', '<span><Check className="w-3 h-3 inline-block mr-1" /> Dibatalkan &amp; Direfund</span>'],
    ['"🔍 Detail Refund"', '<span><Search className="w-3 h-3 inline-block mr-1" /> Detail Refund</span>'],
    ['<span>🎙️</span> Mulai Sesi Studio', '<Mic className="w-3 h-3 inline-block mr-1" /> Mulai Sesi Studio'],
    ['<span>✅</span> Selesaikan Sesi Studio', '<CheckCircle2 className="w-3 h-3 inline-block mr-1" /> Selesaikan Sesi Studio'],
    ['"⚠️ Batalkan &amp; Refund Studio"', '<span><AlertTriangle className="w-3 h-3 inline-block mr-1" /> Batalkan &amp; Refund Studio</span>'],
    ['<span>✓</span> Konfirmasi Order', '<Check className="w-3 h-3 inline-block mr-1" /> Konfirmasi Order'],
    ['<span>📸</span> Mulai Sesi Foto', '<Camera className="w-3 h-3 inline-block mr-1" /> Mulai Sesi Foto'],
    ['<span>✅</span> Selesaikan Sesi Foto', '<CheckCircle2 className="w-3 h-3 inline-block mr-1" /> Selesaikan Sesi Foto'],
    ['"⚠️ Batalkan & Refund"', '<span><AlertTriangle className="w-3 h-3 inline-block mr-1" /> Batalkan & Refund</span>'],
    ['{isUpdating ? "Memproses..." : "📦 Catat Actual Pickup (Serahkan)"}', '{isUpdating ? "Memproses..." : <><Package className="w-3 h-3 inline-block mr-1" /> Catat Actual Pickup (Serahkan)</>}'],
    ['"✅ Terima Pengembalian &amp; Inspeksi"', '<span><CheckCircle2 className="w-3 h-3 inline-block mr-1" /> Terima Pengembalian &amp; Inspeksi</span>'],
    ['"💬 Ingatkan Peminjam (WA)"', '<span><MessageCircle className="w-3 h-3 inline-block mr-1" /> Ingatkan Peminjam (WA)</span>'],
    ['"🔍 Detail Form Request"', '<span><Search className="w-3 h-3 inline-block mr-1" /> Detail Form Request</span>'],
    ['"✕"', '<X className="w-4 h-4 inline-block" />'],
    ['"📞 Telepon:"', '<span><Phone className="w-3 h-3 inline-block mr-1" /> Telepon:</span>'],
    ['"✉️ Email:"', '<span><Mail className="w-3 h-3 inline-block mr-1" /> Email:</span>'],
    ['"🏠 Alamat:"', '<span><Home className="w-3 h-3 inline-block mr-1" /> Alamat:</span>'],
    ['"🔴 Denda Kerusakan Barang"', '<span><AlertCircle className="w-3 h-3 inline-block mr-1" /> Denda Kerusakan Barang</span>'],
    ['"❌ Denda Barang Hilang"', '<span><XCircle className="w-3 h-3 inline-block mr-1" /> Denda Barang Hilang</span>'],
    ['"⏱️ Sisa"', '<span><Hourglass className="w-3 h-3 inline-block mr-1" /> Sisa</span>'],
    ['"⏱️ {record.startTime || \\"—\\"}"', '<span><Hourglass className="w-3 h-3 inline-block mr-1" /> {record.startTime || "—"}</span>'],
    ['"⚠️ Denda Belum Lunas:"', '<span><AlertTriangle className="w-3 h-3 inline-block mr-1" /> Denda Belum Lunas:</span>'],
    ['"✓ Denda Lunas"', '<span><Check className="w-3 h-3 inline-block mr-1" /> Denda Lunas</span>'],
    ['"🚨 Pengajuan Pembatalan (Refund)"', '<span><BellRing className="w-3 h-3 inline-block mr-1" /> Pengajuan Pembatalan (Refund)</span>'],
    ['"🏦 Rekening:"', '<span><Landmark className="w-3 h-3 inline-block mr-1" /> Rekening:</span>'],
    ['"📱 WA:"', '<span><Smartphone className="w-3 h-3 inline-block mr-1" /> WA:</span>'],
    ['"✓ Pembatalan &amp; Refund Disetujui"', '<span><Check className="w-3 h-3 inline-block mr-1" /> Pembatalan &amp; Refund Disetujui</span>'],
    ['"💰 Refund:"', '<span><Wallet className="w-3 h-3 inline-block mr-1" /> Refund:</span>'],
    ['"✕ Pengajuan Pembatalan Ditolak"', '<span><X className="w-3 h-3 inline-block mr-1" /> Pengajuan Pembatalan Ditolak</span>'],
    ['"📅 Pengajuan Reschedule"', '<span><Calendar className="w-3 h-3 inline-block mr-1" /> Pengajuan Reschedule</span>'],
    ['{isUpdating ? "Memproses..." : "✓ ACC Pembatalan (Kurangi Keuangan)"}', '{isUpdating ? "Memproses..." : <><Check className="w-3 h-3 inline-block mr-1" /> ACC Pembatalan (Kurangi Keuangan)</>}'],
    ['"✕ Tolak Pembatalan"', '<span><X className="w-3 h-3 inline-block mr-1" /> Tolak Pembatalan</span>'],
    ['{isUpdating ? "Memproses..." : "✓ ACC Reschedule"}', '{isUpdating ? "Memproses..." : <><Check className="w-3 h-3 inline-block mr-1" /> ACC Reschedule</>}'],
    ['"✕ Tolak Reschedule"', '<span><X className="w-3 h-3 inline-block mr-1" /> Tolak Reschedule</span>'],
    ['{isUpdating ? "Memproses..." : "✓ ACC Perpanjangan"}', '{isUpdating ? "Memproses..." : <><Check className="w-3 h-3 inline-block mr-1" /> ACC Perpanjangan</>}'],
    ['"✕ Tolak Perpanjangan"', '<span><X className="w-3 h-3 inline-block mr-1" /> Tolak Perpanjangan</span>'],
    ['"💳 Bayar Denda / Fee"', '<span><CreditCard className="w-3 h-3 inline-block mr-1" /> Bayar Denda / Fee</span>'],
    ['"📅 Reschedule"', '<span><Calendar className="w-3 h-3 inline-block mr-1" /> Reschedule</span>'],
    ['"⚠️ Pembatalan"', '<span><AlertTriangle className="w-3 h-3 inline-block mr-1" /> Pembatalan</span>'],
    ['"★ Beri Ulasan"', '<span><Star className="w-3 h-3 inline-block mr-1" /> Beri Ulasan</span>'],
    ['"🔍 Lihat Detail Form"', '<span><Search className="w-3 h-3 inline-block mr-1" /> Lihat Detail Form</span>']
  ];

  for (const [from, to] of patterns) {
    while(content.includes(from)) {
      content = content.replace(from, to);
    }
  }

  // Extract all Lucide imports we might need
  const imports = `import { Camera, Mic, BellRing, CheckCircle2, Search, Phone, Mail, Home, Check, AlertCircle, AlertTriangle, XCircle, Zap, X, Calendar, Package, MessageCircle, Hourglass, Landmark, Smartphone, Wallet, CreditCard, Star } from "lucide-react";\n`;

  if (!content.includes('lucide-react')) {
    if (content.includes('import Link from "next/link";')) {
        content = content.replace('import Link from "next/link";', 'import Link from "next/link";\n' + imports);
    } else {
        content = imports + content;
    }
  }
  
  fs.writeFileSync(file, content);
}
console.log("Successfully replaced common emojis in dashboard files.");

"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";
import Link from "next/link";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { cart, removeFromCart, updateCartQty } = useAppData();

  const navLinks = [
    { label: "Beranda", href: "/" },
    { label: "Studio", href: "/studio" },
    { label: "Katalog", href: "/katalog" },
    { label: "Galeri", href: "/galeri" },
    { label: "Layanan", href: "/layanan" },
  ];

  useEffect(() => {
    const handleOpenCart = () => setIsCartOpen(true);
    window.addEventListener("open_cart", handleOpenCart);
    return () => window.removeEventListener("open_cart", handleOpenCart);
  }, []);

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const formatIDR = (n: number) => "Rp " + n.toLocaleString("id-ID");

  return (
    <>
      <nav className="bg-[#FAF9F5] border-b border-[#e7e6df] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 border border-neutral-950 flex items-center justify-center text-neutral-950 font-bold relative font-serif italic text-sm transition-opacity group-hover:opacity-75">
                <span className="absolute top-0 left-0 w-1 h-1 border-t border-l border-neutral-950"></span>
                <span className="absolute top-0 right-0 w-1 h-1 border-t border-r border-neutral-950"></span>
                <span className="absolute bottom-0 left-0 w-1 h-1 border-b border-l border-neutral-950"></span>
                <span className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-neutral-950"></span>
                F
              </div>
              <span className="font-bold text-lg text-neutral-950 tracking-widest font-mono uppercase transition-opacity group-hover:opacity-75">Fokus</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link key={link.label} href={link.href} className="text-[11px] font-mono uppercase tracking-widest text-neutral-600 hover:text-black hover:font-bold transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Actions & Cart */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-neutral-800 hover:text-black transition-all duration-200 mr-2"
                aria-label="Buka Keranjang"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center bg-black text-[8px] font-mono font-bold text-white ring-2 ring-white">
                    {cartItemsCount}
                  </span>
                )}
              </button>

              {isAuthenticated && user ? (
                <div className="flex items-center space-x-4">
                  <Link href="/dashboard" className="text-[11px] font-mono uppercase tracking-widest text-slate-700 hover:text-slate-900">
                    Dashboard
                  </Link>
                  <div className="h-3 w-px bg-slate-300"></div>
                  <button onClick={logout} className="text-[11px] font-mono uppercase tracking-widest text-red-600 hover:text-red-700 cursor-pointer">
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link href="/login" className="text-[11px] font-mono uppercase tracking-widest text-slate-700 hover:text-slate-900">
                    Masuk
                  </Link>
                  <Link href="/register" className="btn-primary py-2 px-4 text-xs font-mono uppercase tracking-widest">
                    Daftar
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Mobile Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-neutral-800 hover:text-black"
                aria-label="Buka Keranjang"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center bg-black text-[8px] font-mono font-bold text-white ring-2 ring-white">
                    {cartItemsCount}
                  </span>
                )}
              </button>
              <button onClick={() => setMobileOpen(!mobileOpen)} className="text-slate-500 hover:text-slate-900 p-2">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {mobileOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 8h16M4 16h16" />}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden bg-[#FAF9F5] border-b border-[#e7e6df]">
            <div className="px-4 pt-2 pb-6 flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link key={link.label} href={link.href} onClick={() => setMobileOpen(false)} className="block py-2 text-xs font-mono uppercase tracking-widest text-slate-700">
                  {link.label}
                </Link>
              ))}
              <div className="h-px bg-neutral-200 my-2"></div>
              {isAuthenticated ? (
                 <div className="flex flex-col space-y-3">
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block py-2 text-xs font-mono uppercase tracking-widest text-slate-700">Dashboard</Link>
                  <button onClick={() => { logout(); setMobileOpen(false); }} className="text-left py-2 text-xs font-mono uppercase tracking-widest text-red-600">Logout</button>
                 </div>
              ) : (
                <div className="flex flex-col space-y-3 mt-2">
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="btn-secondary w-full text-center py-2 text-xs font-mono uppercase tracking-widest">Masuk</Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="btn-primary w-full text-center py-2 text-xs font-mono uppercase tracking-widest">Daftar</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Cart Drawer Backdrop */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs z-[100] transition-opacity duration-300"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {/* Cart Drawer Panel */}
      <div
        className={`fixed inset-y-0 right-0 max-w-md w-full bg-[#FAF9F5] border-l border-[#e7e6df] shadow-2xl z-[101] flex flex-col transition-transform duration-300 ease-out transform ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#e7e6df] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-neutral-900 flex items-center justify-center text-neutral-900 relative">
              <span className="absolute top-0 left-0 w-1 h-1 border-t border-l border-neutral-900"></span>
              <span className="absolute top-0 right-0 w-1 h-1 border-t border-r border-neutral-900"></span>
              <span className="absolute bottom-0 left-0 w-1 h-1 border-b border-l border-neutral-900"></span>
              <span className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-neutral-900"></span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </div>
            <div>
              <h2 className="font-serif italic font-bold text-base text-neutral-950 leading-tight">Keranjang Sewa</h2>
              <p className="text-[9px] font-mono tracking-widest uppercase text-neutral-500">Peralatan &amp; Aksesoris</p>
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-12 h-12 border border-neutral-200 flex items-center justify-center mb-4 text-slate-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
              </div>
              <p className="font-serif italic font-bold text-slate-900 mb-1">Keranjang Sewa Kosong</p>
              <p className="text-[10px] text-slate-500 leading-relaxed max-w-[240px] mb-6">
                Belum ada alat fotografi atau aksesoris yang Anda tambahkan untuk disewa.
              </p>
              <Link
                href="/katalog"
                onClick={() => setIsCartOpen(false)}
                className="btn-primary py-2.5 px-6 text-xs font-mono uppercase tracking-widest"
              >
                Lihat Katalog Alat
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((entry) => (
                <div key={entry.equipment.id} className="flex gap-4 p-3 bg-white border border-neutral-200 viewfinder-box p-3 rounded-none group relative">
                  <div className="viewfinder-corners-bottom"></div>
                  <div className="viewfinder-center text-neutral-900"></div>

                  {/* Thumbnail */}
                  <div className="w-16 h-16 bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {entry.equipment.image ? (
                      <img src={entry.equipment.image} alt={entry.equipment.name} className="w-full h-full object-cover" />
                    ) : (
                      <svg className="text-slate-300" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-0.5">{entry.equipment.brand}</span>
                      <h4 className="font-serif italic font-bold text-xs text-slate-900 truncate leading-snug">{entry.equipment.name}</h4>
                      <p className="text-xs font-bold text-neutral-950 font-mono mt-1">{formatIDR(entry.equipment.pricePerDay)}/hari</p>
                    </div>
                    
                    {/* Actions & Qty */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center bg-white border border-neutral-200 p-0.5">
                        <button
                          onClick={() => {
                            if (entry.quantity === 1) removeFromCart(entry.equipment.id);
                            else updateCartQty(entry.equipment.id, entry.quantity - 1);
                          }}
                          className="w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-500 hover:bg-slate-100 rounded transition-colors"
                        >
                          -
                        </button>
                        <span className="text-xs font-mono font-bold text-slate-800 w-4 text-center">{entry.quantity}</span>
                        <button
                          onClick={() => updateCartQty(entry.equipment.id, entry.quantity + 1)}
                          className="w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-500 hover:bg-slate-100 rounded transition-colors"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(entry.equipment.id)}
                        className="text-[9px] text-red-600 hover:text-red-700 font-mono uppercase tracking-widest flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-[#e7e6df] bg-white space-y-4">
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest">
              <span className="text-slate-500 font-semibold">Subtotal Sewa</span>
              <strong className="text-sm font-extrabold text-neutral-950 font-mono">
                {formatIDR(cart.reduce((sum, item) => sum + item.equipment.pricePerDay * item.quantity, 0))}/hari
              </strong>
            </div>
            <p className="text-[8px] font-mono text-slate-400 leading-relaxed uppercase tracking-wider">
              *Estimasi sewa per hari. Durasi dihitung saat checkout.
            </p>
            <Link
              href={isAuthenticated ? "/dashboard/booking?type=equipment" : "/login"}
              onClick={() => setIsCartOpen(false)}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest"
            >
              <span>Pesan Sekarang</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

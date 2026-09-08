"use client";
import { useAppData } from "../context/AppDataContext";
import Reveal from "./Reveal";
import Link from "next/link";

function formatIDR(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export default function Catalog() {
  const { equipment } = useAppData();
  const activeItems = equipment.filter(e => e.isActive);

  return (
    <section id="katalog" className="py-24 bg-[#FAF9F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Reveal direction="up">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <span className="text-neutral-500 font-mono tracking-widest uppercase text-xs mb-3 block">KATALOG ALAT</span>
              <h2 className="text-3xl md:text-5xl font-light text-slate-900 font-serif leading-tight">
                Peralatan <span className="italic font-bold text-black border-b-2 border-black pb-0.5">Premium</span>
              </h2>
            </div>
            <button className="flex items-center text-xs font-mono uppercase tracking-widest text-neutral-900 bg-white border border-neutral-300 px-5 py-3 shadow-xs hover:bg-neutral-900 hover:text-white transition-colors cursor-pointer">
              Unduh Pricelist Lengkap <span className="ml-2 font-normal">&darr;</span>
            </button>
          </div>
        </Reveal>

        {activeItems.length === 0 ? (
          <div className="text-center text-slate-400 py-16">
            <p className="font-medium">Belum ada equipment yang tersedia.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {activeItems.slice(0, 4).map((item, i) => (
              <Reveal key={item.id} delay={i * 100} direction="up" className="h-full">
                <div className="bg-white border border-neutral-200 viewfinder-box p-3 rounded-none flex flex-col h-full relative overflow-hidden group cursor-default">
                  <div className="viewfinder-corners-bottom"></div>
                  <div className="viewfinder-center text-neutral-900"></div>

                  {/* Image Header */}
                  <div className="h-48 w-full bg-slate-100 relative overflow-hidden shrink-0 border-b border-slate-100">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400">
                        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 border border-neutral-200 text-[9px] font-mono uppercase tracking-widest text-slate-600">
                        {item.category}
                      </span>
                      {item.tag && (
                        <span className="inline-flex items-center px-2 py-0.5 text-[8px] font-mono font-bold bg-black text-white uppercase tracking-wider">
                          {item.tag}
                        </span>
                      )}
                    </div>
                    
                    <h4 className="text-base font-bold text-slate-900 font-serif italic mb-1.5" title={item.name}>{item.name}</h4>
                    <p className="text-[11px] text-slate-500 mb-5 flex-1 leading-relaxed" title={item.description}>{item.description}</p>
                    
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                      <div>
                        <div className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Harga Sewa</div>
                        <div className="text-sm font-extrabold text-neutral-950 font-mono">{formatIDR(item.pricePerDay)}/hari</div>
                      </div>
                      <Link href="/katalog" className="w-8 h-8 rounded-none bg-slate-50 hover:bg-black text-slate-400 hover:text-white flex items-center justify-center transition-colors" aria-label="Detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </Link>
                    </div>
                  </div>
                  
                </div>
              </Reveal>
            ))}
          </div>
        )}

        {activeItems.length > 4 && (
          <Reveal delay={200}>
            <div className="mt-16 text-center">
              <Link href="/katalog" className="btn-secondary px-8 py-3 text-sm font-semibold inline-block cursor-pointer">
                Lihat Semua Katalog Perlengkapan
              </Link>
            </div>
          </Reveal>
        )}

      </div>
    </section>
  );
}

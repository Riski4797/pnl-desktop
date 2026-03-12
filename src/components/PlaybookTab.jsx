import React, { useState } from 'react';
import { Bookmark, Target, Tag, ChevronRight, Filter } from 'lucide-react';
import { formatMoney, getDateOnly } from '../lib/utils';
import TradeDrawer from './TradeDrawer';

export default function PlaybookTab({ entries, updateEntry }) {
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [filterTag, setFilterTag] = useState('All');

  const favorites = entries.filter(e => e.isFavorite && e.imagePath);

  // Get unique tags for filtering
  const tags = [...new Set(favorites.map(e => e.tag).filter(Boolean))].sort();

  const filteredFavorites = favorites.filter(e => {
    if (filterTag !== 'All' && e.tag !== filterTag) return false;
    return true;
  });

  return (
    <>
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 rounded-xl overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#111827]">
          <div>
            <h3 className="text-xl text-slate-800 dark:text-slate-200 font-bold flex items-center">
              <Bookmark className="w-5 h-5 mr-2 text-amber-500 fill-amber-500" /> Playbook (Setup Library)
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Galeri setup textbook dari masa lalu Anda. {favorites.length} setup disimpan.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#0a0e17] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800/60">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select 
                value={filterTag} 
                onChange={(e) => setFilterTag(e.target.value)}
                className="bg-transparent text-sm text-slate-700 dark:text-slate-300 outline-none border-none cursor-pointer pr-4"
              >
                <option value="All">Semua Tag</option>
                {tags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {filteredFavorites.length === 0 ? (
          <div className="p-16 text-center text-slate-500 dark:text-slate-400">
            <Bookmark className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
            <h4 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">Belum ada Setup Favorit</h4>
            <p className="max-w-md mx-auto">
              Simpan screenshot trade terbaik Anda dengan mengklik ikon Bintang ⭐ di panel Trade Drawer (pada tab Dashboard atau Riwayat).
            </p>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredFavorites.sort((a, b) => new Date(b.date) - new Date(a.date)).map(setup => {
              const dateDisplay = new Date(getDateOnly(setup.date)).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' });
              
              return (
                <div 
                  key={setup.id} 
                  className="group bg-slate-50 dark:bg-[#0a0e17] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden cursor-pointer hover:border-amber-500/50 hover:shadow-lg dark:hover:shadow-amber-500/5 transition-all"
                  onClick={() => setSelectedTrade(setup)}
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                    <img 
                      src={setup.imagePath} 
                      alt="Setup Thumbnail" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-80" />
                    
                    {/* Position Label overlay */}
                    <div className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
                       <span className={`px-2 py-1 rounded bg-black/60 backdrop-blur-md ${setup.type === 'Long' ? 'text-emerald-400' : 'text-rose-400'}`}>
                         {setup.type}
                       </span>
                    </div>

                    {/* Meta info bottom of thumbnail */}
                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                      <div className="font-bold text-white text-lg drop-shadow-md">
                        {setup.asset.toUpperCase()}
                      </div>
                      <div className={`font-bold ${setup.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'} drop-shadow-md`}>
                        {setup.pnl >= 0 ? '+' : ''}{formatMoney(setup.pnl)}
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                      <span>{dateDisplay}</span>
                      {setup.tag && (
                        <span className="flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
                          {setup.tag}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {setup.notes || <span className="italic text-slate-400 dark:text-slate-600">Tanpa catatan setup...</span>}
                    </p>
                    
                    <div className="pt-2 flex items-center text-blue-500 dark:text-blue-400 text-xs font-semibold uppercase tracking-wide group-hover:translate-x-1 transition-transform">
                      Lihat Setup <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TradeDrawer 
        trade={selectedTrade} 
        isOpen={!!selectedTrade} 
        onClose={() => setSelectedTrade(null)} 
        onUpdate={(updatedData) => {
          updateEntry(updatedData);
          setSelectedTrade(updatedData);
        }}
      />
    </>
  );
}

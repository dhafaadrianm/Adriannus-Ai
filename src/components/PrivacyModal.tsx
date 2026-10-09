import React from 'react';
import { X, ShieldCheck, Lock, FileText, CheckCircle2 } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#1a1a1e]/95 backdrop-blur-2xl p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-[#0071e3] dark:text-[#2997ff] flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                Kebijakan Privasi & Ketentuan
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                PT DHAFA TETAP BERUSAHA
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="overflow-y-auto py-4 space-y-4 text-xs sm:text-[13px] leading-relaxed text-slate-600 dark:text-zinc-300 pr-1">
          <section className="space-y-1.5">
            <h4 className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center space-x-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
              <span>1. Pengantar & Komitmen Layanan</span>
            </h4>
            <p>
              Kebijakan Privasi ini mengatur bagaimana <strong>Adriannus AI</strong> yang dikembangkan oleh{' '}
              <strong>PT DHAFA TETAP BERUSAHA</strong> mengelola serta melindungi data interaksi pengguna secara transparan, aman, dan mematuhi undang-undang Republik Indonesia.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center space-x-1.5">
              <Lock className="h-3.5 w-3.5 text-blue-500" />
              <span>2. Penyimpanan Histori Lokal</span>
            </h4>
            <p>
              Riwayat obrolan Anda disimpan secara aman pada memori lokal peramban Anda (<em>local storage</em>). Anda memiliki kendali penuh untuk mengekspor, mengubah nama, atau menghapus riwayat obrolan kapan saja tanpa jejak tersisa.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center space-x-1.5">
              <FileText className="h-3.5 w-3.5 text-blue-500" />
              <span>3. Ekosistem & Hak Kekayaan Intelektual</span>
            </h4>
            <p>
              Seluruh nama merek, entitas, dan produk di bawah ekosistem PT DHAFA TETAP BERUSAHA, termasuk kanal media <strong>REXEL ID</strong> (YouTube 200k+ subscribers) dan manufaktur teknologi <strong>Arata Manufacturing</strong> (3D Printing & Laser Engraving) dilindungi oleh hak cipta dan hukum yang berlaku.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center space-x-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
              <span>4. Batasan Tanggung Jawab AI</span>
            </h4>
            <p className="italic text-slate-500 dark:text-zinc-400">
              Adriannus adalah kecerdasan buatan dan dapat membuat kesalahan dalam menghasilkan informasi. Selalu verifikasi fakta krusial untuk keperluan hukum, medis, atau finansial.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-black/5 dark:border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-full bg-slate-900 dark:bg-white text-white dark:text-black px-5 py-2 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};

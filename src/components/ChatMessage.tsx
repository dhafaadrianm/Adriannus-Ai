import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileText,
  FileCode,
  Volume2,
  VolumeX,
  Sparkles,
  Maximize2,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import { Message } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { exportSingleMessage, downloadText } from '../utils/exportUtils';

interface ChatMessageProps {
  message: Message;
  onToast: (text: string) => void;
  onImageClick?: (url: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onToast,
  onImageClick,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    onToast('Teks berhasil disalin ke clipboard');
    setTimeout(() => setCopied(false), 2200);
  };

  const handleDownload = (format: 'md' | 'txt') => {
    exportSingleMessage(message, format);
    setShowDownloadMenu(false);
    onToast(`Berkas tanggapan .${format} telah diunduh`);
  };

  const handleDownloadImage = () => {
    if (!message.imageUrl) return;
    const a = document.createElement('a');
    a.href = message.imageUrl;
    a.download = `adriannus-ai-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onToast('Gambar berhasil diunduh');
  };

  const handleToggleAudio = () => {
    if (!('speechSynthesis' in window)) {
      onToast('Fitur suara tidak didukung di peramban ini');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = message.content
      .replace(/```[\s\S]*?```/g, 'bagian kode terlampir')
      .replace(/[*#`_\-]/g, '')
      .replace(/— Adriannus adalah AI[\s\S]*/, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'id-ID';
    utterance.rate = 1.0;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  if (isUser) {
    return (
      <div className="flex justify-end w-full group transition-all">
        <div className="relative max-w-[85%] sm:max-w-[75%] rounded-3xl rounded-tr-md bg-gradient-to-b from-[#0071e3] to-[#0062c4] text-white px-5 py-3.5 shadow-md shadow-blue-900/10 dark:shadow-black/40">
          {/* User uploaded image preview if any */}
          {message.imageUrl && (
            <div className="mb-2.5 overflow-hidden rounded-2xl border border-white/20 bg-black/10">
              <img
                src={message.imageUrl}
                alt="Lampiran pengguna"
                className="max-h-64 w-auto object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => onImageClick?.(message.imageUrl!)}
              />
            </div>
          )}

          {message.content && (
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-normal selection:bg-white/30">
              {message.content}
            </p>
          )}

          <div className="mt-1 flex items-center justify-between text-[11px] text-blue-100/70 pt-0.5">
            <span>
              {new Date(message.timestamp).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 hover:text-white"
              title="Salin pesan"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-200" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full transition-all">
      <div className="apple-card relative rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:border-black/10 dark:hover:border-white/15">
        {/* Assistant Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center space-x-2.5">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#42a5f5] flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[13px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
                  Adriannus AI
                </span>
                <span className="inline-block rounded-full bg-blue-500/10 px-1.5 py-0.2 text-[10px] font-medium text-[#0071e3] dark:text-[#2997ff]">
                  PT DHAFA TETAP BERUSAHA
                </span>
              </div>
            </div>
          </div>

          <span className="text-[11px] text-slate-400 dark:text-zinc-500">
            {new Date(message.timestamp).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Generated Image Showcase if message contains AI generated image */}
        {message.imageUrl && message.isGeneratedImage && (
          <div className="my-3 overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-slate-950 shadow-lg relative group">
            <img
              src={message.imageUrl}
              alt={message.imagePrompt || 'Gambar buatan Adriannus AI'}
              className="w-full max-h-[460px] object-contain rounded-2xl bg-black/40 cursor-pointer"
              onClick={() => onImageClick?.(message.imageUrl!)}
            />

            {/* Overlay quick actions */}
            <div className="absolute top-3 right-3 flex items-center space-x-1.5 opacity-90 transition-opacity">
              <button
                onClick={handleDownloadImage}
                className="flex items-center space-x-1 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-white shadow-md transition-all active:scale-95"
                title="Unduh gambar resolusi tinggi"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Unduh Gambar</span>
              </button>
              <button
                onClick={() => onImageClick?.(message.imageUrl!)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white transition-all"
                title="Perbesar gambar"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {message.imagePrompt && (
              <div className="p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent absolute bottom-0 inset-x-0 text-white text-xs">
                <span className="text-zinc-300">Prompt: </span>
                <span className="font-medium text-white">{message.imagePrompt}</span>
              </div>
            )}
          </div>
        )}

        {/* Message Body */}
        <div className="pt-3.5 pb-2">
          <MarkdownRenderer content={message.content} />
        </div>

        {/* Apple-style Action Toolbar */}
        <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-black/5 dark:border-white/5">
          <div className="flex items-center space-x-1 sm:space-x-1.5">
            {/* Apple Copy Button */}
            <button
              onClick={handleCopy}
              className={`flex items-center space-x-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
                copied
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 dark:text-zinc-300'
              }`}
              title="Salin tanggapan"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
                  <span>Salin</span>
                </>
              )}
            </button>

            {/* Apple Download Button with Popover */}
            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="flex items-center space-x-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 transition-all active:scale-95"
                title="Unduh tanggapan"
              >
                <Download className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
                <span>Unduh</span>
              </button>

              {/* Download Popover Menu */}
              {showDownloadMenu && (
                <div
                  className="absolute left-0 bottom-full mb-2 w-48 rounded-2xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#202024]/95 backdrop-blur-xl p-1.5 shadow-xl z-20 animate-in fade-in zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleDownload('md')}
                    className="flex w-full items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  >
                    <FileCode className="h-4 w-4 text-blue-500" />
                    <div className="text-left">
                      <div>Markdown (.md)</div>
                      <div className="text-[10px] text-slate-400 dark:text-zinc-500">Format rapi & teks</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleDownload('txt')}
                    className="flex w-full items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-emerald-500" />
                    <div className="text-left">
                      <div>Teks Polos (.txt)</div>
                      <div className="text-[10px] text-slate-400 dark:text-zinc-500">Mudah dibuka di mana saja</div>
                    </div>
                  </button>

                  {message.imageUrl && (
                    <button
                      onClick={() => {
                        handleDownloadImage();
                        setShowDownloadMenu(false);
                      }}
                      className="flex w-full items-center space-x-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors border-t border-black/5 dark:border-white/5 mt-1 pt-1.5"
                    >
                      <ImageIcon className="h-4 w-4 text-purple-500" />
                      <div className="text-left">
                        <div>Berkas Gambar (.png)</div>
                        <div className="text-[10px] text-slate-400 dark:text-zinc-500">Simpan gambar asli</div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Read Aloud Button */}
            <button
              onClick={handleToggleAudio}
              className={`flex items-center space-x-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-95 ${
                isPlayingAudio
                  ? 'bg-blue-50 text-[#0071e3] dark:bg-blue-950/40 dark:text-[#2997ff]'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 dark:text-zinc-300'
              }`}
              title={isPlayingAudio ? 'Hentikan pembacaan suara' : 'Dengarkan tanggapan'}
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="h-3.5 w-3.5 text-[#0071e3]" />
                  <span>Berhenti</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
                  <span>Dengar</span>
                </>
              )}
            </button>
          </div>

          <div className="text-[11px] text-slate-400 dark:text-zinc-500 italic">
            PT DHAFA TETAP BERUSAHA
          </div>
        </div>
      </div>
    </div>
  );
};

import { ChatSession, Message } from '../types';

export function downloadText(filename: string, content: string, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function formatMessageForExport(message: Message): string {
  const author = message.role === 'user' ? 'Anda' : 'Adriannus AI (PT DHAFA TETAP BERUSAHA)';
  const dateStr = new Date(message.timestamp).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  return `### ${author} [${dateStr}]\n\n${message.content}\n\n---\n`;
}

export function exportSessionToMarkdown(session: ChatSession): string {
  const dateStr = new Date(session.createdAt).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let output = `# ${session.title}\n`;
  output += `*Percakapan dengan Adriannus AI - PT DHAFA TETAP BERUSAHA*\n`;
  output += `*Tanggal: ${dateStr}*\n\n`;
  output += `---\n\n`;

  session.messages.forEach((msg) => {
    output += formatMessageForExport(msg);
  });

  output += `\n*Dokumen diekspor secara otomatis melalui Adriannus AI.*\n`;
  return output;
}

export function exportSingleMessage(message: Message, type: 'md' | 'txt') {
  const dateStr = new Date(message.timestamp).toISOString().split('T')[0];
  const filename = `adriannus-ai-tanggapan-${dateStr}.${type}`;
  
  if (type === 'md') {
    const formatted = `# Tanggapan Adriannus AI\n*PT DHAFA TETAP BERUSAHA*\n*Waktu: ${new Date(message.timestamp).toLocaleString('id-ID')}*\n\n${message.content}\n\n---\n*Adriannus adalah AI, mungkin bisa membuat kesalahan.*`;
    downloadText(filename, formatted, 'text/markdown;charset=utf-8');
  } else {
    downloadText(filename, message.content, 'text/plain;charset=utf-8');
  }
}

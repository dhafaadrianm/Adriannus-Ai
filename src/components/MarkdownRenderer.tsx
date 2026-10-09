import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Split content by code blocks ```
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 leading-relaxed text-[15px] text-slate-800 dark:text-zinc-200">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          return <CodeBlock key={index} rawCodeBlock={part} />;
        }
        return <FormattedParagraphs key={index} text={part} />;
      })}
    </div>
  );
};

interface CodeBlockProps {
  rawCodeBlock: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ rawCodeBlock }) => {
  const [copied, setCopied] = useState(false);

  // Extract language and code body
  const lines = rawCodeBlock.slice(3, -3).trim().split('\n');
  let language = 'code';
  let code = '';

  if (lines.length > 0 && !lines[0].includes(' ') && lines[0].length < 20 && lines.length > 1) {
    language = lines[0].trim();
    code = lines.slice(1).join('\n');
  } else {
    code = lines.join('\n');
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-black/10 dark:border-white/10 bg-[#1e1e24] shadow-md dark:shadow-2xl">
      {/* macOS Traffic Lights Header */}
      <div className="flex items-center justify-between border-b border-white/5 bg-[#18181d] px-4 py-2.5">
        <div className="flex items-center space-x-2">
          <span className="h-3 w-3 rounded-full bg-[#ff5f56]/90 shadow-sm transition-transform hover:scale-110" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd2e]/90 shadow-sm transition-transform hover:scale-110" />
          <span className="h-3 w-3 rounded-full bg-[#27c93f]/90 shadow-sm transition-transform hover:scale-110" />
          <span className="ml-3 text-xs font-mono font-medium tracking-wide text-zinc-400">
            {language}
          </span>
        </div>

        {/* Apple-style Copy Button */}
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white active:scale-95"
          title="Salin kode ini"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Tersalin!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-zinc-400" />
              <span>Salin</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <pre className="overflow-x-auto p-4 text-[13px] font-mono leading-relaxed text-zinc-200 selection:bg-blue-500/30">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const FormattedParagraphs: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  const paragraphs = text.split('\n\n');

  return (
    <>
      {paragraphs.map((p, idx) => {
        const trimmed = p.trim();
        if (!trimmed) return null;

        // Check if paragraph is a bullet list
        if (trimmed.split('\n').every((line) => line.trim().startsWith('- ') || line.trim().startsWith('* '))) {
          const listItems = trimmed.split('\n').map((l) => l.trim().replace(/^[-*]\s+/, ''));
          return (
            <ul key={idx} className="my-2 space-y-1.5 pl-5 list-disc marker:text-blue-500">
              {listItems.map((item, itemIdx) => (
                <li key={itemIdx} className="pl-1">
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ul>
          );
        }

        // Check for numbered list
        if (trimmed.split('\n').every((line) => /^\d+\.\s+/.test(line.trim()))) {
          const listItems = trimmed.split('\n').map((l) => l.trim().replace(/^\d+\.\s+/, ''));
          return (
            <ol key={idx} className="my-2 space-y-1.5 pl-5 list-decimal marker:text-blue-500 font-normal">
              {listItems.map((item, itemIdx) => (
                <li key={itemIdx} className="pl-1">
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ol>
          );
        }

        // Check for Headers
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="pt-2 text-base font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
              {renderInlineMarkdown(trimmed.replace('### ', ''))}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={idx} className="pt-3 text-lg font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
              {renderInlineMarkdown(trimmed.replace('## ', ''))}
            </h2>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={idx} className="pt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
              {renderInlineMarkdown(trimmed.replace('# ', ''))}
            </h1>
          );
        }

        // Check for footer note
        if (trimmed.startsWith('— Adrianus adalah AI')) {
          return (
            <div
              key={idx}
              className="mt-4 pt-2 border-t border-black/5 dark:border-white/5 text-xs text-slate-400 dark:text-zinc-500 italic font-normal"
            >
              {trimmed}
            </div>
          );
        }

        // Single paragraph with line breaks
        const lines = trimmed.split('\n');
        return (
          <p key={idx} className="leading-relaxed">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {renderInlineMarkdown(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
};

// Helper for bold, links, inline code
function renderInlineMarkdown(str: string): React.ReactNode {
  // Regex for inline code `code`, bold **text**, and markdown links [text](url)
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s]+)/g;
  const tokens = str.split(regex);

  return tokens.map((token, i) => {
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code
          key={i}
          className="mx-1 rounded-md border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[13px] text-pink-600 dark:text-pink-400"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('**') && token.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-slate-900 dark:text-zinc-100">
          {token.slice(2, -2)}
        </strong>
      );
    }
    const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#0071e3] hover:underline dark:text-[#2997ff]"
        >
          {linkMatch[1]}
        </a>
      );
    }
    if (token.startsWith('http://') || token.startsWith('https://')) {
      return (
        <a
          key={i}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#0071e3] hover:underline dark:text-[#2997ff]"
        >
          {token}
        </a>
      );
    }
    return token;
  });
}

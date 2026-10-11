import React, { useState } from 'react';

/**
 * Interactive Spoiler component that reveals on click
 */
export const TelegramSpoiler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [revealed, setRevealed] = useState(false);

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        setRevealed((prev) => !prev);
      }}
      title={revealed ? 'Скрыть спойлер' : 'Нажмите, чтобы показать спойлер'}
      className={`inline cursor-pointer rounded px-1.5 py-0.5 transition-all duration-200 select-none ${
        revealed
          ? 'bg-white/10 text-white shadow-sm'
          : 'bg-zinc-800 text-transparent hover:bg-zinc-700 selection:bg-transparent backdrop-blur-sm ring-1 ring-white/10'
      }`}
    >
      {children}
    </span>
  );
};

/**
 * Normalizes URL: prepends https:// if missing
 */
export function normalizeHref(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^t\.me\//i.test(trimmed)) return `https://${trimmed}`;
  return `https://${trimmed}`;
}

/**
 * Parses inline Telegram entities:
 * - Spoilers: ||text||
 * - Bold: **text** or <b>text</b>
 * - Italic: *text* or _text_ or <i>text</i>
 * - Strikethrough: ~~text~~ or <s>text</s>
 * - Code: `code` or <code>code</code>
 * - Tags: #tag@channel or #tag
 * - Mentions: @username
 * - Custom link syntax: text(domain.tld) or text(https://...)
 * - Markdown links: [text](url)
 * - Raw URLs: https://...
 */
export function parseInlineTelegram(text: string, onTagClick?: (tag: string) => void): React.ReactNode[] {
  if (!text) return [];

  // Unified Tokenizer Regex
  // 1. Spoilers: \|\|(.+?)\|\|
  // 2. Bold: \*\*(.+?)\*\* | <b>(.+?)<\/b> | <strong>(.+?)<\/strong>
  // 3. Strikethrough: ~~(.+?)~~ | <s>(.+?)<\/s> | <strike>(.+?)<\/strike>
  // 4. Code: `([^`]+)` | <code>(.+?)<\/code>
  // 5. Italic: \*([^*]+)\* | _([^_]+)_ | <i>(.+?)<\/i> | <em>(.+?)<\/em>
  // 6. Markdown link: \[([^\]]+)\]\(([^)]+)\)
  // 7. Custom telegram user link: ([\wА-Яа-яЁё0-9_\-\s]{1,40})\(((?:https?:\/\/|t\.me\/|[a-zA-Z0-9\-]+\.[a-zA-Z]{2,})[^\s)]*)\)
  // 8. Raw URL: (https?:\/\/[^\s<>"']+)
  // 9. Hashtag: #([a-zA-Z0-9_\u0400-\u04FF]+(?:@[a-zA-Z0-9_]+)?)
  // 10. Mention: @([a-zA-Z0-9_]{3,32})
  const masterRegex =
    /(\|\|[\s\S]+?\|\|)|(?:\*\*(.+?)\*\*|<b>([\s\S]+?)<\/b>|<strong>([\s\S]+?)<\/strong>)|(?:~~(.+?)~~|<s>([\s\S]+?)<\/s>|<strike>([\s\S]+?)<\/strike>)|(?:`([^`]+)`|<code>([\s\S]+?)<\/code>)|(?:\*([^*]+)\*|_([^_]+)_|<i>([\s\S]+?)<\/i>|<em>([\s\S]+?)<\/em>)|(?:\[([^\]]+)\]\(([^)]+)\))|(?:([a-zA-Z0-9_\u0400-\u04FF]{1,40})\(((?:https?:\/\/|t\.me\/|[a-zA-Z0-9\-]+\.[a-zA-Z]{2,})[^\s)]*)\))|(https?:\/\/[^\s<>"']+)|(?:#([a-zA-Z0-9_\u0400-\u04FF]+(?:@[a-zA-Z0-9_]+)?))|(?:@([a-zA-Z0-9_]{3,32}))/gi;

  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = masterRegex.exec(text)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      result.push(text.substring(lastIndex, matchIndex));
    }

    const [
      full,
      spoiler,
      bold1, bold2, bold3,
      strike1, strike2, strike3,
      code1, code2,
      italic1, italic2, italic3, italic4,
      mdText, mdUrl,
      customText, customUrl,
      rawUrl,
      hashTag,
      mention
    ] = match;

    const key = `t_${matchIndex}_${full.slice(0, 8)}`;

    if (spoiler) {
      const inner = spoiler.slice(2, -2);
      result.push(
        <TelegramSpoiler key={key}>
          {parseInlineTelegram(inner, onTagClick)}
        </TelegramSpoiler>
      );
    } else if (bold1 || bold2 || bold3) {
      const content = bold1 || bold2 || bold3;
      result.push(
        <strong key={key} className="font-bold text-white">
          {parseInlineTelegram(content, onTagClick)}
        </strong>
      );
    } else if (strike1 || strike2 || strike3) {
      const content = strike1 || strike2 || strike3;
      result.push(
        <span key={key} className="line-through text-zinc-400">
          {parseInlineTelegram(content, onTagClick)}
        </span>
      );
    } else if (code1 || code2) {
      const content = code1 || code2;
      result.push(
        <code
          key={key}
          className="font-mono text-[11px] sm:text-xs px-1.5 py-0.5 rounded bg-black/60 text-[#ff7a1a] border border-white/10"
        >
          {content}
        </code>
      );
    } else if (italic1 || italic2 || italic3 || italic4) {
      const content = italic1 || italic2 || italic3 || italic4;
      result.push(
        <em key={key} className="italic text-zinc-200">
          {parseInlineTelegram(content, onTagClick)}
        </em>
      );
    } else if (mdText && mdUrl) {
      result.push(
        <a
          key={key}
          href={normalizeHref(mdUrl)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[#ff5c00] hover:text-[#ff7a1a] underline underline-offset-2 font-medium transition-colors"
        >
          {mdText}
        </a>
      );
    } else if (customText && customUrl) {
      // User requested: пенис(ph.ru) or слово(domain)
      result.push(
        <a
          key={key}
          href={normalizeHref(customUrl)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[#ff5c00] hover:text-[#ff7a1a] underline underline-offset-2 font-semibold transition-colors"
          title={`Ссылка: ${customUrl}`}
        >
          {customText}
        </a>
      );
    } else if (rawUrl) {
      result.push(
        <a
          key={key}
          href={rawUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[#ff5c00] hover:text-[#00E575] hover:underline underline-offset-2 break-all font-medium transition-colors"
        >
          {rawUrl}
        </a>
      );
    } else if (hashTag) {
      result.push(
        <span
          key={key}
          onClick={(e) => {
            e.stopPropagation();
            if (onTagClick) onTagClick(hashTag);
          }}
          className="inline-flex items-center text-[#ff5c00] hover:text-[#ff8533] hover:underline font-semibold cursor-pointer transition-colors"
        >
          #{hashTag}
        </span>
      );
    } else if (mention) {
      const isOfmediaOrChat =
        mention.toLowerCase() === 'ofmedi' ||
        mention.toLowerCase() === 'chanel9of' ||
        mention.toLowerCase() === 'ofmedia';

      result.push(
        <a
          key={key}
          href={isOfmediaOrChat ? '/telegram' : `https://t.me/${mention}`}
          target={isOfmediaOrChat ? '_self' : '_blank'}
          rel="noopener noreferrer"
          onClick={(e) => {
            if (isOfmediaOrChat) {
              e.preventDefault();
              window.location.href = '/telegram';
            } else {
              e.stopPropagation();
            }
          }}
          className="inline-flex items-center text-[#00E575] hover:text-[#10B981] font-medium hover:underline transition-colors"
        >
          @{mention}
        </a>
      );
    } else {
      result.push(full);
    }

    lastIndex = masterRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex));
  }

  return result;
}

/**
 * Checks if line is a Telegram or Markdown quote:
 * - Starts with ▌ (U+258C Left Half Block)
 * - Starts with > (standard markdown)
 * - Starts with ▎, ▍, |, »
 */
export function isQuoteLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('▌') ||
    trimmed.startsWith('>') ||
    trimmed.startsWith('▎') ||
    trimmed.startsWith('▍') ||
    trimmed.startsWith('»')
  );
}

/**
 * Strips the quote prefix character from the line
 */
export function stripQuotePrefix(line: string): string {
  const trimmed = line.trim();
  return trimmed
    .replace(/^(?:▌|>|▎|▍|»)\s*/, '')
    .trim();
}

/**
 * Detects if a URL or text is a video file or video provider
 */
export function extractVideoUrls(text: string): string[] {
  if (!text) return [];
  const videoRegex = /(https?:\/\/[^\s<>"']+\.(?:mp4|webm|mov|m4v)(?:\?[^\s<>"']*)?)/gi;
  const matches = text.match(videoRegex);
  return matches ? Array.from(new Set(matches)) : [];
}

/**
 * Full Telegram Text Block Renderer with support for:
 * - Quotes (▌ and >) grouped into blocks
 * - Inline Telegram formatting
 * - Image embeds
 * - Cut tag ([cut]) with expand/collapse
 */
export const TelegramRichText: React.FC<{
  content: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  hasCut?: boolean;
  onTagClick?: (tag: string) => void;
}> = ({ content, isExpanded = false, onToggleExpand, hasCut = false, onTagClick }) => {
  if (!content) return null;

  let textToRender = content;
  if (hasCut && !isExpanded) {
    textToRender = content.split('[cut]')[0].trim();
  } else if (hasCut) {
    textToRender = content.replace('[cut]', '\n\n');
  }

  const rawLines = textToRender.split('\n');

  // Group consecutive quote lines together
  interface Block {
    type: 'quote' | 'paragraph' | 'image';
    lines: string[];
    imgAlt?: string;
    imgUrl?: string;
  }

  const blocks: Block[] = [];
  let currentQuote: string[] = [];

  for (const line of rawLines) {
    const trimmed = line.trim();

    // Image: ![alt](url)
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      if (currentQuote.length > 0) {
        blocks.push({ type: 'quote', lines: currentQuote });
        currentQuote = [];
      }
      blocks.push({ type: 'image', lines: [], imgAlt: imgMatch[1], imgUrl: imgMatch[2] });
      continue;
    }

    if (isQuoteLine(trimmed)) {
      currentQuote.push(stripQuotePrefix(trimmed));
    } else {
      if (currentQuote.length > 0) {
        blocks.push({ type: 'quote', lines: currentQuote });
        currentQuote = [];
      }
      blocks.push({ type: 'paragraph', lines: [line] });
    }
  }

  if (currentQuote.length > 0) {
    blocks.push({ type: 'quote', lines: currentQuote });
  }

  return (
    <div className="space-y-2 text-xs sm:text-sm text-zinc-300 font-normal leading-relaxed select-text">
      {blocks.map((block, bIdx) => {
        if (block.type === 'quote') {
          return (
            <blockquote
              key={bIdx}
              className="border-l-3 border-[#ff5c00] bg-white/[0.04] pl-3.5 pr-3 py-2 my-2 rounded-r-2xl text-zinc-200 italic space-y-1 backdrop-blur-sm shadow-sm"
            >
              {block.lines.map((qLine, qIdx) => (
                <p key={qIdx} className="leading-relaxed">
                  {parseInlineTelegram(qLine, onTagClick)}
                </p>
              ))}
            </blockquote>
          );
        }

        if (block.type === 'image' && block.imgUrl) {
          return (
            <div
              key={bIdx}
              className="my-2 rounded-2xl overflow-hidden border border-white/10 max-h-80 aspect-video bg-black/40"
            >
              <img
                src={block.imgUrl}
                alt={block.imgAlt || ''}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          );
        }

        // Paragraph
        const line = block.lines[0];
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={bIdx} className="h-1.5" />;
        }

        return (
          <p key={bIdx} className="break-words">
            {parseInlineTelegram(line, onTagClick)}
          </p>
        );
      })}

      {hasCut && onToggleExpand && (
        <button
          type="button"
          onClick={onToggleExpand}
          className="inline-flex items-center gap-1.5 mt-2 text-xs font-heading font-bold text-[#ff5c00] hover:text-[#ff8533] transition-colors cursor-pointer"
        >
          <span>{isExpanded ? 'Свернуть' : 'Читать полностью'}</span>
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
};

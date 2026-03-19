'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const BG_COLORS = [
  { label: 'None',       value: 'transparent' },
  { label: 'Dark',       value: '#1a1a2e' },
  { label: 'Violet',     value: 'rgba(139,92,246,0.3)' },
  { label: 'Blue',       value: 'rgba(96,165,250,0.3)' },
  { label: 'Green',      value: 'rgba(74,222,128,0.3)' },
  { label: 'Yellow',     value: 'rgba(251,191,36,0.3)' },
  { label: 'Orange',     value: 'rgba(251,146,60,0.3)' },
  { label: 'Red',        value: 'rgba(248,113,113,0.3)' },
  { label: 'Pink',       value: 'rgba(244,114,182,0.3)' },
  { label: 'Gray',       value: 'rgba(156,163,175,0.2)' },
];

const FONT_COLORS = [
  { label: 'White',   value: '#ffffff' },
  { label: 'Gray',    value: '#9ca3af' },
  { label: 'Violet',  value: '#a78bfa' },
  { label: 'Blue',    value: '#60a5fa' },
  { label: 'Cyan',    value: '#22d3ee' },
  { label: 'Green',   value: '#4ade80' },
  { label: 'Yellow',  value: '#fbbf24' },
  { label: 'Orange',  value: '#fb923c' },
  { label: 'Red',     value: '#f87171' },
  { label: 'Pink',    value: '#f472b6' },
];

const EMOJI_LIST = [
  '💪','🏋️','🧘','🤸','🏃','🚴','🏊','⚡','🔥','✅',
  '❌','⭐','🎯','🏆','💡','📝','📌','🎉','👍','❤️',
  '🌿','🥗','🥩','💧','😊','🤔','💬','📊','🔑','⚠️',
];

const FONT_SIZES = ['14px', '16px', '18px', '20px', '24px', '28px', '32px'];

export default function RichEditor({ value, onChange, placeholder = 'Write your content here...', minHeight = 400 }: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColor, setShowBgColor] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
  const savedSelection = useRef<Range | null>(null);
  const [formatting, setFormatting] = useState(false);
  const isInitialized = useRef(false);

  // Initialize content once
  useEffect(() => {
    if (editorRef.current && !isInitialized.current) {
      isInitialized.current = true;
      if (value) {
        // Convert plain text to HTML if needed
        if (!value.includes('<')) {
          editorRef.current.innerHTML = value.split('\n').map(l => l ? `<p>${l}</p>` : '<p><br></p>').join('');
        } else {
          editorRef.current.innerHTML = value;
        }
      }
    }
  }, []);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelection.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    if (savedSelection.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedSelection.current);
      editorRef.current?.focus();
    }
  };

  const exec = useCallback((command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    onChange(editorRef.current?.innerHTML || '');
    updateActiveFormats();
  }, [onChange]);

  const updateActiveFormats = () => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
    });
  };

  const insertEmoji = (emoji: string) => {
    restoreSelection();
    exec('insertText', emoji);
    setShowEmoji(false);
  };

  const setBgColor = (color: string) => {
    restoreSelection();
    if (color === 'transparent') {
      exec('removeFormat');
    } else {
      exec('hiliteColor', color);
    }
    setShowBgColor(false);
  };

  const setColor = (color: string) => {
    restoreSelection();
    exec('foreColor', color);
    setShowColorPicker(false);
  };

  const setFontSize = (size: string) => {
    restoreSelection();
    // Use a span wrapper for precise font size
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = size;
      range.surroundContents(span);
      onChange(editorRef.current?.innerHTML || '');
    }
    setShowFontSize(false);
  };

  const insertHeading = (level: number) => {
    editorRef.current?.focus();
    document.execCommand('formatBlock', false, `h${level}`);
    onChange(editorRef.current?.innerHTML || '');
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) exec('createLink', url);
  };

  const insertHr = () => {
    restoreSelection();
    exec('insertHTML', '<hr style="border:none;border-top:1px solid rgba(139,92,246,0.4);margin:16px 0;"><p><br></p>');
  };

  const [showAiMenu, setShowAiMenu] = useState(false);
  const [aiMode, setAiMode] = useState('');

  const AI_MODES = [
    { id: 'format',    icon: '✨', label: 'Format & Structure',  desc: 'Clean headings, paragraphs, lists' },
    { id: 'improve',   icon: '🚀', label: 'Improve Writing',     desc: 'Better flow, clarity, engagement' },
    { id: 'shorten',   icon: '✂️', label: 'Make Concise',        desc: 'Remove fluff, tighten sentences' },
    { id: 'expand',    icon: '📝', label: 'Expand Content',      desc: 'Add depth, examples, detail' },
    { id: 'seo',       icon: '🔍', label: 'SEO Optimize',        desc: 'Better keywords and readability' },
    { id: 'tone_pro',  icon: '👔', label: 'Professional Tone',   desc: 'More authoritative and polished' },
    { id: 'tone_fun',  icon: '😊', label: 'Friendly Tone',       desc: 'More conversational and relatable' },
    { id: 'fitness',   icon: '💪', label: 'Fitness Expert',      desc: 'Add fitness expertise & tips' },
  ];

  const PROMPTS: Record<string, string> = {
    format: `You are a professional blog editor. Reformat this blog content into clean, well-structured HTML.
Rules: Use <h2> for sections, <h3> for sub-sections, <p> for paragraphs, <ul><li> for bullets, <ol><li> for steps, <strong> for key terms, <blockquote> for key takeaways. Add intro and conclusion if missing. Keep ALL original information. Return ONLY HTML, no markdown, no code fences.`,

    improve: `You are an expert content writer. Improve this blog post to be more engaging, clear, and compelling.
Rules: Fix awkward sentences, improve flow between paragraphs, make the opening hook stronger, strengthen the conclusion, use active voice, vary sentence length. Keep all facts. Use proper HTML tags (<h2>, <h3>, <p>, <ul>, <strong>, <blockquote>). Return ONLY HTML.`,

    shorten: `You are a content editor. Make this blog post more concise and punchy without losing key information.
Rules: Cut filler words and redundant sentences, combine short choppy sentences, remove repetition, keep all key facts and examples. Use proper HTML tags. Return ONLY HTML, no markdown.`,

    expand: `You are a fitness and wellness content expert. Expand this blog post with more depth and value.
Rules: Add relevant examples, statistics, or practical tips, expand thin sections, add a FAQ section if appropriate, add actionable takeaways. Use proper HTML tags (<h2>, <h3>, <p>, <ul>, <blockquote>). Keep all original content. Return ONLY HTML.`,

    seo: `You are an SEO content specialist. Optimize this blog post for search engines and readability.
Rules: Add keyword-rich headings, improve meta-level structure, add transition phrases, ensure good header hierarchy (H2 > H3), break up long paragraphs, add a clear conclusion with call to action. Use proper HTML tags. Return ONLY HTML.`,

    tone_pro: `You are a professional editor. Rewrite this blog post in a more authoritative, professional tone.
Rules: Use confident language, add expert credibility, remove casual phrases, use precise vocabulary, maintain warmth but add authority. Keep all facts. Use proper HTML tags. Return ONLY HTML.`,

    tone_fun: `You are a friendly content writer. Rewrite this blog post in a conversational, relatable tone.
Rules: Use "you" to address the reader, add relatable analogies, use contractions, make it feel like advice from a friend, keep it engaging and warm. Keep all facts. Use proper HTML tags. Return ONLY HTML.`,

    fitness: `You are a certified fitness expert and content writer. Enhance this blog post with fitness expertise.
Rules: Add evidence-based fitness tips, mention relevant muscle groups or body systems where appropriate, add practical workout or nutrition advice, cite general research findings, add motivational elements. Keep all original content. Use proper HTML tags. Return ONLY HTML.`,
  };

  const runAI = async (mode: string) => {
    if (!editorRef.current) return;
    const rawText = editorRef.current.innerText.trim();
    if (!rawText) return;

    setAiMode(mode);
    setFormatting(true);
    setShowAiMenu(false);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: PROMPTS[mode] + '\n\nContent:\n' + rawText,
          }],
        }),
      });

      const data = await res.json();
      let html = data.content?.[0]?.text || '';
      // Strip any accidental markdown code fences
      html = html.replace(/^```html\n?/i, '').replace(/^```\n?/i, '').replace(/\n?```$/i, '').trim();

      if (html && editorRef.current) {
        editorRef.current.innerHTML = html;
        onChange(html);
      }
    } catch (err) {
      console.error('AI format failed:', err);
    } finally {
      setFormatting(false);
      setAiMode('');
    }
  };

  const clearFormat = () => exec('removeFormat');

  // Auto-format shortcuts — type trigger + Space to activate
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ') {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;

      const range = sel.getRangeAt(0);
      const node = range.startContainer;
      if (node.nodeType !== Node.TEXT_NODE) return;

      const text = node.textContent || '';
      const cursorPos = range.startOffset;
      const lineText = text.substring(0, cursorPos);

      const triggers: { pattern: RegExp; action: () => void }[] = [
        // # Heading 1
        { pattern: /^#$/, action: () => {
          (node as Text).textContent = '';
          document.execCommand('formatBlock', false, 'h1');
        }},
        // ## Heading 2
        { pattern: /^##$/, action: () => {
          (node as Text).textContent = '';
          document.execCommand('formatBlock', false, 'h2');
        }},
        // ### Heading 3
        { pattern: /^###$/, action: () => {
          (node as Text).textContent = '';
          document.execCommand('formatBlock', false, 'h3');
        }},
        // - or * for bullet list
        { pattern: /^[-*]$/, action: () => {
          (node as Text).textContent = '';
          document.execCommand('insertUnorderedList', false);
        }},
        // 1. for numbered list
        { pattern: /^1\.$/, action: () => {
          (node as Text).textContent = '';
          document.execCommand('insertOrderedList', false);
        }},
        // > for blockquote
        { pattern: /^>$/, action: () => {
          (node as Text).textContent = '';
          document.execCommand('formatBlock', false, 'blockquote');
        }},
        // --- for divider
        { pattern: /^---$/, action: () => {
          (node as Text).textContent = '';
          document.execCommand('insertHTML', false, '<hr style="border:none;border-top:1px solid rgba(139,92,246,0.4);margin:16px 0;"><p><br></p>');
          e.preventDefault();
          onChange(editorRef.current?.innerHTML || '');
          return;
        }},
        // **text for bold toggle hint
        { pattern: /^\*\*$/, action: () => {
          (node as Text).textContent = '';
          document.execCommand('bold', false);
        }},
        // ` for inline code style
        { pattern: /^`$/, action: () => {
          (node as Text).textContent = '';
          document.execCommand('insertHTML', false, '<code style="background:rgba(139,92,246,0.15);padding:2px 6px;border-radius:4px;font-family:monospace;color:#a78bfa;"></code>');
          e.preventDefault();
          onChange(editorRef.current?.innerHTML || '');
          return;
        }},
      ];

      for (const { pattern, action } of triggers) {
        if (pattern.test(lineText.trim())) {
          e.preventDefault();
          action();
          onChange(editorRef.current?.innerHTML || '');
          return;
        }
      }
    }

    // Enter after --- typed alone should insert HR
    if (e.key === 'Enter') {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const node = sel.getRangeAt(0).startContainer;
      if (node.textContent?.trim() === '---') {
        e.preventDefault();
        (node as Text).textContent = '';
        document.execCommand('insertHTML', false, '<hr style="border:none;border-top:1px solid rgba(139,92,246,0.4);margin:16px 0;"><p><br></p>');
        onChange(editorRef.current?.innerHTML || '');
      }
    }
  };

  const btnClass = (active?: boolean) =>
    `px-2 py-1.5 rounded text-sm transition-all ${
      active
        ? 'bg-violet-600 text-white'
        : 'text-gray-300 hover:bg-white/10 hover:text-white'
    }`;

  const divider = <div className="w-px h-5 bg-white/10 mx-0.5 self-center" />;

  return (
    <div className="rounded-xl overflow-visible" style={{ border: '1px solid rgba(139,92,246,0.3)', background: '#111118' }}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b"
        style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(139,92,246,0.2)' }}>

        {/* Headings */}
        <button type="button" onClick={() => insertHeading(1)} className={btnClass()} title="Heading 1">H1</button>
        <button type="button" onClick={() => insertHeading(2)} className={btnClass()} title="Heading 2">H2</button>
        <button type="button" onClick={() => insertHeading(3)} className={btnClass()} title="Heading 3">H3</button>
        <button type="button" onClick={() => exec('formatBlock', 'p')} className={btnClass()} title="Paragraph">¶</button>

        {divider}

        {/* Text format */}
        <button type="button" onClick={() => exec('bold')} className={btnClass(activeFormats.bold)} title="Bold"><strong>B</strong></button>
        <button type="button" onClick={() => exec('italic')} className={btnClass(activeFormats.italic)} title="Italic"><em>I</em></button>
        <button type="button" onClick={() => exec('underline')} className={btnClass(activeFormats.underline)} title="Underline"><u>U</u></button>
        <button type="button" onClick={() => exec('strikeThrough')} className={btnClass(activeFormats.strikeThrough)} title="Strikethrough"><s>S</s></button>

        {divider}

        {/* Font size */}
        <div className="relative">
          <button type="button"
            onClick={() => { saveSelection(); setShowFontSize(!showFontSize); setShowColorPicker(false); setShowEmoji(false); }}
            className={btnClass()} title="Font Size">
            Aa↕
          </button>
          {showFontSize && (
            <div className="absolute top-full left-0 z-50 mt-1 rounded-lg p-2 flex flex-col gap-1 min-w-[80px]"
              style={{ background: '#1e1e2d', border: '1px solid rgba(139,92,246,0.3)' }}>
              {FONT_SIZES.map(size => (
                <button key={size} type="button" onClick={() => setFontSize(size)}
                  className="text-left px-2 py-1 rounded hover:bg-violet-600 text-white text-sm transition-all"
                  style={{ fontSize: size }}>
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text Color picker */}
        <div className="relative">
          <button type="button"
            onClick={() => { saveSelection(); setShowColorPicker(!showColorPicker); setShowBgColor(false); setShowFontSize(false); setShowEmoji(false); }}
            className={btnClass()} title="Text Color">
            <span className="flex items-center gap-1">
              A
              <span className="w-3 h-1.5 rounded-sm inline-block" style={{ background: 'linear-gradient(90deg,#f87171,#fbbf24,#4ade80,#60a5fa,#a78bfa)' }} />
            </span>
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 z-50 mt-1 rounded-lg p-2 grid grid-cols-5 gap-1"
              style={{ background: '#1e1e2d', border: '1px solid rgba(139,92,246,0.3)' }}>
              {FONT_COLORS.map(c => (
                <button key={c.value} type="button" onClick={() => setColor(c.value)}
                  title={c.label}
                  className="w-6 h-6 rounded-full border-2 border-transparent hover:border-white transition-all"
                  style={{ background: c.value }} />
              ))}
            </div>
          )}
        </div>

        {/* Background Color picker */}
        <div className="relative">
          <button type="button"
            onClick={() => { saveSelection(); setShowBgColor(!showBgColor); setShowColorPicker(false); setShowFontSize(false); setShowEmoji(false); }}
            className={btnClass()} title="Highlight / Background Color">
            <span className="flex items-center gap-1">
              <span className="text-xs font-bold">BG</span>
              <span className="w-3 h-1.5 rounded-sm inline-block" style={{ background: 'linear-gradient(90deg,#fbbf24,#4ade80,#60a5fa,#f472b6)' }} />
            </span>
          </button>
          {showBgColor && (
            <div className="absolute top-full left-0 z-50 mt-1 rounded-lg p-2 grid grid-cols-5 gap-1"
              style={{ background: '#1e1e2d', border: '1px solid rgba(139,92,246,0.3)' }}>
              {BG_COLORS.map(c => (
                <button key={c.value} type="button" onClick={() => setBgColor(c.value)}
                  title={c.label}
                  className="w-6 h-6 rounded border-2 border-transparent hover:border-white transition-all"
                  style={{ background: c.value }} />
              ))}
            </div>
          )}
        </div>

        {divider}

        {/* Lists */}
        <button type="button" onClick={() => exec('insertUnorderedList')} className={btnClass(activeFormats.insertUnorderedList)} title="Bullet List">• —</button>
        <button type="button" onClick={() => exec('insertOrderedList')} className={btnClass(activeFormats.insertOrderedList)} title="Numbered List">1.</button>

        {divider}

        {/* Alignment */}
        <button type="button" onClick={() => exec('justifyLeft')} className={btnClass()} title="Align Left">⬅</button>
        <button type="button" onClick={() => exec('justifyCenter')} className={btnClass()} title="Center">↔</button>
        <button type="button" onClick={() => exec('justifyRight')} className={btnClass()} title="Align Right">➡</button>

        {divider}

        {/* Link, HR, Clear */}
        <button type="button" onClick={insertLink} className={btnClass()} title="Insert Link">🔗</button>
        <button type="button" onClick={insertHr} className={btnClass()} title="Divider Line">—</button>
        <button type="button" onClick={clearFormat} className={btnClass()} title="Clear Formatting">✕</button>

        {divider}

        {/* Emoji picker */}
        <div className="relative">
          <button type="button"
            onClick={() => { saveSelection(); setShowEmoji(!showEmoji); setShowColorPicker(false); setShowFontSize(false); }}
            className={btnClass()} title="Insert Emoji">
            😊
          </button>
          {showEmoji && (
            <div className="absolute top-full left-0 z-50 mt-1 rounded-lg p-2 grid grid-cols-10 gap-1"
              style={{ background: '#1e1e2d', border: '1px solid rgba(139,92,246,0.3)', minWidth: '280px' }}>
              {EMOJI_LIST.map(emoji => (
                <button key={emoji} type="button" onClick={() => insertEmoji(emoji)}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-violet-600 transition-all text-base">
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Undo/Redo */}
        <button type="button" onClick={() => exec('undo')} className={btnClass()} title="Undo">↩</button>
        <button type="button" onClick={() => exec('redo')} className={btnClass()} title="Redo">↪</button>

        {divider}

      </div>

      {/* AI Writer — full width row below toolbar */}
      <div className="relative px-2 py-2 border-b" style={{ borderColor: 'rgba(139,92,246,0.15)', background: 'rgba(139,92,246,0.04)' }}>
        <button
          type="button"
          onClick={() => { saveSelection(); setShowAiMenu(!showAiMenu); }}
          disabled={formatting}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-60 ${
            formatting ? 'bg-violet-800 text-violet-300' : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white'
          }`}
        >
          {formatting ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {AI_MODES.find(m => m.id === aiMode)?.label || 'Processing...'}
            </>
          ) : (
            <>✨ AI Writer ▾</>
          )}
        </button>

        {showAiMenu && !formatting && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowAiMenu(false)} />
            {/* Grid menu — opens downward with full width */}
            <div className="absolute left-0 right-0 z-50 mt-1 rounded-xl overflow-hidden mx-2"
              style={{ background: '#1a1a2e', border: '1px solid rgba(139,92,246,0.4)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', top: '100%' }}>
              <div className="px-4 py-2 border-b" style={{ borderColor: 'rgba(139,92,246,0.2)' }}>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">✨ AI Writing Assistant — pick a mode</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
                {AI_MODES.map(mode => (
                  <button key={mode.id} type="button"
                    onClick={() => runAI(mode.id)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-violet-600/20 transition-all text-left border-b border-r"
                    style={{ borderColor: 'rgba(139,92,246,0.1)' }}
                  >
                    <span className="text-xl flex-shrink-0">{mode.icon}</span>
                    <div>
                      <p className="text-white text-sm font-semibold leading-tight">{mode.label}</p>
                      <p className="text-gray-500 text-xs mt-0.5 leading-tight">{mode.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(editorRef.current?.innerHTML || '')}
        onKeyDown={handleKeyDown}
        onKeyUp={updateActiveFormats}
        onMouseUp={updateActiveFormats}
        onClick={() => { setShowColorPicker(false); setShowEmoji(false); setShowFontSize(false); }}
        data-placeholder={placeholder}
        className="outline-none leading-relaxed"
        style={{
          minHeight: `${minHeight}px`,
          padding: '16px',
          background: '#111118',
          color: '#e5e7eb',
          fontSize: '15px',
          lineHeight: '1.7',
          caretColor: '#a78bfa',
        }}
      />

      {/* Auto-format hints */}
      <div className="flex flex-wrap gap-3 px-3 py-1.5 text-xs border-b"
        style={{ background: 'rgba(139,92,246,0.05)', borderColor: 'rgba(139,92,246,0.15)', color: '#6b7280' }}>
        <span title="Type then Space"><kbd className="px-1 py-0.5 rounded text-xs" style={{background:'rgba(255,255,255,0.08)'}}>#</kbd> H1</span>
        <span title="Type then Space"><kbd className="px-1 py-0.5 rounded text-xs" style={{background:'rgba(255,255,255,0.08)'}}># #</kbd> H2</span>
        <span title="Type then Space"><kbd className="px-1 py-0.5 rounded text-xs" style={{background:'rgba(255,255,255,0.08)'}}>-</kbd> Bullet</span>
        <span title="Type then Space"><kbd className="px-1 py-0.5 rounded text-xs" style={{background:'rgba(255,255,255,0.08)'}}>1.</kbd> List</span>
        <span title="Type then Space"><kbd className="px-1 py-0.5 rounded text-xs" style={{background:'rgba(255,255,255,0.08)'}}>&gt;</kbd> Quote</span>
        <span title="Type then Space"><kbd className="px-1 py-0.5 rounded text-xs" style={{background:'rgba(255,255,255,0.08)'}}>---</kbd> Divider</span>
        <span title="Type then Space"><kbd className="px-1 py-0.5 rounded text-xs" style={{background:'rgba(255,255,255,0.08)'}}>`</kbd> Code</span>
      </div>

      <style>{`
        [contenteditable] { background: #111118; color: #e5e7eb; }
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #4b5563;
          pointer-events: none;
        }
        [contenteditable] h1 { font-size: 2em; font-weight: 800; color: #fff; margin: 0.5em 0; }
        [contenteditable] h2 { font-size: 1.5em; font-weight: 700; color: #fff; margin: 0.5em 0; }
        [contenteditable] h3 { font-size: 1.25em; font-weight: 600; color: #e5e7eb; margin: 0.4em 0; }
        [contenteditable] p { margin: 0.3em 0; color: #e5e7eb; }
        [contenteditable] ul { list-style: disc; padding-left: 1.5em; margin: 0.5em 0; color: #e5e7eb; }
        [contenteditable] ol { list-style: decimal; padding-left: 1.5em; margin: 0.5em 0; color: #e5e7eb; }
        [contenteditable] li { margin: 0.2em 0; }
        [contenteditable] a { color: #a78bfa; text-decoration: underline; }
        [contenteditable] hr { border: none; border-top: 1px solid rgba(139,92,246,0.4); margin: 1em 0; }
        [contenteditable] strong { color: #fff; }
        [contenteditable] blockquote { border-left: 3px solid #8b5cf6; padding-left: 1em; color: #9ca3af; margin: 0.5em 0; }
      `}</style>
    </div>
  );
}

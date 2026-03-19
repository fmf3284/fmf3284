'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

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
  const [showEmoji, setShowEmoji] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
  const savedSelection = useRef<Range | null>(null);
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

  const clearFormat = () => exec('removeFormat');

  const btnClass = (active?: boolean) =>
    `px-2 py-1.5 rounded text-sm transition-all ${
      active
        ? 'bg-violet-600 text-white'
        : 'text-gray-300 hover:bg-white/10 hover:text-white'
    }`;

  const divider = <div className="w-px h-5 bg-white/10 mx-0.5 self-center" />;

  return (
    <div className="rounded-xl overflow-visible" style={{ border: '1px solid rgba(139,92,246,0.3)' }}>
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

        {/* Color picker */}
        <div className="relative">
          <button type="button"
            onClick={() => { saveSelection(); setShowColorPicker(!showColorPicker); setShowFontSize(false); setShowEmoji(false); }}
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
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(editorRef.current?.innerHTML || '')}
        onKeyUp={updateActiveFormats}
        onMouseUp={updateActiveFormats}
        onClick={() => { setShowColorPicker(false); setShowEmoji(false); setShowFontSize(false); }}
        data-placeholder={placeholder}
        className="outline-none text-gray-200 leading-relaxed"
        style={{
          minHeight: `${minHeight}px`,
          padding: '16px',
          background: '#111118',
          fontSize: '15px',
          lineHeight: '1.7',
        }}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #4b5563;
          pointer-events: none;
        }
        [contenteditable] h1 { font-size: 2em; font-weight: 800; color: #fff; margin: 0.5em 0; }
        [contenteditable] h2 { font-size: 1.5em; font-weight: 700; color: #fff; margin: 0.5em 0; }
        [contenteditable] h3 { font-size: 1.25em; font-weight: 600; color: #e5e7eb; margin: 0.4em 0; }
        [contenteditable] p { margin: 0.3em 0; }
        [contenteditable] ul { list-style: disc; padding-left: 1.5em; margin: 0.5em 0; }
        [contenteditable] ol { list-style: decimal; padding-left: 1.5em; margin: 0.5em 0; }
        [contenteditable] li { margin: 0.2em 0; }
        [contenteditable] a { color: #a78bfa; text-decoration: underline; }
        [contenteditable] hr { border: none; border-top: 1px solid rgba(139,92,246,0.4); margin: 1em 0; }
        [contenteditable] strong { color: #fff; }
        [contenteditable] blockquote { border-left: 3px solid #8b5cf6; padding-left: 1em; color: #9ca3af; margin: 0.5em 0; }
      `}</style>
    </div>
  );
}

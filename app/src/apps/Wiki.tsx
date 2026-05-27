// ============================================================
// Wiki — Markdown-based knowledge base with categories
// ============================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Trash2, Search, BookOpen, FolderOpen, FileText,
  ChevronRight, ChevronDown, Edit3, Eye, Download, Clock,
  ArrowLeft,
} from 'lucide-react';

const generateId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

interface WikiPage {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  createdAt: number;
  updatedAt: number;
  history: { content: string; timestamp: number }[];
}

interface WikiCategory {
  id: string;
  name: string;
  parentId: string | null;
  isExpanded: boolean;
}

interface WikiState {
  pages: WikiPage[];
  categories: WikiCategory[];
}

const STORAGE_KEY = 'linuxos_wiki';

const loadWiki = (): WikiState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  const catGeneral = generateId();
  const catDev = generateId();
  const catOnboard = generateId();
  return {
    categories: [
      { id: catGeneral, name: 'Genel', parentId: null, isExpanded: true },
      { id: catDev, name: 'Geliştirme', parentId: null, isExpanded: true },
      { id: catOnboard, name: 'Onboarding', parentId: null, isExpanded: false },
    ],
    pages: [
      {
        id: generateId(), title: 'Wiki\'ye Hoş Geldiniz', categoryId: catGeneral,
        content: `# Wiki\'ye Hoş Geldiniz 🎉\n\nBu **Wiki** uygulaması, takımınızın bilgi tabanını yönetmenizi sağlar.\n\n## Özellikler\n\n- 📝 Markdown formatında sayfa yazma\n- 📂 Kategorilerle düzenleme\n- 🔍 Hızlı arama\n- 📜 Versiyon geçmişi\n- 🔗 İç linkler: \`[[Sayfa Adı]]\` formatı\n\n## Nasıl Kullanılır?\n\n1. Sol panelden **+ Sayfa** butonuna tıklayın\n2. Markdown formatında içerik yazın\n3. **Önizle** butonuyla görünümü kontrol edin\n\n> **İpucu:** \`[[Başka Sayfa]]\` yazarak iç linkler oluşturabilirsiniz.`,
        createdAt: Date.now() - 86400000, updatedAt: Date.now(), history: [],
      },
      {
        id: generateId(), title: 'Geliştirme Kılavuzu', categoryId: catDev,
        content: `# Geliştirme Kılavuzu\n\n## Teknoloji Yığını\n\n| Teknoloji | Versiyon | Kullanım |\n|-----------|---------|----------|\n| React | 19.2 | UI Framework |\n| TypeScript | 5.9 | Tip güvenliği |\n| Vite | 7.2 | Build aracı |\n| Tailwind | 3.4 | Stiller |\n\n## Proje Yapısı\n\n\`\`\`\nsrc/\n├── apps/        # Uygulamalar\n├── components/  # Bileşenler\n├── hooks/       # Custom hooks\n└── types/       # Tip tanımları\n\`\`\`\n\n## Komutlar\n\n\`\`\`bash\nnpm run dev      # Geliştirme sunucusu\nnpm run build    # Prod build\nnpm run test     # Testler\n\`\`\``,
        createdAt: Date.now() - 172800000, updatedAt: Date.now() - 86400000, history: [],
      },
      {
        id: generateId(), title: 'Yeni Çalışan Rehberi', categoryId: catOnboard,
        content: `# Yeni Çalışan Rehberi\n\n## İlk Gün\n\n- [ ] Hesaplarını kur (GitHub, Slack, Email)\n- [ ] Geliştirme ortamını kur\n- [ ] [[Geliştirme Kılavuzu]]'nu oku\n- [ ] Takımla tanış\n\n## İlk Hafta\n\n- [ ] Projeyi klonla ve çalıştır\n- [ ] İlk PR\'ını gönder\n- [ ] Code review sürecini öğren\n\n## Kaynaklar\n\n- 📖 [[Wiki'ye Hoş Geldiniz]]\n- 💻 [[Geliştirme Kılavuzu]]`,
        createdAt: Date.now() - 259200000, updatedAt: Date.now() - 172800000, history: [],
      },
    ],
  };
};

// ─── Simple Markdown Renderer ───
const renderMarkdown = (md: string, onLinkClick: (title: string) => void): React.ReactNode => {
  const lines = md.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const renderInline = (text: string): React.ReactNode => {
    // Wiki links [[Page]]
    const parts: React.ReactNode[] = [];
    let last = 0;
    const linkRegex = /\[\[([^\]]+)\]\]/g;
    let match;
    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > last) parts.push(renderTextFormatting(text.slice(last, match.index)));
      const title = match[1];
      parts.push(
        <button key={match.index} onClick={() => onLinkClick(title)}
          style={{ color: 'var(--accent-primary)', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', padding: 0, font: 'inherit' }}>
          {title}
        </button>
      );
      last = match.index + match[0].length;
    }
    if (last < text.length) parts.push(renderTextFormatting(text.slice(last)));
    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  const renderTextFormatting = (text: string): React.ReactNode => {
    // Bold, italic, code, links
    return text
      .split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/)
      .map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('`') && part.endsWith('`')) return <code key={i} style={{ background: 'var(--bg-hover)', padding: '1px 4px', borderRadius: 3, fontSize: '0.9em' }}>{part.slice(1, -1)}</code>;
        if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
        return part;
      });
  };

  lines.forEach((line, i) => {
    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={i} style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8, fontSize: 11, fontFamily: 'monospace', overflow: 'auto', margin: '8px 0', border: '1px solid var(--border-subtle)' }}>
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
        codeLines = [];
      }
      inCodeBlock = !inCodeBlock;
      return;
    }
    if (inCodeBlock) { codeLines.push(line); return; }

    // Table
    if (line.includes('|') && line.trim().startsWith('|')) {
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c))) return; // separator
      if (!inTable) { inTable = true; tableRows = []; }
      tableRows.push(cells);
      // Check if next line is not a table
      const nextLine = lines[i + 1];
      if (!nextLine || (!nextLine.includes('|') || !nextLine.trim().startsWith('|'))) {
        elements.push(
          <table key={i} style={{ width: '100%', borderCollapse: 'collapse', margin: '8px 0', fontSize: 11 }}>
            <thead><tr>{tableRows[0]?.map((c, j) => <th key={j} style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid var(--border-default)', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase' }}>{c}</th>)}</tr></thead>
            <tbody>{tableRows.slice(1).map((row, ri) => <tr key={ri}>{row.map((c, ci) => <td key={ci} style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-subtle)' }}>{c}</td>)}</tr>)}</tbody>
          </table>
        );
        inTable = false;
        tableRows = [];
      }
      return;
    }

    // Headers
    if (line.startsWith('# ')) { elements.push(<h1 key={i} style={{ fontSize: 20, fontWeight: 700, margin: '16px 0 8px', color: 'var(--text-primary)' }}>{renderInline(line.slice(2))}</h1>); return; }
    if (line.startsWith('## ')) { elements.push(<h2 key={i} style={{ fontSize: 16, fontWeight: 600, margin: '14px 0 6px', color: 'var(--text-primary)' }}>{renderInline(line.slice(3))}</h2>); return; }
    if (line.startsWith('### ')) { elements.push(<h3 key={i} style={{ fontSize: 13, fontWeight: 600, margin: '10px 0 4px', color: 'var(--text-primary)' }}>{renderInline(line.slice(4))}</h3>); return; }

    // Blockquote
    if (line.startsWith('> ')) { elements.push(<blockquote key={i} style={{ borderLeft: '3px solid var(--accent-primary)', paddingLeft: 12, margin: '8px 0', color: 'var(--text-secondary)', fontSize: 12 }}>{renderInline(line.slice(2))}</blockquote>); return; }

    // List items
    if (line.match(/^[-*] /)) { elements.push(<li key={i} style={{ marginLeft: 16, fontSize: 12, lineHeight: 1.6, listStyleType: 'disc', color: 'var(--text-primary)' }}>{renderInline(line.slice(2))}</li>); return; }
    if (line.match(/^- \[[ x]\] /)) {
      const checked = line[3] === 'x';
      elements.push(
        <li key={i} style={{ marginLeft: 16, fontSize: 12, lineHeight: 1.6, listStyleType: 'none', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={checked} readOnly style={{ accentColor: 'var(--accent-primary)' }} />
          <span style={{ textDecoration: checked ? 'line-through' : 'none', opacity: checked ? 0.6 : 1 }}>{renderInline(line.slice(6))}</span>
        </li>
      );
      return;
    }
    if (line.match(/^\d+\. /)) { elements.push(<li key={i} style={{ marginLeft: 16, fontSize: 12, lineHeight: 1.6, listStyleType: 'decimal', color: 'var(--text-primary)' }}>{renderInline(line.replace(/^\d+\. /, ''))}</li>); return; }

    // Horizontal rule
    if (line.match(/^---+$/)) { elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '12px 0' }} />); return; }

    // Empty line
    if (!line.trim()) { elements.push(<br key={i} />); return; }

    // Paragraph
    elements.push(<p key={i} style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--text-primary)', margin: '4px 0' }}>{renderInline(line)}</p>);
  });

  return <>{elements}</>;
};

// ─── Main Component ───
const Wiki: React.FC = () => {
  const [wiki, setWiki] = useState<WikiState>(loadWiki);
  const [activePage, setActivePage] = useState<string | null>(wiki.pages[0]?.id || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(wiki)); }, [wiki]);

  const page = wiki.pages.find(p => p.id === activePage);

  const startEdit = () => {
    if (!page) return;
    setEditContent(page.content);
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (!page) return;
    const history = [...page.history, { content: page.content, timestamp: page.updatedAt }].slice(-10);
    setWiki(prev => ({
      ...prev,
      pages: prev.pages.map(p => p.id === page.id ? { ...p, content: editContent, updatedAt: Date.now(), history } : p),
    }));
    setIsEditing(false);
  };

  const createPage = (categoryId: string) => {
    const newPage: WikiPage = {
      id: generateId(), title: 'Yeni Sayfa', content: '# Yeni Sayfa\n\nİçerik buraya yazılır.',
      categoryId, createdAt: Date.now(), updatedAt: Date.now(), history: [],
    };
    setWiki(prev => ({ ...prev, pages: [...prev.pages, newPage] }));
    setActivePage(newPage.id);
    startEdit();
  };

  const deletePage = (id: string) => {
    setWiki(prev => ({ ...prev, pages: prev.pages.filter(p => p.id !== id) }));
    if (activePage === id) setActivePage(null);
  };

  const addCategory = () => {
    if (!newCatName.trim()) return;
    setWiki(prev => ({ ...prev, categories: [...prev.categories, { id: generateId(), name: newCatName.trim(), parentId: null, isExpanded: true }] }));
    setNewCatName('');
  };

  const toggleCategory = (id: string) => {
    setWiki(prev => ({ ...prev, categories: prev.categories.map(c => c.id === id ? { ...c, isExpanded: !c.isExpanded } : c) }));
  };

  const navigateToPage = (title: string) => {
    const target = wiki.pages.find(p => p.title === title);
    if (target) { setActivePage(target.id); setIsEditing(false); }
  };

  const downloadMd = () => {
    if (!page) return;
    const blob = new Blob([page.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${page.title}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  const filteredPages = searchQuery
    ? wiki.pages.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  return (
    <div className="flex h-full" style={{ background: 'var(--bg-window)' }}>
      {/* Sidebar */}
      <div className="w-52 shrink-0 border-r flex flex-col" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-titlebar)' }}>
        {/* Search */}
        <div className="p-2">
          <div className="relative">
            <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-disabled)]" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Ara..."
              className="w-full text-[10px] pl-6 pr-2 py-1.5 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)]" />
          </div>
        </div>

        {/* Tree */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-1">
          {filteredPages ? (
            // Search results
            filteredPages.map(p => (
              <button key={p.id} onClick={() => { setActivePage(p.id); setSearchQuery(''); setIsEditing(false); }}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-left text-[10px] hover:bg-[var(--bg-hover)] transition-colors"
                style={{ color: activePage === p.id ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                <FileText size={10} /> <span className="truncate">{p.title}</span>
              </button>
            ))
          ) : (
            // Category tree
            wiki.categories.map(cat => {
              const pages = wiki.pages.filter(p => p.categoryId === cat.id);
              return (
                <div key={cat.id} className="mb-1">
                  <button onClick={() => toggleCategory(cat.id)}
                    className="w-full flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
                    {cat.isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                    <FolderOpen size={10} /> {cat.name}
                    <span className="ml-auto text-[8px] text-[var(--text-disabled)]">{pages.length}</span>
                  </button>
                  {cat.isExpanded && (
                    <div className="ml-3">
                      {pages.map(p => (
                        <button key={p.id} onClick={() => { setActivePage(p.id); setIsEditing(false); }}
                          className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-left text-[10px] hover:bg-[var(--bg-hover)] transition-colors group"
                          style={{
                            background: activePage === p.id ? 'var(--bg-selected)' : 'transparent',
                            color: activePage === p.id ? 'var(--accent-primary)' : 'var(--text-primary)',
                          }}>
                          <FileText size={9} /> <span className="truncate flex-1">{p.title}</span>
                          <button onClick={e => { e.stopPropagation(); deletePage(p.id); }}
                            className="opacity-0 group-hover:opacity-100 text-[var(--text-disabled)] hover:text-[var(--accent-error)]"><Trash2 size={9} /></button>
                        </button>
                      ))}
                      <button onClick={() => createPage(cat.id)}
                        className="w-full flex items-center gap-1 px-2 py-1 rounded text-[9px] text-[var(--text-disabled)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
                        <Plus size={9} /> Sayfa Ekle
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Add category */}
        <div className="p-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex gap-1">
            <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Yeni kategori..."
              className="flex-1 text-[9px] px-2 py-1 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)]"
              onKeyDown={e => e.key === 'Enter' && addCategory()} />
            <button onClick={addCategory} className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"><Plus size={10} /></button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {page ? (
          <>
            {/* Page toolbar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
              {isEditing ? (
                <input value={page.title} onChange={e => setWiki(prev => ({ ...prev, pages: prev.pages.map(p => p.id === page.id ? { ...p, title: e.target.value } : p) }))}
                  className="text-sm font-semibold bg-transparent outline-none flex-1 text-[var(--text-primary)]" />
              ) : (
                <span className="text-sm font-semibold text-[var(--text-primary)] flex-1">{page.title}</span>
              )}
              <span className="text-[9px] text-[var(--text-disabled)] flex items-center gap-1"><Clock size={9} /> {new Date(page.updatedAt).toLocaleDateString('tr')}</span>
              <button onClick={downloadMd} className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]" title="Markdown indir"><Download size={12} /></button>
              <button onClick={() => setShowHistory(!showHistory)} className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]" title="Geçmiş"><Clock size={12} /></button>
              {isEditing ? (
                <div className="flex gap-1">
                  <button onClick={() => setIsEditing(false)} className="px-2 py-1 rounded text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">İptal</button>
                  <button onClick={saveEdit} className="px-2.5 py-1 rounded text-xs font-medium text-white" style={{ background: 'var(--accent-primary)' }}>Kaydet</button>
                </div>
              ) : (
                <button onClick={startEdit} className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"><Edit3 size={11} /> Düzenle</button>
              )}
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {isEditing ? (
                <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                  className="w-full h-full p-4 text-xs font-mono bg-transparent text-[var(--text-primary)] outline-none resize-none"
                  style={{ lineHeight: 1.8 }} />
              ) : (
                <div className="p-4 max-w-[720px]">
                  {renderMarkdown(page.content, navigateToPage)}
                </div>
              )}
            </div>

            {/* History panel */}
            {showHistory && page.history.length > 0 && (
              <div className="border-t p-3 max-h-32 overflow-y-auto custom-scrollbar" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-secondary)' }}>
                <span className="text-[9px] text-[var(--text-secondary)] uppercase block mb-1">Versiyon Geçmişi</span>
                {page.history.map((h, i) => (
                  <button key={i} onClick={() => { setEditContent(h.content); setIsEditing(true); setShowHistory(false); }}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded text-left text-[10px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
                    <Clock size={9} /> {new Date(h.timestamp).toLocaleString('tr')} <span className="text-[var(--text-disabled)]">({h.content.length} karakter)</span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[var(--text-disabled)]">
            <BookOpen size={48} />
            <span className="text-sm">Bir sayfa seçin veya yeni oluşturun</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wiki;

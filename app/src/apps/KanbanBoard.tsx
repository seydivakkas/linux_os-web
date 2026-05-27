// ============================================================
// KanbanBoard — Drag-and-drop project management
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Trash2, GripVertical, MoreHorizontal, Tag, Calendar,
  CheckSquare, Edit3, X, ChevronDown, Filter, Search,
} from 'lucide-react';

const generateId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// ─── Types ───
interface KanbanCard {
  id: string;
  title: string;
  description: string;
  labels: string[];
  dueDate: string;
  assignee: string;
  checklist: { text: string; done: boolean }[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: number;
}

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  cards: KanbanCard[];
}

interface KanbanBoard {
  id: string;
  name: string;
  columns: KanbanColumn[];
}

const PRIORITY_CONFIG = {
  low: { label: 'Düşük', color: '#4CAF50', bg: 'rgba(76,175,80,0.15)' },
  normal: { label: 'Normal', color: '#2196F3', bg: 'rgba(33,150,243,0.15)' },
  high: { label: 'Yüksek', color: '#FF9800', bg: 'rgba(255,152,0,0.15)' },
  urgent: { label: 'Acil', color: '#F44336', bg: 'rgba(244,67,54,0.15)' },
};

const LABEL_COLORS = [
  '#7C4DFF', '#00BCD4', '#4CAF50', '#FF9800', '#F44336', '#E91E63',
  '#3F51B5', '#009688', '#8BC34A', '#FFC107',
];

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: generateId(), title: 'Yapılacak', color: '#7C4DFF', cards: [] },
  { id: generateId(), title: 'Devam Eden', color: '#2196F3', cards: [] },
  { id: generateId(), title: 'İncelemede', color: '#FF9800', cards: [] },
  { id: generateId(), title: 'Tamamlanan', color: '#4CAF50', cards: [] },
];

const STORAGE_KEY = 'linuxos_kanban_boards';

const loadBoards = (): KanbanBoard[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return [{
    id: generateId(),
    name: 'Ana Proje',
    columns: [
      {
        ...DEFAULT_COLUMNS[0],
        cards: [
          { id: generateId(), title: 'API tasarımını bitir', description: 'REST endpoint yapısı', labels: ['Backend'], dueDate: '', assignee: '', checklist: [{ text: 'Auth endpoints', done: true }, { text: 'CRUD endpoints', done: false }], priority: 'high', createdAt: Date.now() },
          { id: generateId(), title: 'Unit testleri yaz', description: '', labels: ['Test'], dueDate: '', assignee: '', checklist: [], priority: 'normal', createdAt: Date.now() },
        ],
      },
      {
        ...DEFAULT_COLUMNS[1],
        cards: [
          { id: generateId(), title: 'Frontend dashboard', description: 'React ile dashboard sayfası', labels: ['Frontend', 'UI'], dueDate: '', assignee: '', checklist: [{ text: 'Layout', done: true }, { text: 'Charts', done: false }, { text: 'Responsive', done: false }], priority: 'high', createdAt: Date.now() },
        ],
      },
      { ...DEFAULT_COLUMNS[2], cards: [] },
      {
        ...DEFAULT_COLUMNS[3],
        cards: [
          { id: generateId(), title: 'Veritabanı şeması', description: 'PostgreSQL şema tasarımı tamamlandı', labels: ['Backend', 'DB'], dueDate: '', assignee: '', checklist: [], priority: 'normal', createdAt: Date.now() },
        ],
      },
    ],
  }];
};

// ─── Card Component ───
const CardDetail: React.FC<{
  card: KanbanCard;
  onUpdate: (card: KanbanCard) => void;
  onClose: () => void;
  onDelete: () => void;
}> = ({ card, onUpdate, onClose, onDelete }) => {
  const [title, setTitle] = useState(card.title);
  const [desc, setDesc] = useState(card.description);
  const [newCheck, setNewCheck] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const save = useCallback(() => {
    onUpdate({ ...card, title, description: desc });
  }, [card, title, desc, onUpdate]);

  useEffect(() => { save(); }, [title, desc]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="w-full max-w-[560px] max-h-[80vh] rounded-xl overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-window)', border: '1px solid var(--border-default)' }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <input value={title} onChange={e => setTitle(e.target.value)}
            className="text-sm font-semibold bg-transparent outline-none flex-1 text-[var(--text-primary)]"
            placeholder="Kart başlığı..." />
          <div className="flex items-center gap-1">
            <button onClick={onDelete} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--accent-error)]"><Trash2 size={14} /></button>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"><X size={14} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {/* Priority */}
          <div>
            <label className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">Öncelik</label>
            <div className="flex gap-1">
              {(Object.keys(PRIORITY_CONFIG) as Array<keyof typeof PRIORITY_CONFIG>).map(p => (
                <button key={p} onClick={() => onUpdate({ ...card, title, description: desc, priority: p })}
                  className="px-2 py-1 rounded text-[10px] font-medium transition-all"
                  style={{
                    background: card.priority === p ? PRIORITY_CONFIG[p].bg : 'transparent',
                    color: card.priority === p ? PRIORITY_CONFIG[p].color : 'var(--text-secondary)',
                    border: card.priority === p ? `1px solid ${PRIORITY_CONFIG[p].color}` : '1px solid var(--border-subtle)',
                  }}>
                  {PRIORITY_CONFIG[p].label}
                </button>
              ))}
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1 flex items-center gap-1"><Tag size={10} /> Etiketler</label>
            <div className="flex flex-wrap gap-1 mb-1">
              {card.labels.map((l, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-[10px] text-white font-medium cursor-pointer hover:opacity-70"
                  style={{ background: LABEL_COLORS[i % LABEL_COLORS.length] }}
                  onClick={() => onUpdate({ ...card, title, description: desc, labels: card.labels.filter((_, j) => j !== i) })}>
                  {l} ×
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Yeni etiket..."
                className="text-xs px-2 py-1 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none flex-1 border border-[var(--border-subtle)]"
                onKeyDown={e => { if (e.key === 'Enter' && newLabel.trim()) { onUpdate({ ...card, title, description: desc, labels: [...card.labels, newLabel.trim()] }); setNewLabel(''); } }} />
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1 flex items-center gap-1"><Calendar size={10} /> Son Tarih</label>
            <input type="date" value={card.dueDate} onChange={e => onUpdate({ ...card, title, description: desc, dueDate: e.target.value })}
              className="text-xs px-2 py-1.5 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)]" />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">Açıklama</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Açıklama ekle..."
              className="w-full text-xs px-2 py-1.5 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none resize-none border border-[var(--border-subtle)]" />
          </div>

          {/* Checklist */}
          <div>
            <label className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1 flex items-center gap-1"><CheckSquare size={10} /> Kontrol Listesi</label>
            {card.checklist.length > 0 && (
              <div className="mb-1.5">
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${card.checklist.length > 0 ? (card.checklist.filter(c => c.done).length / card.checklist.length) * 100 : 0}%`,
                    background: 'var(--accent-primary)',
                  }} />
                </div>
                <span className="text-[10px] text-[var(--text-secondary)]">{card.checklist.filter(c => c.done).length}/{card.checklist.length}</span>
              </div>
            )}
            <div className="space-y-1">
              {card.checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-2 group">
                  <input type="checkbox" checked={item.done}
                    onChange={() => { const cl = [...card.checklist]; cl[i] = { ...cl[i], done: !cl[i].done }; onUpdate({ ...card, title, description: desc, checklist: cl }); }}
                    className="rounded" />
                  <span className={`text-xs flex-1 ${item.done ? 'line-through text-[var(--text-disabled)]' : 'text-[var(--text-primary)]'}`}>{item.text}</span>
                  <button onClick={() => { const cl = card.checklist.filter((_, j) => j !== i); onUpdate({ ...card, title, description: desc, checklist: cl }); }}
                    className="opacity-0 group-hover:opacity-100 text-[var(--text-disabled)] hover:text-[var(--accent-error)]"><Trash2 size={10} /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-1 mt-1">
              <input value={newCheck} onChange={e => setNewCheck(e.target.value)} placeholder="Yeni madde..."
                className="text-xs px-2 py-1 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none flex-1 border border-[var(--border-subtle)]"
                onKeyDown={e => { if (e.key === 'Enter' && newCheck.trim()) { onUpdate({ ...card, title, description: desc, checklist: [...card.checklist, { text: newCheck.trim(), done: false }] }); setNewCheck(''); } }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───
const KanbanBoardApp: React.FC = () => {
  const [boards, setBoards] = useState<KanbanBoard[]>(loadBoards);
  const [activeBoard, setActiveBoard] = useState(0);
  const [dragCard, setDragCard] = useState<{ cardId: string; fromCol: string } | null>(null);
  const [openCard, setOpenCard] = useState<{ colId: string; cardId: string } | null>(null);
  const [addingCardCol, setAddingCardCol] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editingColTitle, setEditingColTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  const board = boards[activeBoard];

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(boards)); }, [boards]);

  const updateBoard = useCallback((updater: (b: KanbanBoard) => KanbanBoard) => {
    setBoards(prev => prev.map((b, i) => i === activeBoard ? updater(b) : b));
  }, [activeBoard]);

  // ─── Card Operations ───
  const addCard = (colId: string) => {
    if (!newCardTitle.trim()) return;
    const card: KanbanCard = {
      id: generateId(), title: newCardTitle.trim(), description: '', labels: [], dueDate: '',
      assignee: '', checklist: [], priority: 'normal', createdAt: Date.now(),
    };
    updateBoard(b => ({
      ...b,
      columns: b.columns.map(c => c.id === colId ? { ...c, cards: [...c.cards, card] } : c),
    }));
    setNewCardTitle('');
    setAddingCardCol(null);
  };

  const updateCard = (colId: string, card: KanbanCard) => {
    updateBoard(b => ({
      ...b,
      columns: b.columns.map(c => c.id === colId ? { ...c, cards: c.cards.map(k => k.id === card.id ? card : k) } : c),
    }));
  };

  const deleteCard = (colId: string, cardId: string) => {
    updateBoard(b => ({
      ...b,
      columns: b.columns.map(c => c.id === colId ? { ...c, cards: c.cards.filter(k => k.id !== cardId) } : c),
    }));
    setOpenCard(null);
  };

  // ─── Column Operations ───
  const addColumn = () => {
    const col: KanbanColumn = { id: generateId(), title: 'Yeni Sütun', color: LABEL_COLORS[board.columns.length % LABEL_COLORS.length], cards: [] };
    updateBoard(b => ({ ...b, columns: [...b.columns, col] }));
  };

  const deleteColumn = (colId: string) => {
    updateBoard(b => ({ ...b, columns: b.columns.filter(c => c.id !== colId) }));
  };

  const renameColumn = (colId: string) => {
    if (!editingColTitle.trim()) return;
    updateBoard(b => ({
      ...b,
      columns: b.columns.map(c => c.id === colId ? { ...c, title: editingColTitle.trim() } : c),
    }));
    setEditingColId(null);
  };

  // ─── Drag & Drop ───
  const handleDragStart = (cardId: string, fromCol: string) => {
    setDragCard({ cardId, fromCol });
  };

  const handleDrop = (toCol: string) => {
    if (!dragCard || dragCard.fromCol === toCol) { setDragCard(null); return; }
    updateBoard(b => {
      const fromColumn = b.columns.find(c => c.id === dragCard.fromCol);
      const card = fromColumn?.cards.find(k => k.id === dragCard.cardId);
      if (!card) return b;
      return {
        ...b,
        columns: b.columns.map(c => {
          if (c.id === dragCard.fromCol) return { ...c, cards: c.cards.filter(k => k.id !== dragCard.cardId) };
          if (c.id === toCol) return { ...c, cards: [...c.cards, card] };
          return c;
        }),
      };
    });
    setDragCard(null);
  };

  // ─── Filter ───
  const filterCards = (cards: KanbanCard[]) => {
    let filtered = cards;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c => c.title.toLowerCase().includes(q) || c.labels.some(l => l.toLowerCase().includes(q)));
    }
    if (filterPriority !== 'all') {
      filtered = filtered.filter(c => c.priority === filterPriority);
    }
    return filtered;
  };

  // Open card detail
  const openCardDetail = openCard
    ? { col: board.columns.find(c => c.id === openCard.colId), card: board.columns.find(c => c.id === openCard.colId)?.cards.find(k => k.id === openCard.cardId) }
    : null;

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-window)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-titlebar)' }}>
        <div className="flex items-center gap-1 flex-1">
          {boards.map((b, i) => (
            <button key={b.id} onClick={() => setActiveBoard(i)}
              className="px-3 py-1 rounded text-xs transition-colors"
              style={{
                background: activeBoard === i ? 'var(--accent-primary)' : 'transparent',
                color: activeBoard === i ? '#fff' : 'var(--text-secondary)',
              }}>
              {b.name}
            </button>
          ))}
          <button onClick={() => setBoards(prev => [...prev, { id: generateId(), name: `Pano ${boards.length + 1}`, columns: [...DEFAULT_COLUMNS.map(c => ({ ...c, id: generateId(), cards: [] }))] }])}
            className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"><Plus size={14} /></button>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-1">
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-disabled)]" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Ara..."
              className="text-xs pl-6 pr-2 py-1 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)] w-28" />
          </div>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            className="text-xs px-2 py-1 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)]">
            <option value="all">Tüm</option>
            <option value="urgent">Acil</option>
            <option value="high">Yüksek</option>
            <option value="normal">Normal</option>
            <option value="low">Düşük</option>
          </select>
        </div>
      </div>

      {/* Columns */}
      <div className="flex-1 flex overflow-x-auto gap-3 p-3 custom-scrollbar">
        {board.columns.map(col => {
          const cards = filterCards(col.cards);
          return (
            <div key={col.id} className="flex flex-col shrink-0 rounded-xl"
              style={{ width: 280, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(col.id)}>
              {/* Column Header */}
              <div className="flex items-center justify-between px-3 py-2.5 rounded-t-xl"
                style={{ borderBottom: `2px solid ${col.color}` }}>
                {editingColId === col.id ? (
                  <input autoFocus value={editingColTitle} onChange={e => setEditingColTitle(e.target.value)}
                    onBlur={() => renameColumn(col.id)} onKeyDown={e => e.key === 'Enter' && renameColumn(col.id)}
                    className="text-xs font-semibold bg-transparent outline-none flex-1 text-[var(--text-primary)]" />
                ) : (
                  <div className="flex items-center gap-2 flex-1">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: col.color }} />
                    <span className="text-xs font-semibold text-[var(--text-primary)] truncate">{col.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>{cards.length}</span>
                  </div>
                )}
                <div className="flex items-center gap-0.5">
                  <button onClick={() => { setEditingColId(col.id); setEditingColTitle(col.title); }}
                    className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-disabled)]"><Edit3 size={11} /></button>
                  <button onClick={() => deleteColumn(col.id)}
                    className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-disabled)] hover:text-[var(--accent-error)]"><Trash2 size={11} /></button>
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                {cards.map(card => {
                  const checkDone = card.checklist.filter(c => c.done).length;
                  const checkTotal = card.checklist.length;
                  return (
                    <div key={card.id} draggable onDragStart={() => handleDragStart(card.id, col.id)}
                      onClick={() => setOpenCard({ colId: col.id, cardId: card.id })}
                      className="rounded-lg p-2.5 cursor-pointer transition-all hover:shadow-md group"
                      style={{
                        background: 'var(--bg-window)',
                        border: '1px solid var(--border-subtle)',
                      }}>
                      {/* Labels */}
                      {card.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {card.labels.map((l, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded text-[8px] text-white font-medium"
                              style={{ background: LABEL_COLORS[i % LABEL_COLORS.length] }}>{l}</span>
                          ))}
                        </div>
                      )}
                      {/* Title */}
                      <p className="text-xs font-medium text-[var(--text-primary)] mb-1">{card.title}</p>
                      {/* Meta */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                          style={{ background: PRIORITY_CONFIG[card.priority].bg, color: PRIORITY_CONFIG[card.priority].color }}>
                          {PRIORITY_CONFIG[card.priority].label}
                        </span>
                        {card.dueDate && <span className="text-[9px] text-[var(--text-secondary)] flex items-center gap-0.5"><Calendar size={8} />{card.dueDate}</span>}
                        {checkTotal > 0 && (
                          <span className="text-[9px] text-[var(--text-secondary)] flex items-center gap-0.5">
                            <CheckSquare size={8} />{checkDone}/{checkTotal}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Add Card */}
                {addingCardCol === col.id ? (
                  <div className="rounded-lg p-2" style={{ background: 'var(--bg-window)', border: '1px solid var(--border-default)' }}>
                    <input ref={inputRef} autoFocus value={newCardTitle} onChange={e => setNewCardTitle(e.target.value)}
                      placeholder="Kart başlığı..." className="w-full text-xs px-2 py-1.5 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)] mb-1.5"
                      onKeyDown={e => { if (e.key === 'Enter') addCard(col.id); if (e.key === 'Escape') setAddingCardCol(null); }} />
                    <div className="flex gap-1">
                      <button onClick={() => addCard(col.id)} className="px-2.5 py-1 rounded text-[10px] font-medium text-white" style={{ background: 'var(--accent-primary)' }}>Ekle</button>
                      <button onClick={() => setAddingCardCol(null)} className="px-2 py-1 rounded text-[10px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">İptal</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setAddingCardCol(col.id); setNewCardTitle(''); }}
                    className="w-full flex items-center gap-1 px-2 py-1.5 rounded text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
                    <Plus size={12} /> Kart Ekle
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add Column */}
        <button onClick={addColumn}
          className="shrink-0 flex flex-col items-center justify-center gap-2 rounded-xl transition-colors"
          style={{ width: 200, minHeight: 120, border: '2px dashed var(--border-subtle)', color: 'var(--text-secondary)' }}>
          <Plus size={20} />
          <span className="text-xs">Sütun Ekle</span>
        </button>
      </div>

      {/* Card Detail Modal */}
      {openCardDetail?.col && openCardDetail?.card && (
        <CardDetail
          card={openCardDetail.card}
          onUpdate={card => updateCard(openCardDetail.col!.id, card)}
          onClose={() => setOpenCard(null)}
          onDelete={() => deleteCard(openCardDetail.col!.id, openCardDetail.card!.id)}
        />
      )}
    </div>
  );
};

export default KanbanBoardApp;

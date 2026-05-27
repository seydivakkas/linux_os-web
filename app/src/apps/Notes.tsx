// ============================================================
// Notes — Three-pane note-taking app with folders
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import {
  Folder, FileText, Plus, Search, Trash2, Bold, Italic,
  Underline, List, ListOrdered, Edit2, Check, X,
  Star, Clock, Download, Heading1, Heading2, Heading3, Code, Minus,
} from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
}

interface FolderItem {
  id: string;
  name: string;
  isSystem: boolean;
}

const DEFAULT_FOLDERS: FolderItem[] = [
  { id: 'all', name: 'All Notes', isSystem: true },
  { id: 'inbox', name: 'Inbox', isSystem: false },
  { id: 'work', name: 'Work', isSystem: false },
  { id: 'personal', name: 'Personal', isSystem: false },
  { id: 'favorites', name: 'Favorites', isSystem: true },
  { id: 'trash', name: 'Trash', isSystem: true },
];

const generateId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const loadNotes = (): Note[] => {
  try {
    const saved = localStorage.getItem('ubuntuos_notes');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return [
    { id: generateId(), title: 'Welcome to Notes', content: '<p>This is your personal notes app. Create folders, organize your thoughts, and keep everything in one place.</p><p><b>Bold</b>, <i>italic</i>, and lists are supported.</p>', folderId: 'inbox', isFavorite: false, isPinned: true, createdAt: Date.now(), updatedAt: Date.now() },
    { id: generateId(), title: 'Meeting Notes', content: '<p>Discuss project timeline and deliverables.</p><ul><li>Action item 1</li><li>Action item 2</li></ul>', folderId: 'work', isFavorite: true, isPinned: false, createdAt: Date.now() - 86400000, updatedAt: Date.now() - 3600000 },
  ];
};

const loadFolders = (): FolderItem[] => {
  try {
    const saved = localStorage.getItem('ubuntuos_note_folders');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return DEFAULT_FOLDERS;
};

const Notes: React.FC = () => {
  const [folders, setFolders] = useState<FolderItem[]>(loadFolders);
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');

  useEffect(() => {
    localStorage.setItem('ubuntuos_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('ubuntuos_note_folders', JSON.stringify(folders));
  }, [folders]);

  const activeNote = notes.find(n => n.id === selectedNoteId) || null;

  const filteredNotes = useMemo(() => {
    let filtered = notes;
    if (selectedFolder === 'all') filtered = notes.filter(n => n.folderId !== 'trash');
    else if (selectedFolder === 'favorites') filtered = notes.filter(n => n.isFavorite && n.folderId !== 'trash');
    else if (selectedFolder === 'trash') filtered = notes.filter(n => n.folderId === 'trash');
    else filtered = notes.filter(n => n.folderId === selectedFolder);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [notes, selectedFolder, searchQuery]);

  const createNote = () => {
    const folderId = selectedFolder === 'all' || selectedFolder === 'favorites' ? 'inbox' : selectedFolder;
    const note: Note = {
      id: generateId(),
      title: '',
      content: '',
      folderId,
      isFavorite: false,
      isPinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes(prev => [note, ...prev]);
    setSelectedNoteId(note.id);
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, folderId: 'trash' } : n));
  };

  const permanentDelete = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (selectedNoteId === id) setSelectedNoteId(null);
  };

  const restoreNote = (id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, folderId: 'inbox' } : n));
  };

  const createFolder = () => {
    if (!newFolderName.trim()) return;
    const folder: FolderItem = { id: generateId(), name: newFolderName, isSystem: false };
    setFolders(prev => [...prev, folder]);
    setNewFolderName('');
    setShowNewFolder(false);
  };

  const renameFolder = (id: string) => {
    if (!editFolderName.trim()) { setEditingFolder(null); return; }
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name: editFolderName } : f));
    setEditingFolder(null);
  };

  const deleteFolder = (id: string) => {
    setNotes(prev => prev.map(n => n.folderId === id ? { ...n, folderId: 'inbox' } : n));
    setFolders(prev => prev.filter(f => f.id !== id));
    if (selectedFolder === id) setSelectedFolder('all');
  };

  const noteCount = (folderId: string) => {
    if (folderId === 'all') return notes.filter(n => n.folderId !== 'trash').length;
    if (folderId === 'favorites') return notes.filter(n => n.isFavorite && n.folderId !== 'trash').length;
    if (folderId === 'trash') return notes.filter(n => n.folderId === 'trash').length;
    return notes.filter(n => n.folderId === folderId).length;
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Rich text commands
  const execCmd = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const htmlToMarkdown = (html: string): string => {
    return html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
      .replace(/<b>(.*?)<\/b>/gi, '**$1**')
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<i>(.*?)<\/i>/gi, '*$1*')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<u>(.*?)<\/u>/gi, '$1')
      .replace(/<li>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<code>(.*?)<\/code>/gi, '`$1`')
      .replace(/<pre>(.*?)<\/pre>/gis, '```\n$1\n```\n')
      .replace(/<hr\s*\/?>/gi, '---\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/\n{3,}/g, '\n\n').trim();
  };

  const exportMarkdown = () => {
    if (!activeNote) return;
    const md = `# ${activeNote.title}\n\n${htmlToMarkdown(activeNote.content)}`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${activeNote.title || 'note'}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportHTML = () => {
    if (!activeNote) return;
    const html = `<!DOCTYPE html><html><head><title>${activeNote.title}</title><style>body{font-family:sans-serif;max-width:720px;margin:40px auto;padding:0 20px;line-height:1.6;color:#333;}h1{border-bottom:2px solid #eee;padding-bottom:8px;}</style></head><body><h1>${activeNote.title}</h1>${activeNote.content}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${activeNote.title || 'note'}.html`; a.click();
    URL.revokeObjectURL(url);
  };

  const userFolders = folders.filter(f => !f.isSystem);
  const systemFolders = folders.filter(f => f.isSystem);

  return (
    <div className="flex h-full" style={{ background: 'var(--bg-window)' }}>
      {/* Folders sidebar */}
      <div className="w-48 shrink-0 border-r flex flex-col" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-titlebar)' }}>
        <div className="p-2 space-y-0.5">
          {/* System folders */}
          {systemFolders.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFolder(f.id)}
              className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-xs transition-colors"
              style={{
                background: selectedFolder === f.id ? 'var(--bg-selected)' : 'transparent',
                color: selectedFolder === f.id ? 'var(--accent-primary)' : 'var(--text-primary)',
              }}
            >
              {f.id === 'all' && <Folder size={14} />}
              {f.id === 'favorites' && <Star size={14} />}
              {f.id === 'trash' && <Trash2 size={14} />}
              <span className="flex-1 text-left">{f.name}</span>
              <span className="text-[10px] text-[var(--text-disabled)]">{noteCount(f.id)}</span>
            </button>
          ))}

          <div className="pt-2 border-t mt-2" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[10px] text-[var(--text-disabled)] uppercase tracking-wider">Folders</span>
              <button onClick={() => setShowNewFolder(!showNewFolder)} className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)]">
                <Plus size={12} />
              </button>
            </div>

            {showNewFolder && (
              <div className="flex items-center gap-1 px-2 mb-1">
                <input
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') createFolder(); if (e.key === 'Escape') setShowNewFolder(false); }}
                  placeholder="Folder name"
                  className="flex-1 h-7 px-2 rounded text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-disabled)]"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}
                  autoFocus
                />
                <button onClick={createFolder} className="text-[var(--accent-primary)]"><Check size={14} /></button>
                <button onClick={() => setShowNewFolder(false)} className="text-[var(--text-secondary)]"><X size={14} /></button>
              </div>
            )}

            {userFolders.map(f => (
              <div key={f.id} className="group flex items-center">
                {editingFolder === f.id ? (
                  <div className="flex items-center gap-1 px-2 flex-1">
                    <input
                      value={editFolderName}
                      onChange={e => setEditFolderName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') renameFolder(f.id); if (e.key === 'Escape') setEditingFolder(null); }}
                      className="flex-1 h-6 px-1 rounded text-xs text-[var(--text-primary)] outline-none"
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}
                      autoFocus
                    />
                    <button onClick={() => renameFolder(f.id)} className="text-[var(--accent-primary)]"><Check size={12} /></button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedFolder(f.id)}
                    className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs transition-colors"
                    style={{
                      background: selectedFolder === f.id ? 'var(--bg-selected)' : 'transparent',
                      color: selectedFolder === f.id ? 'var(--accent-primary)' : 'var(--text-primary)',
                    }}
                  >
                    <Folder size={13} />
                    <span className="flex-1 text-left truncate">{f.name}</span>
                    <span className="text-[10px] text-[var(--text-disabled)]">{noteCount(f.id)}</span>
                  </button>
                )}
                {!f.isSystem && editingFolder !== f.id && (
                  <div className="hidden group-hover:flex items-center gap-0.5 pr-1">
                    <button onClick={() => { setEditingFolder(f.id); setEditFolderName(f.name); }} className="p-0.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                      <Edit2 size={10} />
                    </button>
                    <button onClick={() => deleteFolder(f.id)} className="p-0.5 text-[var(--text-secondary)] hover:text-[var(--accent-error)]">
                      <Trash2 size={10} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Note list */}
      <div className="w-64 shrink-0 border-r flex flex-col" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2 p-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-1.5 flex-1 px-2 py-1.5 rounded-lg" style={{ background: 'var(--bg-input)' }}>
            <Search size={12} className="text-[var(--text-secondary)]" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="flex-1 bg-transparent text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-disabled)]"
            />
          </div>
          <button onClick={createNote} className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--accent-primary)]">
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <FileText size={24} className="text-[var(--text-disabled)] opacity-40" />
              <div className="text-xs text-[var(--text-disabled)]">No notes yet</div>
            </div>
          ) : (
            filteredNotes.map(note => (
              <button
                key={note.id}
                onClick={() => setSelectedNoteId(note.id)}
                className="w-full text-left p-3 border-b transition-colors"
                style={{
                  borderColor: 'var(--border-subtle)',
                  background: selectedNoteId === note.id ? 'var(--bg-selected)' : 'transparent',
                }}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      {note.isPinned && <span className="text-[var(--accent-primary)]">📌</span>}
                      <span className="text-xs font-semibold text-[var(--text-primary)] truncate">{note.title || 'Untitled'}</span>
                    </div>
                    <div className="text-[10px] text-[var(--text-secondary)] mt-0.5 line-clamp-2">
                      {stripHtml(note.content) || 'No content'}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] text-[var(--text-disabled)]">{formatDate(note.updatedAt)}</span>
                      {note.isFavorite && <Star size={10} className="text-[var(--accent-secondary)] fill-current" />}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeNote ? (
          <>
            {/* Editor toolbar */}
            <div className="flex items-center gap-1 px-2 py-1.5 border-b shrink-0" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-titlebar)' }}>
              <button onClick={() => execCmd('bold')} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]" title="Bold">
                <Bold size={13} />
              </button>
              <button onClick={() => execCmd('italic')} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]" title="Italic">
                <Italic size={13} />
              </button>
              <button onClick={() => execCmd('underline')} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]" title="Underline">
                <Underline size={13} />
              </button>
              <div className="w-px h-4 mx-1" style={{ background: 'var(--border-subtle)' }} />
              <button onClick={() => execCmd('insertUnorderedList')} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]" title="Bullet List">
                <List size={13} />
              </button>
              <button onClick={() => execCmd('insertOrderedList')} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]" title="Numbered List">
                <ListOrdered size={13} />
              </button>
              <div className="w-px h-4 mx-1" style={{ background: 'var(--border-subtle)' }} />
              <button onClick={() => execCmd('formatBlock', 'h1')} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]" title="Heading 1">
                <Heading1 size={13} />
              </button>
              <button onClick={() => execCmd('formatBlock', 'h2')} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]" title="Heading 2">
                <Heading2 size={13} />
              </button>
              <button onClick={() => execCmd('formatBlock', 'h3')} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]" title="Heading 3">
                <Heading3 size={13} />
              </button>
              <div className="w-px h-4 mx-1" style={{ background: 'var(--border-subtle)' }} />
              <button onClick={() => { const sel = window.getSelection(); if (sel && sel.rangeCount) { const range = sel.getRangeAt(0); const code = document.createElement('code'); code.style.background = 'var(--bg-hover)'; code.style.padding = '1px 4px'; code.style.borderRadius = '3px'; code.style.fontFamily = 'monospace'; range.surroundContents(code); } }} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]" title="Inline Code">
                <Code size={13} />
              </button>
              <button onClick={() => execCmd('insertHorizontalRule')} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]" title="Horizontal Rule">
                <Minus size={13} />
              </button>
              <div className="w-px h-4 mx-1" style={{ background: 'var(--border-subtle)' }} />
              <button onClick={exportMarkdown} className="flex items-center gap-1 px-1.5 py-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] text-[10px]" title="Export Markdown">
                <Download size={11} /> .md
              </button>
              <button onClick={exportHTML} className="flex items-center gap-1 px-1.5 py-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] text-[10px]" title="Export HTML">
                <Download size={11} /> .html
              </button>
              <div className="flex-1" />
              <button
                onClick={() => updateNote(activeNote.id, { isFavorite: !activeNote.isFavorite })}
                className={`p-1.5 rounded hover:bg-[var(--bg-hover)] ${activeNote.isFavorite ? 'text-[var(--accent-secondary)]' : 'text-[var(--text-secondary)]'}`}
                title="Favorite"
              >
                <Star size={13} className={activeNote.isFavorite ? 'fill-current' : ''} />
              </button>
              <button
                onClick={() => updateNote(activeNote.id, { isPinned: !activeNote.isPinned })}
                className={`p-1.5 rounded hover:bg-[var(--bg-hover)] ${activeNote.isPinned ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`}
                title="Pin"
              >
                📌
              </button>
              {activeNote.folderId === 'trash' ? (
                <button onClick={() => restoreNote(activeNote.id)} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--accent-success)]" title="Restore">
                  <Clock size={13} />
                </button>
              ) : (
                <button onClick={() => deleteNote(activeNote.id)} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]" title="Delete">
                  <Trash2 size={13} />
                </button>
              )}
              <button onClick={() => permanentDelete(activeNote.id)} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--accent-error)]" title="Permanently Delete">
                <X size={13} />
              </button>
            </div>

            {/* Title input */}
            <input
              value={activeNote.title}
              onChange={e => updateNote(activeNote.id, { title: e.target.value })}
              placeholder="Note title..."
              className="px-4 py-3 text-lg font-semibold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-disabled)] bg-transparent border-b"
              style={{ borderColor: 'var(--border-subtle)' }}
            />

            {/* Content editable */}
            <div
              className="flex-1 overflow-y-auto custom-scrollbar p-4 text-sm text-[var(--text-primary)] outline-none"
              style={{ lineHeight: 1.6 }}
              contentEditable
              suppressContentEditableWarning
              onInput={e => updateNote(activeNote.id, { content: e.currentTarget.innerHTML })}
              dangerouslySetInnerHTML={{ __html: activeNote.content }}
            />

            {/* Auto-save indicator */}
            <div className="px-4 py-1 border-t text-[10px] text-[var(--text-disabled)] text-right" style={{ borderColor: 'var(--border-subtle)' }}>
              Saved {formatDate(activeNote.updatedAt)}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <FileText size={48} className="text-[var(--text-disabled)] opacity-30" />
            <div className="text-sm text-[var(--text-secondary)]">Select a note or create a new one</div>
            <button
              onClick={createNote}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-white"
              style={{ background: 'var(--accent-primary)' }}
            >
              <Plus size={14} /> New Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;

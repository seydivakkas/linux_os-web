// ============================================================
// InvoiceGenerator — Professional invoice creation with PDF
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Trash2, Download, Eye, ChevronLeft, Copy,
  Building2, User, Receipt, FileText,
} from 'lucide-react';

const generateId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

interface InvoiceData {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  // Seller
  companyName: string;
  companyAddress: string;
  companyTaxId: string;
  companyPhone: string;
  companyEmail: string;
  // Buyer
  clientName: string;
  clientAddress: string;
  clientTaxId: string;
  clientEmail: string;
  // Items
  items: InvoiceItem[];
  discount: number;
  notes: string;
  status: 'draft' | 'sent' | 'paid';
  createdAt: number;
}

const STORAGE_KEY = 'linuxos_invoices';
const COMPANY_KEY = 'linuxos_invoice_company';

const loadInvoices = (): InvoiceData[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return [];
};

const loadCompany = () => {
  try {
    const saved = localStorage.getItem(COMPANY_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return { companyName: 'Şirketim A.Ş.', companyAddress: 'İstanbul, Türkiye', companyTaxId: '', companyPhone: '', companyEmail: '' };
};

const getNextInvoiceNumber = (invoices: InvoiceData[]): string => {
  const year = new Date().getFullYear();
  const count = invoices.filter(i => i.number.startsWith(`INV-${year}`)).length + 1;
  return `INV-${year}-${String(count).padStart(4, '0')}`;
};

const STATUS_CONFIG = {
  draft: { label: 'Taslak', color: '#FF9800', bg: 'rgba(255,152,0,0.15)' },
  sent: { label: 'Gönderildi', color: '#2196F3', bg: 'rgba(33,150,243,0.15)' },
  paid: { label: 'Ödendi', color: '#4CAF50', bg: 'rgba(76,175,80,0.15)' },
};

const VAT_RATES = [0, 1, 10, 20];

const InvoiceGenerator: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceData[]>(loadInvoices);
  const [activeInvoice, setActiveInvoice] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'edit' | 'preview'>('list');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices)); }, [invoices]);

  const company = loadCompany();

  const createInvoice = () => {
    const inv: InvoiceData = {
      id: generateId(),
      number: getNextInvoiceNumber(invoices),
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      ...company,
      clientName: '', clientAddress: '', clientTaxId: '', clientEmail: '',
      items: [{ id: generateId(), description: '', quantity: 1, unitPrice: 0, vatRate: 20 }],
      discount: 0, notes: '', status: 'draft', createdAt: Date.now(),
    };
    setInvoices(prev => [inv, ...prev]);
    setActiveInvoice(inv.id);
    setView('edit');
  };

  const updateInvoice = useCallback((updates: Partial<InvoiceData>) => {
    setInvoices(prev => prev.map(i => i.id === activeInvoice ? { ...i, ...updates } : i));
  }, [activeInvoice]);

  const deleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(i => i.id !== id));
    if (activeInvoice === id) { setActiveInvoice(null); setView('list'); }
  };

  const duplicateInvoice = (inv: InvoiceData) => {
    const dup: InvoiceData = {
      ...inv, id: generateId(), number: getNextInvoiceNumber(invoices),
      date: new Date().toISOString().split('T')[0], status: 'draft', createdAt: Date.now(),
    };
    setInvoices(prev => [dup, ...prev]);
  };

  const invoice = invoices.find(i => i.id === activeInvoice);

  // Calculations
  const calcSubtotal = (items: InvoiceItem[]) => items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const calcVat = (items: InvoiceItem[]) => items.reduce((s, i) => s + (i.quantity * i.unitPrice * i.vatRate / 100), 0);
  const calcTotal = (items: InvoiceItem[], discount: number) => calcSubtotal(items) - discount + calcVat(items);

  const addItem = () => {
    if (!invoice) return;
    updateInvoice({ items: [...invoice.items, { id: generateId(), description: '', quantity: 1, unitPrice: 0, vatRate: 20 }] });
  };

  const updateItem = (itemId: string, updates: Partial<InvoiceItem>) => {
    if (!invoice) return;
    updateInvoice({ items: invoice.items.map(i => i.id === itemId ? { ...i, ...updates } : i) });
  };

  const removeItem = (itemId: string) => {
    if (!invoice) return;
    updateInvoice({ items: invoice.items.filter(i => i.id !== itemId) });
  };

  const downloadPDF = () => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Fatura ${invoice?.number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
        body { padding: 32px; color: #1a1a1a; }
        ${printRef.current.querySelector('style')?.textContent || ''}
      </style></head><body>
      ${printRef.current.innerHTML}
      <script>window.onload = () => { window.print(); window.close(); }</script>
      </body></html>`);
    printWindow.document.close();
  };

  // ─── List View ───
  if (view === 'list') {
    return (
      <div className="flex flex-col h-full" style={{ background: 'var(--bg-window)' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <span className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2"><Receipt size={16} /> Faturalar</span>
          <button onClick={createInvoice} className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium text-white" style={{ background: 'var(--accent-primary)' }}>
            <Plus size={12} /> Yeni Fatura
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--text-disabled)]">
              <FileText size={48} />
              <span className="text-sm">Henüz fatura yok</span>
              <button onClick={createInvoice} className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium text-white" style={{ background: 'var(--accent-primary)' }}>
                <Plus size={12} /> İlk Faturayı Oluştur
              </button>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {invoices.map(inv => (
                <div key={inv.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
                  onClick={() => { setActiveInvoice(inv.id); setView('edit'); }}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">{inv.number}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: STATUS_CONFIG[inv.status].bg, color: STATUS_CONFIG[inv.status].color }}>
                        {STATUS_CONFIG[inv.status].label}
                      </span>
                    </div>
                    <span className="text-[10px] text-[var(--text-secondary)]">{inv.clientName || 'Müşteri belirtilmedi'} · {inv.date}</span>
                  </div>
                  <span className="text-sm font-mono font-semibold text-[var(--text-primary)]">₺{calcTotal(inv.items, inv.discount).toLocaleString()}</span>
                  <div className="flex gap-1">
                    <button onClick={e => { e.stopPropagation(); duplicateInvoice(inv); }} className="p-1.5 rounded hover:bg-[var(--bg-active)] text-[var(--text-secondary)]"><Copy size={12} /></button>
                    <button onClick={e => { e.stopPropagation(); deleteInvoice(inv.id); }} className="p-1.5 rounded hover:bg-[var(--bg-active)] text-[var(--accent-error)]"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  // ─── Edit / Preview View ───
  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-window)' }}>
      {/* Top Bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-titlebar)' }}>
        <button onClick={() => { setView('list'); setActiveInvoice(null); }} className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"><ChevronLeft size={16} /></button>
        <span className="text-xs font-mono font-semibold text-[var(--text-primary)] flex-1">{invoice.number}</span>
        <select value={invoice.status} onChange={e => updateInvoice({ status: e.target.value as InvoiceData['status'] })}
          className="text-[10px] px-2 py-1 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)]">
          <option value="draft">Taslak</option>
          <option value="sent">Gönderildi</option>
          <option value="paid">Ödendi</option>
        </select>
        <button onClick={() => setView(view === 'preview' ? 'edit' : 'preview')}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
          <Eye size={12} /> {view === 'preview' ? 'Düzenle' : 'Önizle'}
        </button>
        <button onClick={downloadPDF} className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-white" style={{ background: 'var(--accent-primary)' }}>
          <Download size={12} /> PDF
        </button>
      </div>

      {view === 'edit' ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {/* Dates */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-[var(--text-secondary)] uppercase mb-1 block">Fatura Tarihi</label>
              <input type="date" value={invoice.date} onChange={e => updateInvoice({ date: e.target.value })}
                className="w-full text-xs px-2 py-1.5 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)]" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-[var(--text-secondary)] uppercase mb-1 block">Vade Tarihi</label>
              <input type="date" value={invoice.dueDate} onChange={e => updateInvoice({ dueDate: e.target.value })}
                className="w-full text-xs px-2 py-1.5 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)]" />
            </div>
          </div>

          {/* Seller & Buyer */}
          <div className="flex gap-3">
            <div className="flex-1 p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <span className="text-[10px] text-[var(--text-secondary)] uppercase flex items-center gap-1 mb-2"><Building2 size={10} /> Satıcı</span>
              <input value={invoice.companyName} onChange={e => updateInvoice({ companyName: e.target.value })} placeholder="Firma adı"
                className="w-full text-xs px-2 py-1 mb-1 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)]" />
              <input value={invoice.companyAddress} onChange={e => updateInvoice({ companyAddress: e.target.value })} placeholder="Adres"
                className="w-full text-xs px-2 py-1 mb-1 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)]" />
              <input value={invoice.companyTaxId} onChange={e => updateInvoice({ companyTaxId: e.target.value })} placeholder="Vergi No"
                className="w-full text-xs px-2 py-1 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)]" />
            </div>
            <div className="flex-1 p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <span className="text-[10px] text-[var(--text-secondary)] uppercase flex items-center gap-1 mb-2"><User size={10} /> Müşteri</span>
              <input value={invoice.clientName} onChange={e => updateInvoice({ clientName: e.target.value })} placeholder="Müşteri adı"
                className="w-full text-xs px-2 py-1 mb-1 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)]" />
              <input value={invoice.clientAddress} onChange={e => updateInvoice({ clientAddress: e.target.value })} placeholder="Adres"
                className="w-full text-xs px-2 py-1 mb-1 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)]" />
              <input value={invoice.clientTaxId} onChange={e => updateInvoice({ clientTaxId: e.target.value })} placeholder="Vergi No"
                className="w-full text-xs px-2 py-1 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)]" />
            </div>
          </div>

          {/* Items */}
          <div>
            <span className="text-[10px] text-[var(--text-secondary)] uppercase mb-2 block">Kalemler</span>
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
              <div className="flex px-3 py-1.5 text-[9px] text-[var(--text-secondary)] uppercase" style={{ background: 'var(--bg-secondary)' }}>
                <span className="flex-1">Açıklama</span>
                <span className="w-16 text-center">Miktar</span>
                <span className="w-24 text-center">Birim Fiyat</span>
                <span className="w-16 text-center">KDV %</span>
                <span className="w-24 text-right">Tutar</span>
                <span className="w-8" />
              </div>
              {invoice.items.map(item => (
                <div key={item.id} className="flex items-center px-3 py-1.5 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <input value={item.description} onChange={e => updateItem(item.id, { description: e.target.value })} placeholder="Ürün/Hizmet"
                    className="flex-1 text-xs px-1 py-0.5 bg-transparent text-[var(--text-primary)] outline-none" />
                  <input type="number" min={1} value={item.quantity} onChange={e => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                    className="w-16 text-xs text-center px-1 py-0.5 bg-transparent text-[var(--text-primary)] outline-none" />
                  <input type="number" min={0} value={item.unitPrice} onChange={e => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-24 text-xs text-center px-1 py-0.5 bg-transparent text-[var(--text-primary)] outline-none" />
                  <select value={item.vatRate} onChange={e => updateItem(item.id, { vatRate: parseInt(e.target.value) })}
                    className="w-16 text-xs text-center bg-transparent text-[var(--text-primary)] outline-none">
                    {VAT_RATES.map(r => <option key={r} value={r}>%{r}</option>)}
                  </select>
                  <span className="w-24 text-xs text-right font-mono text-[var(--text-primary)]">₺{(item.quantity * item.unitPrice).toLocaleString()}</span>
                  <button onClick={() => removeItem(item.id)} className="w-8 flex justify-center text-[var(--text-disabled)] hover:text-[var(--accent-error)]"><Trash2 size={11} /></button>
                </div>
              ))}
            </div>
            <button onClick={addItem} className="flex items-center gap-1 mt-2 px-2 py-1 rounded text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
              <Plus size={12} /> Kalem Ekle
            </button>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex justify-between text-xs"><span className="text-[var(--text-secondary)]">Ara Toplam</span><span className="font-mono text-[var(--text-primary)]">₺{calcSubtotal(invoice.items).toLocaleString()}</span></div>
              <div className="flex justify-between text-xs items-center">
                <span className="text-[var(--text-secondary)]">İndirim</span>
                <input type="number" min={0} value={invoice.discount} onChange={e => updateInvoice({ discount: parseFloat(e.target.value) || 0 })}
                  className="w-24 text-xs text-right font-mono bg-transparent text-[var(--text-primary)] outline-none" />
              </div>
              <div className="flex justify-between text-xs"><span className="text-[var(--text-secondary)]">KDV</span><span className="font-mono text-[var(--text-primary)]">₺{calcVat(invoice.items).toLocaleString()}</span></div>
              <div className="flex justify-between text-sm font-semibold pt-1.5 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="text-[var(--text-primary)]">Toplam</span>
                <span className="font-mono text-[var(--accent-primary)]">₺{calcTotal(invoice.items, invoice.discount).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] text-[var(--text-secondary)] uppercase mb-1 block">Notlar</label>
            <textarea value={invoice.notes} onChange={e => updateInvoice({ notes: e.target.value })} rows={2} placeholder="Ek notlar..."
              className="w-full text-xs px-2 py-1.5 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none resize-none border border-[var(--border-subtle)]" />
          </div>
        </div>
      ) : (
        /* Preview */
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex justify-center">
          <div ref={printRef} className="w-full max-w-[640px] p-8 rounded-lg" style={{ background: '#fff', color: '#1a1a1a', border: '1px solid #e0e0e0' }}>
            <style>{`.inv-tbl { width: 100%; border-collapse: collapse; } .inv-tbl th, .inv-tbl td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #eee; font-size: 11px; } .inv-tbl th { background: #f5f5f5; font-weight: 600; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; }`}</style>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>{invoice.companyName}</div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{invoice.companyAddress}</div>
                {invoice.companyTaxId && <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>V.D.: {invoice.companyTaxId}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#7C4DFF' }}>FATURA</div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{invoice.number}</div>
                <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>Tarih: {invoice.date}</div>
                <div style={{ fontSize: 10, color: '#888' }}>Vade: {invoice.dueDate}</div>
              </div>
            </div>
            {/* Client */}
            <div style={{ padding: 12, background: '#f9f9f9', borderRadius: 8, marginBottom: 24 }}>
              <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Müşteri</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{invoice.clientName || '—'}</div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{invoice.clientAddress}</div>
              {invoice.clientTaxId && <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>V.D.: {invoice.clientTaxId}</div>}
            </div>
            {/* Items Table */}
            <table className="inv-tbl">
              <thead><tr><th>Açıklama</th><th style={{ textAlign: 'center' }}>Miktar</th><th style={{ textAlign: 'right' }}>Birim Fiyat</th><th style={{ textAlign: 'center' }}>KDV</th><th style={{ textAlign: 'right' }}>Tutar</th></tr></thead>
              <tbody>
                {invoice.items.map(item => (
                  <tr key={item.id}>
                    <td>{item.description || '—'}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>₺{item.unitPrice.toLocaleString()}</td>
                    <td style={{ textAlign: 'center' }}>%{item.vatRate}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>₺{(item.quantity * item.unitPrice).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <div style={{ width: 240 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 0', color: '#666' }}><span>Ara Toplam</span><span style={{ fontFamily: 'monospace' }}>₺{calcSubtotal(invoice.items).toLocaleString()}</span></div>
                {invoice.discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 0', color: '#F44336' }}><span>İndirim</span><span style={{ fontFamily: 'monospace' }}>-₺{invoice.discount.toLocaleString()}</span></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 0', color: '#666' }}><span>KDV</span><span style={{ fontFamily: 'monospace' }}>₺{calcVat(invoice.items).toLocaleString()}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, padding: '8px 0', borderTop: '2px solid #1a1a1a', marginTop: 4 }}><span>Toplam</span><span style={{ fontFamily: 'monospace', color: '#7C4DFF' }}>₺{calcTotal(invoice.items, invoice.discount).toLocaleString()}</span></div>
              </div>
            </div>
            {invoice.notes && <div style={{ marginTop: 24, padding: 12, background: '#f9f9f9', borderRadius: 8, fontSize: 10, color: '#666' }}><strong>Not:</strong> {invoice.notes}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceGenerator;

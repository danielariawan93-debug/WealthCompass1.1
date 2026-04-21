import React, { useState } from 'react';
import { Card, TInput, TSelect, TBtn } from '../components/ui';
import { fM, parseVal, FREQ_MULT } from '../utils/helpers';

const CATEGORIES = [
  { value: 'langganan',    label: '📺 Langganan',            desc: 'Netflix, Spotify, dll' },
  { value: 'sewa',         label: '🏠 Sewa',                 desc: 'kost, kontrakan, kantor' },
  { value: 'utilitas',     label: '💡 Utilitas',             desc: 'listrik, air, internet' },
  { value: 'pendidikan',   label: '📚 Pendidikan',           desc: 'SPP, kursus, sekolah' },
  { value: 'transportasi', label: '🚗 Transportasi',         desc: 'bensin rutin, parkir' },
  { value: 'operasional',  label: '⚙️ Operasional Bisnis',   desc: 'biaya rutin bisnis' },
  { value: 'lainnya',      label: '📋 Lainnya',              desc: '' },
];

const CAT_ICON = {
  langganan: '📺', sewa: '🏠', utilitas: '💡',
  pendidikan: '📚', transportasi: '🚗', operasional: '⚙️', lainnya: '📋',
};

const FREQ_LABELS = { monthly: 'Bulanan', quarterly: 'Kuartalan', yearly: 'Tahunan' };

// FREQ_MULT for recurring: monthly=12, quarterly=4, yearly=1 (to annual)
const REC_FREQ_MULT = { monthly: 12, quarterly: 4, yearly: 1 };

function monthlyAmount(item) {
  return (item.amount || 0) * (REC_FREQ_MULT[item.frequency] || 12) / 12;
}

const EMPTY_FORM = {
  name: '', category: 'langganan', amount: '', frequency: 'monthly', notes: '',
};

function RecurringScene({ recurringItems, setRecurringItems, T, dispCur, hideValues, fM: fMProp }) {
  const fmt = fMProp || ((v, c) => fM(v, c || dispCur, hideValues));

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const totalMonthly = recurringItems.reduce((s, item) => s + monthlyAmount(item), 0);

  const handleAdd = () => {
    if (!form.name.trim()) { setError('Nama pengeluaran wajib diisi.'); return; }
    const amt = parseVal(form.amount);
    if (!amt) { setError('Jumlah wajib diisi.'); return; }
    setError('');
    const newItem = {
      id: Date.now().toString(),
      name: form.name.trim(),
      category: form.category,
      amount: amt,
      frequency: form.frequency,
      notes: form.notes.trim(),
    };
    setRecurringItems(prev => [...prev, newItem]);
    setForm(EMPTY_FORM);
  };

  const handleDelete = (id) => {
    setRecurringItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div>
      <Card T={T} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🔄</span>
            <span style={{ color: T.accent, fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5 }}>
              Pengeluaran Rutin
            </span>
          </div>
          {totalMonthly > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: T.red, fontSize: 13, fontWeight: 'bold' }}>
                {fmt(totalMonthly, dispCur)}<span style={{ color: T.muted, fontWeight: 'normal', fontSize: 11 }}>/bln</span>
              </div>
              <div style={{ color: T.muted, fontSize: 10 }}>{recurringItems.length} item</div>
            </div>
          )}
        </div>

        {/* Add form */}
        <div style={{ background: T.surface, borderRadius: 10, padding: 12, marginBottom: 14 }}>
          <div style={{ color: T.textSoft, fontSize: 10, letterSpacing: 1.5, marginBottom: 10 }}>TAMBAH ITEM BARU</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <TInput
              label="Nama Pengeluaran"
              value={form.name}
              onChange={v => setForm(p => ({ ...p, name: v }))}
              placeholder="cth. Netflix, Sewa Kost"
              T={T}
            />
            <TSelect
              label="Kategori"
              value={form.category}
              onChange={v => setForm(p => ({ ...p, category: v }))}
              options={CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
              T={T}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <TInput
              label="Jumlah (IDR)"
              value={form.amount}
              onChange={v => setForm(p => ({ ...p, amount: v }))}
              placeholder="cth. 150000"
              T={T}
            />
            <TSelect
              label="Frekuensi"
              value={form.frequency}
              onChange={v => setForm(p => ({ ...p, frequency: v }))}
              options={[
                { value: 'monthly',   label: 'Bulanan' },
                { value: 'quarterly', label: 'Kuartalan (3 bln)' },
                { value: 'yearly',    label: 'Tahunan' },
              ]}
              T={T}
            />
          </div>
          <TInput
            label="Catatan (opsional)"
            value={form.notes}
            onChange={v => setForm(p => ({ ...p, notes: v }))}
            placeholder="Tambahan keterangan..."
            T={T}
          />
          {error && <div style={{ color: T.red, fontSize: 11, marginTop: 6 }}>{error}</div>}
          <div style={{ marginTop: 10 }}>
            <TBtn onClick={handleAdd} T={T} style={{ width: '100%' }}>+ Tambah</TBtn>
          </div>
        </div>

        {/* Item list */}
        {recurringItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: T.muted, fontSize: 12 }}>
            Belum ada pengeluaran rutin. Tambahkan item di atas.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recurringItems.map(item => {
              const monEq = monthlyAmount(item);
              const isNonMonthly = item.frequency !== 'monthly';
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', background: T.surface, borderRadius: 10,
                    border: `1px solid ${T.border}`,
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{CAT_ICON[item.category] || '📋'}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: T.text, fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </div>
                      <div style={{ color: T.muted, fontSize: 10 }}>
                        {CATEGORIES.find(c => c.value === item.category)?.label || item.category}
                        {' · '}
                        {fmt(item.amount, dispCur)}/{FREQ_LABELS[item.frequency] || item.frequency}
                        {isNonMonthly && (
                          <span style={{ color: T.textSoft }}> · ≈ {fmt(monEq, dispCur)}/bln</span>
                        )}
                      </div>
                      {item.notes && (
                        <div style={{ color: T.muted, fontSize: 9, marginTop: 2 }}>{item.notes}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: T.red, fontSize: 12, fontWeight: 'bold' }}>{fmt(monEq, dispCur)}</div>
                      <div style={{ color: T.muted, fontSize: 9 }}>/bln</div>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{
                        background: 'none', border: `1px solid ${T.border}`, borderRadius: 6,
                        color: T.muted, cursor: 'pointer', fontSize: 13, padding: '3px 7px',
                        lineHeight: 1,
                      }}
                      title="Hapus"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Total footer */}
        {recurringItems.length > 0 && (
          <div style={{ marginTop: 12, padding: '10px 12px', background: T.redDim, borderRadius: 10, border: `1px solid ${T.red}22`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: T.textSoft, fontSize: 11 }}>Total Pengeluaran Rutin/Bln</span>
            <span style={{ color: T.red, fontSize: 13, fontWeight: 'bold' }}>{fmt(totalMonthly, dispCur)}</span>
          </div>
        )}
      </Card>
    </div>
  );
}

export { RecurringScene };

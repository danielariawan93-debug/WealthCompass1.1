import React, { useState, useMemo } from 'react';
import { Card, SL, Bar, TInput, TSelect, TBtn, InfoBtn } from '../components/ui';
import { fM, parseVal } from '../utils/helpers';

// ============================================================
// DEBT DEFINITIONS
// ============================================================
const KONSUMTIF = [
  { key:'kpr',       label:'KPR / KPA',            icon:'🏠', rate:9.5,  mode:'amortizing', info:'Kredit Pemilikan Rumah atau Apartemen untuk tempat tinggal pribadi.' },
  { key:'kkb',       label:'KKB Kendaraan Pribadi', icon:'🚗', rate:10.0, mode:'amortizing', info:'Kredit kendaraan bermotor untuk penggunaan pribadi.' },
  { key:'motor',     label:'Kredit Motor',          icon:'🛵', rate:10.0, mode:'amortizing', info:'Cicilan sepeda motor untuk penggunaan pribadi.' },
  { key:'cc',        label:'Kartu Kredit',          icon:'💳', rate:27.0, mode:'revolving',  info:'Tagihan kartu kredit. Input tagihan yang belum lunas (bukan limit).' },
  { key:'paylater',  label:'PayLater / BNPL',       icon:'📱', rate:24.0, mode:'revolving',  info:'GoPay Later, OVO PayLater, Shopee PayLater, Akulaku, dll.' },
  { key:'kta',       label:'KTA / Pinjaman Pribadi',icon:'💰', rate:18.0, mode:'amortizing', info:'Kredit tanpa agunan atau pinjaman personal dari bank maupun fintech.' },
  { key:'p2p',       label:'Pinjaman P2P / Online', icon:'📲', rate:24.0, mode:'amortizing', info:'Pinjaman dari platform fintech lending seperti Kredivo, Cicil, dll.' },
  { key:'keluarga',  label:'Hutang ke Keluarga/Tmn', icon:'🤝', rate:0,   mode:'amortizing', info:'Pinjaman informal tanpa bunga atau bunga kesepakatan.' },
];

const PRODUKTIF = [
  { key:'kur',       label:'KUR (Kredit Usaha Rakyat)', icon:'🏛️', rate:6.0,  mode:'amortizing', info:'Program pemerintah berbunga rendah untuk UMKM. Maks Rp500jt.' },
  { key:'kmk',       label:'Kredit Modal Kerja',        icon:'⚙️', rate:10.5, mode:'amortizing', info:'Pinjaman untuk modal operasional bisnis, biasanya jangka pendek.' },
  { key:'krek',      label:'Rekening Koran / PRK',      icon:'🔄', rate:10.5, mode:'revolving',  info:'Fasilitas kredit revolving. Bayar bunga saja, pokok bisa naik-turun sesuai kebutuhan bisnis.' },
  { key:'ki',        label:'Kredit Investasi',          icon:'📈', rate:10.0, mode:'amortizing', info:'Pinjaman untuk pembelian aset produktif jangka panjang (mesin, kendaraan niaga, dll).' },
  { key:'kkb_niaga', label:'KKB Kendaraan Niaga',       icon:'🚚', rate:9.0,  mode:'amortizing', info:'Kredit kendaraan operasional bisnis: truk, minibus, pick-up, dll.' },
  { key:'kpr_invest',label:'KPR Properti Investasi',    icon:'🏢', rate:9.5,  mode:'amortizing', info:'KPR untuk properti yang disewakan atau dijadikan aset investasi.' },
  { key:'margin',    label:'Margin Trading / Efek',     icon:'📊', rate:12.0, mode:'revolving',  info:'Fasilitas margin dari sekuritas untuk pembelian saham/efek.' },
];

const DEFAULT_RATE = { kpr:9.5, kkb:10, motor:10, cc:27, paylater:24, kta:18, p2p:24, keluarga:0, kur:6, kmk:10.5, krek:10.5, ki:10, kkb_niaga:9, kpr_invest:9.5, margin:12 };

// ============================================================
// CALCULATION HELPERS
// ============================================================
function calcMonthlyPayment(outstanding, annualRate, tenorMonths) {
  if (annualRate <= 0) return outstanding / Math.max(tenorMonths, 1);
  const r = annualRate / 100 / 12;
  const n = tenorMonths;
  return outstanding * (r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1);
}

function calcOutstandingFromPayment(monthlyPayment, annualRate, remainingMonths) {
  if (annualRate <= 0) return monthlyPayment * remainingMonths;
  const r = annualRate / 100 / 12;
  const n = remainingMonths;
  if (r === 0) return monthlyPayment * n;
  return monthlyPayment * (1 - Math.pow(1+r, -n)) / r;
}

function monthsRemaining(endYearMonth) {
  if (!endYearMonth) return 0;
  const [y, m] = endYearMonth.split('-').map(Number);
  const now = new Date();
  return Math.max(0, (y - now.getFullYear()) * 12 + (m - now.getMonth() - 1));
}

// ============================================================
// DEBT FORM
// ============================================================
const EMPTY_FORM = {
  category: 'konsumtif',
  key: 'kpr',
  name: '',
  inputMode: 'A',
  // Mode A fields
  monthlyPayment: '',
  endYearMonth: '',
  // Mode B fields
  outstanding: '',
  interestRate: '',
  tenorMonths: '',
  // Revolving / Mode C
  plafon: '',
  renewalDate: '',
  // Shared
  notes: '',
  linkedAssetId: '',
};

function DebtForm({ onSave, onCancel, T, editData, assets = [], isPro = false, isProPlus = false }) {
  const allTypes = [...KONSUMTIF, ...PRODUKTIF];
  const [f, setF] = useState(() => {
    if (editData) return { ...EMPTY_FORM, ...editData };
    return EMPTY_FORM;
  });
  const setFF = (k, v) => setF(p => ({ ...p, [k]: v }));

  const typeList  = f.category === 'konsumtif' ? KONSUMTIF : PRODUKTIF;
  const typeDef   = allTypes.find(t => t.key === f.key) || allTypes[0];
  const isRevolving = typeDef.mode === 'revolving';
  const effectiveRate = parseVal(f.interestRate) || DEFAULT_RATE[f.key] || 10;

  // Derived calculations
  const derivedOutstanding = useMemo(() => {
    // Revolving always uses outstanding directly (no amortization)
    if (isRevolving) return parseVal(f.outstanding);
    if (f.inputMode === 'A') {
      const rem = monthsRemaining(f.endYearMonth);
      if (!rem || !parseVal(f.monthlyPayment)) return 0;
      return calcOutstandingFromPayment(parseVal(f.monthlyPayment), effectiveRate, rem);
    }
    return parseVal(f.outstanding);
  }, [f.inputMode, f.monthlyPayment, f.endYearMonth, f.outstanding, effectiveRate, isRevolving]);

  const derivedMonthlyPayment = useMemo(() => {
    if (f.inputMode === 'A') return parseVal(f.monthlyPayment);
    if (isRevolving) return derivedOutstanding * (effectiveRate / 100 / 12);
    const tenor = parseInt(f.tenorMonths) || 12;
    return derivedOutstanding > 0 ? calcMonthlyPayment(derivedOutstanding, effectiveRate, tenor) : 0;
  }, [f.inputMode, f.monthlyPayment, isRevolving, derivedOutstanding, effectiveRate, f.tenorMonths]);

  const utilisasi = isRevolving && parseVal(f.plafon) > 0
    ? (parseVal(f.outstanding) / parseVal(f.plafon)) * 100 : 0;

  const canSave = f.name.trim() && derivedOutstanding > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      id: editData?.id || Date.now().toString(),
      category: f.category,
      type: f.key,
      name: f.name,
      outstanding: String(Math.round(derivedOutstanding)),
      monthlyPayment: String(Math.round(derivedMonthlyPayment)),
      interestRate: String(effectiveRate),
      plafon: f.plafon || '0',
      renewalDate: f.renewalDate || '',
      linkedAssetId: f.linkedAssetId || '',
      notes: f.notes || '',
      inputMode: f.inputMode,
      endYearMonth: f.endYearMonth || '',
      tenorMonths: f.tenorMonths || '',
    });
  };

  const fV = v => fM(v, 'IDR', false);
  const inp = { width:'100%', background:T.inputBg, border:`1px solid ${T.border}`, color:T.text, borderRadius:9, padding:'10px 12px', fontSize:12, outline:'none', boxSizing:'border-box' };
  const MONTHS = Array.from({length:12},(_,i)=>({v:String(i+1).padStart(2,'0'),l:['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'][i]}));
  const YEARS  = Array.from({length:30},(_,i)=>{const y=new Date().getFullYear()+i; return {v:String(y),l:String(y)};});

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

      {/* Category toggle */}
      <div>
        <div style={{ color:T.muted, fontSize:10, marginBottom:6, display:'flex', alignItems:'center', gap:4 }}>
          Kategori Hutang
          <InfoBtn T={T} content={"Konsumtif: hutang untuk kebutuhan pribadi, tidak menghasilkan pendapatan. Produktif: hutang untuk bisnis/investasi yang berpotensi menghasilkan pendapatan."} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[['konsumtif','🛒 Konsumtif'],['produktif','🏭 Produktif']].map(([v,l]) => (
            <button key={v} onClick={()=>{setFF('category',v); setFF('key', v==='konsumtif'?'kpr':'kur'); setFF('inputMode','A'); setFF('outstanding',''); setFF('monthlyPayment',''); setFF('endYearMonth','');}}
              style={{ padding:'10px 12px', borderRadius:9, cursor:'pointer', fontSize:12, fontWeight:'bold', border:`1px solid ${f.category===v?T.accent:T.border}`, background:f.category===v?T.accentDim:T.surface, color:f.category===v?T.accent:T.muted }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Type selector */}
      <div>
        <div style={{ color:T.muted, fontSize:10, marginBottom:6 }}>Jenis Hutang</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
          {typeList.map(t => (
            <button key={t.key} onClick={()=>{setFF('key',t.key); setFF('interestRate',''); setFF('outstanding',''); setFF('monthlyPayment',''); setFF('endYearMonth',''); setFF('plafon','');}}
              style={{ padding:'9px 10px', borderRadius:9, cursor:'pointer', textAlign:'left', fontSize:11, display:'flex', gap:6, alignItems:'center', border:`1px solid ${f.key===t.key?T.accent:T.border}`, background:f.key===t.key?T.accentDim:T.surface, color:f.key===t.key?T.accent:T.muted }}>
              <span>{t.icon}</span>
              <div>
                <div style={{ fontWeight: f.key===t.key?'bold':'normal' }}>{t.label}</div>
                <div style={{ fontSize:9, opacity:0.7 }}>~{t.rate}% p.a.</div>
              </div>
            </button>
          ))}
        </div>
        {typeDef && (
          <div style={{ marginTop:6, padding:'7px 10px', background:T.surface, borderRadius:8, fontSize:10, color:T.muted, lineHeight:1.5 }}>
            {typeDef.info}
            {isRevolving && <span style={{ color:T.orange||T.accent, fontWeight:'bold' }}> (Revolving)</span>}
          </div>
        )}
      </div>

      {/* Name */}
      <div>
        <div style={{ color:T.muted, fontSize:10, marginBottom:4 }}>Nama / Keterangan <span style={{ color:T.red }}>*</span></div>
        <input value={f.name} onChange={e=>setFF('name',e.target.value)} placeholder={typeDef?.label || 'Nama hutang'} style={inp} />
      </div>

      {/* Input mode selector */}
      {!isRevolving && (
        <div>
          <div style={{ color:T.muted, fontSize:10, marginBottom:6 }}>Cara Input</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[['A','Tahu angsurannya','Angsuran + kapan selesai'],['B','Tahu sisa hutangnya','Outstanding + bunga + tenor']].map(([v,l,sub])=>(
              <div key={v} onClick={()=>setFF('inputMode',v)} style={{ padding:'10px 12px', borderRadius:9, cursor:'pointer', border:`1px solid ${f.inputMode===v?T.accent:T.border}`, background:f.inputMode===v?T.accentDim:T.surface }}>
                <div style={{ color:f.inputMode===v?T.accent:T.text, fontSize:12, fontWeight:'bold' }}>{l}</div>
                <div style={{ color:T.muted, fontSize:10 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODE A: angsuran + end date */}
      {!isRevolving && f.inputMode === 'A' && (
        <>
          <div>
            <div style={{ color:T.muted, fontSize:10, marginBottom:4 }}>Angsuran / Bulan (IDR) *</div>
            <input value={f.monthlyPayment} onChange={e=>setFF('monthlyPayment',e.target.value)} placeholder="3500000" style={inp} />
          </div>
          <div>
            <div style={{ color:T.muted, fontSize:10, marginBottom:4 }}>Selesai pada (Bulan / Tahun) *</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <select value={(f.endYearMonth||'').split('-')[1]||''} onChange={e=>{const y=(f.endYearMonth||'').split('-')[0]||new Date().getFullYear(); setFF('endYearMonth',`${y}-${e.target.value}`);}} style={{...inp}}>
                <option value="">Bulan</option>
                {MONTHS.map(m=><option key={m.v} value={m.v}>{m.l}</option>)}
              </select>
              <select value={(f.endYearMonth||'').split('-')[0]||''} onChange={e=>{const m=(f.endYearMonth||'').split('-')[1]||'01'; setFF('endYearMonth',`${e.target.value}-${m}`);}} style={{...inp}}>
                <option value="">Tahun</option>
                {YEARS.map(y=><option key={y.v} value={y.v}>{y.l}</option>)}
              </select>
            </div>
            {monthsRemaining(f.endYearMonth) > 0 && (
              <div style={{ color:T.muted, fontSize:9, marginTop:3 }}>Sisa {monthsRemaining(f.endYearMonth)} bulan</div>
            )}
          </div>
          <div>
            <div style={{ color:T.muted, fontSize:10, marginBottom:4, display:'flex', alignItems:'center', gap:4 }}>
              Suku Bunga / Thn (%) - opsional
              <InfoBtn T={T} content={`Jika tidak diisi, digunakan asumsi default ${DEFAULT_RATE[f.key]||10}% untuk estimasi outstanding.`} />
            </div>
            <input value={f.interestRate} onChange={e=>setFF('interestRate',e.target.value)} placeholder={String(DEFAULT_RATE[f.key]||10)} style={inp} />
          </div>
        </>
      )}

      {/* MODE B: outstanding + rate + tenor */}
      {!isRevolving && f.inputMode === 'B' && (
        <>
          <div>
            <div style={{ color:T.muted, fontSize:10, marginBottom:4 }}>Sisa Hutang / Outstanding (IDR) *</div>
            <input value={f.outstanding} onChange={e=>setFF('outstanding',e.target.value)} placeholder="150000000" style={inp} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <div style={{ color:T.muted, fontSize:10, marginBottom:4, display:'flex', alignItems:'center', gap:4 }}>
                Suku Bunga / Thn (%)
                <InfoBtn T={T} content={`Default untuk ${typeDef?.label}: ${DEFAULT_RATE[f.key]||10}% per tahun.`} />
              </div>
              <input value={f.interestRate} onChange={e=>setFF('interestRate',e.target.value)} placeholder={String(DEFAULT_RATE[f.key]||10)} style={inp} />
            </div>
            <div>
              <div style={{ color:T.muted, fontSize:10, marginBottom:4 }}>Tenor Sisa (bulan)</div>
              <input value={f.tenorMonths} onChange={e=>setFF('tenorMonths',e.target.value)} placeholder="36" style={inp} />
            </div>
          </div>
        </>
      )}

      {/* REVOLVING / MODE C */}
      {isRevolving && (
        <>
          <div>
            <div style={{ color:T.muted, fontSize:10, marginBottom:4, display:'flex', alignItems:'center', gap:4 }}>
              Plafon / Limit Kredit (IDR)
              <InfoBtn T={T} content={"Total fasilitas yang diberikan. Tidak dihitung sebagai hutang - hanya untuk menghitung utilisasi."} />
            </div>
            <input value={f.plafon} onChange={e=>setFF('plafon',e.target.value)} placeholder="500000000" style={inp} />
          </div>
          <div>
            <div style={{ color:T.muted, fontSize:10, marginBottom:4 }}>Outstanding Saat Ini (IDR) * <span style={{ color:T.muted, fontSize:9 }}> - yang dihitung sebagai hutang</span></div>
            <input value={f.outstanding} onChange={e=>setFF('outstanding',e.target.value)} placeholder="200000000" style={inp} />
            {utilisasi > 0 && (
              <div style={{ marginTop:6 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:T.muted, marginBottom:3 }}>
                  <span>Utilisasi fasilitas</span>
                  <span style={{ color:utilisasi>80?T.red:utilisasi>60?T.orange:T.green, fontWeight:'bold' }}>{utilisasi.toFixed(1)}%</span>
                </div>
                <Bar pct={utilisasi} color={utilisasi>80?T.red:utilisasi>60?T.orange:T.green} h={6} T={T} />
              </div>
            )}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <div style={{ color:T.muted, fontSize:10, marginBottom:4 }}>Suku Bunga / Thn (%)</div>
              <input value={f.interestRate} onChange={e=>setFF('interestRate',e.target.value)} placeholder={String(DEFAULT_RATE[f.key]||10.5)} style={inp} />
            </div>
            <div>
              <div style={{ color:T.muted, fontSize:10, marginBottom:4 }}>Jatuh Tempo Renewal</div>
              <input type="month" value={f.renewalDate} onChange={e=>setFF('renewalDate',e.target.value)} style={{...inp}} />
            </div>
          </div>
        </>
      )}

      {/* Link to asset - Pro & Pro+ only */}
      {isPro && f.category === 'produktif' && (
        <div>
          <div style={{ color:T.muted, fontSize:10, marginBottom:4, display:'flex', alignItems:'center', gap:4 }}>
            {isProPlus ? 'Link ke Aset (mempengaruhi ROI)' : 'Referensi Aset'}
            <InfoBtn T={T} content={isProPlus ? "Pro+: bunga hutang ini akan mengurangi ROI aset terkait secara otomatis." : "Pro: catatan referensi saja, tidak mempengaruhi kalkulasi."} />
          </div>
          <select value={f.linkedAssetId} onChange={e=>setFF('linkedAssetId',e.target.value)} style={{...inp}}>
            <option value="">Pilih aset (opsional)</option>
            {assets.filter(a=>['property','business'].includes(a.classKey)).map(a=>(
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Notes */}
      <div>
        <div style={{ color:T.muted, fontSize:10, marginBottom:4 }}>Catatan (opsional)</div>
        <input value={f.notes} onChange={e=>setFF('notes',e.target.value)} placeholder="Bank, no. rekening, dll" style={inp} />
      </div>

      {/* Live preview */}
      {derivedOutstanding > 0 && (
        <div style={{ padding:'12px 14px', background:T.accentDim, borderRadius:10, border:`1px solid ${T.accentSoft}` }}>
          <div style={{ color:T.accent, fontSize:11, fontWeight:'bold', marginBottom:8 }}>Ringkasan</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              { l:'Outstanding', v:fV(derivedOutstanding), c:T.red },
              { l:isRevolving?'Bunga/Bulan':'Cicilan/Bulan', v:fV(derivedMonthlyPayment), c:T.orange },
              ...(parseVal(f.plafon)>0?[{ l:'Sisa Fasilitas', v:fV(parseVal(f.plafon)-derivedOutstanding), c:T.green }]:[]),
            ].map(item=>(
              <div key={item.l} style={{ padding:'7px 10px', background:T.surface, borderRadius:8 }}>
                <div style={{ color:T.muted, fontSize:9 }}>{item.l}</div>
                <div style={{ color:item.c, fontSize:12, fontWeight:'bold' }}>{item.v}</div>
              </div>
            ))}
          </div>
          {utilisasi > 80 && isProPlus && (
            <div style={{ marginTop:10, padding:'8px 12px', background:T.redDim, borderRadius:8, border:`1px solid ${T.red}33` }}>
              <div style={{ color:T.red, fontSize:11, fontWeight:'bold', marginBottom:2 }}>⚠ Utilisasi Tinggi ({utilisasi.toFixed(0)}%)</div>
              <div style={{ color:T.muted, fontSize:10, lineHeight:1.5 }}>Pertimbangkan setor sebagian untuk menjaga fleksibilitas operasional dan mengurangi beban bunga.</div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display:'flex', gap:8 }}>
        <TBtn T={T} variant="primary" onClick={handleSave} style={{ flex:1 }} disabled={!canSave}>
          {editData ? 'Simpan Perubahan' : '+ Tambah Hutang'}
        </TBtn>
        <TBtn T={T} variant="default" onClick={onCancel} style={{ padding:'10px 16px' }}>Batal</TBtn>
      </div>
    </div>
  );
}

// ============================================================
// MAIN SCENE
// ============================================================
function DebtScene({ debts = [], setDebts, assets = [], dispCur, tier, T, hideValues = false, isPro = false, isProPlus = false }) {
  const fV = (v) => fM(v, dispCur, hideValues);
  const [mode, setMode]     = useState('list');
  const [editDebt, setEditDebt] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const totalOutstanding = debts.reduce((s, d) => s + parseVal(d.outstanding), 0);
  const totalMonthly     = debts.reduce((s, d) => s + parseVal(d.monthlyPayment), 0);

  const konsumtif = debts.filter(d => d.category === 'konsumtif' || !d.category);
  const produktif = debts.filter(d => d.category === 'produktif');
  const totalKons = konsumtif.reduce((s,d) => s + parseVal(d.outstanding), 0);
  const totalProd = produktif.reduce((s,d) => s + parseVal(d.outstanding), 0);

  const allTypes  = [...KONSUMTIF, ...PRODUKTIF];

  const saveDebt = (data) => {
    if (editDebt) {
      setDebts(p => p.map(d => d.id === editDebt.id ? { ...d, ...data } : d));
    } else {
      setDebts(p => [...p, { ...data, id: Date.now().toString() }]);
    }
    setMode('list');
    setEditDebt(null);
  };

  const deleteDebt = (id) => setDebts(p => p.filter(d => d.id !== id));

  const displayedDebts = activeTab === 'konsumtif' ? konsumtif
    : activeTab === 'produktif' ? produktif
    : debts;

  return (
    <div style={{ paddingBottom:40 }}>

      {/* Header summary */}
      <Card T={T} style={{ marginBottom:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
          <div style={{ padding:'12px 14px', background:T.surface, borderRadius:11, border:`1px solid ${T.red}33` }}>
            <div style={{ color:T.muted, fontSize:9, letterSpacing:1.2, marginBottom:4 }}>TOTAL HUTANG</div>
            <div style={{ color:T.red, fontSize:16, fontWeight:'bold', fontFamily:"'Playfair Display',serif" }}>{fV(totalOutstanding)}</div>
            <div style={{ color:T.muted, fontSize:10, marginTop:2 }}>{debts.length} hutang aktif</div>
          </div>
          <div style={{ padding:'12px 14px', background:T.surface, borderRadius:11, border:`1px solid ${T.orange}33` }}>
            <div style={{ color:T.muted, fontSize:9, letterSpacing:1.2, marginBottom:4 }}>CICILAN / BULAN</div>
            <div style={{ color:T.orange||T.accent, fontSize:16, fontWeight:'bold', fontFamily:"'Playfair Display',serif" }}>{fV(totalMonthly)}</div>
            <div style={{ color:T.muted, fontSize:10, marginTop:2 }}>Total kewajiban bulanan</div>
          </div>
        </div>

        {/* Konsumtif vs Produktif bar */}
        {debts.length > 0 && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ color:T.red, fontSize:11, fontWeight:'bold' }}>🛒 Konsumtif</span>
                <InfoBtn T={T} content={"Hutang konsumtif digunakan untuk kebutuhan pribadi dan tidak menghasilkan pendapatan. Contoh: KPR rumah tinggal, kendaraan pribadi, kartu kredit, paylater."} />
              </div>
              <span style={{ color:T.red, fontSize:11, fontWeight:'bold' }}>{fV(totalKons)}</span>
            </div>
            <Bar pct={totalOutstanding > 0 ? (totalKons/totalOutstanding)*100 : 0} color={T.red} h={10} T={T} />
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ color:T.green, fontSize:11, fontWeight:'bold' }}>🏭 Produktif</span>
                <InfoBtn T={T} content={"Hutang produktif digunakan untuk menghasilkan pendapatan atau menambah aset produktif. Contoh: KUR, kredit modal kerja, KPR properti sewa, kredit investasi."} />
              </div>
              <span style={{ color:T.green, fontSize:11, fontWeight:'bold' }}>{fV(totalProd)}</span>
            </div>
            <Bar pct={totalOutstanding > 0 ? (totalProd/totalOutstanding)*100 : 0} color={T.green} h={10} T={T} />
            {totalOutstanding > 0 && (
              <div style={{ marginTop:10, padding:'8px 12px', background:T.surface, borderRadius:8, display:'flex', justifyContent:'space-between' }}>
                <span style={{ color:T.muted, fontSize:11 }}>Rasio Produktif</span>
                <span style={{ color: totalProd/totalOutstanding > 0.5 ? T.green : T.orange, fontSize:12, fontWeight:'bold' }}>
                  {((totalProd/totalOutstanding)*100).toFixed(0)}%
                  {totalProd/totalOutstanding > 0.5 ? ' - Sehat' : ' - Perlu Perhatian'}
                </span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Debt limit enforcement */}
      {mode === 'list' && (() => {
        const maxDebts = isProPlus ? Infinity : isPro ? 15 : 5;
        const atLimit = debts.length >= maxDebts;
        return atLimit ? (
          <div style={{ marginBottom:16, padding:'12px 14px', background:T.redDim, borderRadius:10, border:`1px solid ${T.red}33`, textAlign:'center' }}>
            <div style={{ color:T.red, fontSize:12, fontWeight:'bold', marginBottom:2 }}>
              Batas {maxDebts} hutang untuk tier {isProPlus?'Pro+':isPro?'Pro':'Free'} tercapai
            </div>
            {!isProPlus && (
              <div style={{ color:T.muted, fontSize:11 }}>
                {isPro ? 'Upgrade Pro+ untuk hutang unlimited' : 'Upgrade Pro untuk hingga 15 hutang'}
              </div>
            )}
          </div>
        ) : (
          <button onClick={()=>{setEditDebt(null);setMode('add');}} style={{ width:'100%', marginBottom:16, padding:'12px 0', borderRadius:10, border:`1px dashed ${T.accentSoft}`, background:T.accentDim, color:T.accent, cursor:'pointer', fontSize:13, fontWeight:'bold' }}>
            + Tambah Hutang
          </button>
        );
      })()}

      {/* Form */}
      {(mode === 'add' || mode === 'edit') && (
        <Card T={T} style={{ marginBottom:16, border:`1px solid ${T.accentSoft}` }}>
          <SL T={T}>{mode === 'edit' ? 'Edit Hutang' : 'Tambah Hutang Baru'}</SL>
          <DebtForm
            T={T}
            onSave={saveDebt}
            onCancel={()=>{setMode('list');setEditDebt(null);}}
            editData={editDebt}
            assets={assets}
            isPro={isPro}
            isProPlus={isProPlus}
          />
        </Card>
      )}

      {/* Filter tabs */}
      {mode === 'list' && debts.length > 0 && (
        <>
          <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            {[['all','Semua'],['konsumtif','🛒 Konsumtif'],['produktif','🏭 Produktif']].map(([id,label])=>(
              <button key={id} onClick={()=>setActiveTab(id)} style={{ flex:1, padding:'8px 0', borderRadius:9, border:`1px solid ${activeTab===id?T.accent:T.border}`, background:activeTab===id?T.accentDim:T.surface, color:activeTab===id?T.accent:T.muted, cursor:'pointer', fontSize:11, fontWeight:activeTab===id?'bold':'normal' }}>
                {label}
              </button>
            ))}
          </div>

          {/* Debt list */}
          {displayedDebts.map(d => {
            const typeDef = allTypes.find(t => t.key === d.type) || { icon:'📄', label:'Hutang', color:T.muted };
            const isRev   = typeDef.mode === 'revolving';
            const plafon  = parseVal(d.plafon);
            const outstanding = parseVal(d.outstanding);
            const utilisasi = isRev && plafon > 0 ? (outstanding / plafon) * 100 : 0;
            const renewalDaysLeft = d.renewalDate
              ? Math.ceil((new Date(d.renewalDate+'-01') - new Date()) / (1000*60*60*24))
              : null;

            return (
              <Card key={d.id} T={T} style={{ marginBottom:10 }} glow={utilisasi > 80 && isProPlus ? T.red : undefined}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <span style={{ fontSize:22 }}>{typeDef.icon}</span>
                    <div>
                      <div style={{ color:T.text, fontSize:13, fontWeight:600 }}>{d.name}</div>
                      <div style={{ display:'flex', gap:6, marginTop:2, flexWrap:'wrap' }}>
                        <span style={{ fontSize:9, padding:'1px 7px', borderRadius:4, background:(d.category==='produktif'?T.green:T.red)+'22', color:d.category==='produktif'?T.green:T.red, fontWeight:700 }}>
                          {d.category==='produktif'?'Produktif':'Konsumtif'}
                        </span>
                        <span style={{ fontSize:9, padding:'1px 7px', borderRadius:4, background:T.surface, color:T.muted }}>{typeDef.label}</span>
                        {isRev && <span style={{ fontSize:9, padding:'1px 7px', borderRadius:4, background:T.accentDim, color:T.accent }}>Revolving</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ color:T.red, fontSize:14, fontWeight:'bold', fontFamily:"'Playfair Display',serif" }}>{fV(outstanding)}</div>
                    <div style={{ color:T.muted, fontSize:9 }}>outstanding</div>
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:7, marginBottom:10 }}>
                  <div style={{ padding:'7px 8px', background:T.surface, borderRadius:8 }}>
                    <div style={{ color:T.muted, fontSize:9 }}>{isRev?'Bunga/Bln':'Cicilan/Bln'}</div>
                    <div style={{ color:T.orange||T.accent, fontSize:11, fontWeight:'bold' }}>{fV(parseVal(d.monthlyPayment))}</div>
                  </div>
                  <div style={{ padding:'7px 8px', background:T.surface, borderRadius:8 }}>
                    <div style={{ color:T.muted, fontSize:9 }}>Bunga/Thn</div>
                    <div style={{ color:T.text, fontSize:11, fontWeight:'bold' }}>{d.interestRate||'-'}%</div>
                  </div>
                  {plafon > 0 ? (
                    <div style={{ padding:'7px 8px', background:T.surface, borderRadius:8 }}>
                      <div style={{ color:T.muted, fontSize:9 }}>Utilisasi</div>
                      <div style={{ color:utilisasi>80?T.red:utilisasi>60?T.orange:T.green, fontSize:11, fontWeight:'bold' }}>{utilisasi.toFixed(0)}%</div>
                    </div>
                  ) : d.endYearMonth ? (
                    <div style={{ padding:'7px 8px', background:T.surface, borderRadius:8 }}>
                      <div style={{ color:T.muted, fontSize:9 }}>Lunas</div>
                      <div style={{ color:T.text, fontSize:11, fontWeight:'bold' }}>{d.endYearMonth}</div>
                    </div>
                  ) : (
                    <div style={{ padding:'7px 8px', background:T.surface, borderRadius:8 }}>
                      <div style={{ color:T.muted, fontSize:9 }}>Tenor</div>
                      <div style={{ color:T.text, fontSize:11, fontWeight:'bold' }}>{d.tenorMonths||'-'} bln</div>
                    </div>
                  )}
                </div>

                {/* Utilisasi bar for revolving */}
                {isRev && plafon > 0 && (
                  <div style={{ marginBottom:8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:T.muted, marginBottom:3 }}>
                      <span>Utilisasi {fV(outstanding)} / {fV(plafon)}</span>
                      <span style={{ color:utilisasi>80?T.red:T.green }}>{utilisasi.toFixed(1)}%</span>
                    </div>
                    <Bar pct={utilisasi} color={utilisasi>80?T.red:utilisasi>60?T.orange:T.green} h={6} T={T} />
                    {utilisasi > 80 && isProPlus && (
                      <div style={{ marginTop:6, padding:'6px 10px', background:T.redDim, borderRadius:7, fontSize:10, color:T.red }}>
                        ⚠ Utilisasi tinggi - pertimbangkan kurangi penarikan atau setor sebagian
                      </div>
                    )}
                  </div>
                )}

                {/* Renewal warning */}
                {renewalDaysLeft !== null && renewalDaysLeft <= 60 && (
                  <div style={{ marginBottom:8, padding:'6px 10px', background:renewalDaysLeft<=14?T.redDim:T.accentDim, borderRadius:7, fontSize:10, color:renewalDaysLeft<=14?T.red:T.accent }}>
                    {renewalDaysLeft <= 0 ? '⚠ Renewal sudah jatuh tempo!' : `⏰ Renewal dalam ${renewalDaysLeft} hari`}
                  </div>
                )}

                {d.notes && <div style={{ color:T.muted, fontSize:10, marginBottom:8, fontStyle:'italic' }}>{d.notes}</div>}

                <div style={{ display:'flex', gap:8 }}>
                  <TBtn T={T} variant="ghost" onClick={()=>{setEditDebt(d);setMode('edit');window.scrollTo({top:0,behavior:'smooth'});}} style={{ flex:1, padding:'7px 0', fontSize:11 }}>✎ Edit</TBtn>
                  <TBtn T={T} variant="danger" onClick={()=>deleteDebt(d.id)} style={{ padding:'7px 14px', fontSize:11 }}>✕</TBtn>
                </div>
              </Card>
            );
          })}

          {displayedDebts.length === 0 && (
            <div style={{ textAlign:'center', padding:'24px', color:T.muted, fontSize:12 }}>
              Belum ada hutang {activeTab !== 'all' ? activeTab : ''} yang dicatat
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {mode === 'list' && debts.length === 0 && (
        <div style={{ textAlign:'center', padding:'40px 24px', background:T.card, borderRadius:14, border:`1px dashed ${T.border}` }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
          <div style={{ color:T.textSoft, fontSize:14, fontWeight:'bold', marginBottom:8 }}>Belum ada catatan hutang</div>
          <div style={{ color:T.muted, fontSize:12, lineHeight:1.6 }}>Catat hutang Anda untuk memantau kewajiban bulanan dan Net Worth yang akurat.</div>
        </div>
      )}
    </div>
  );
}

export { DebtScene };

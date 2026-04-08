import React, { useState, useMemo } from 'react';
import { Card, SL, Bar, TInput, TSelect, TBtn, InfoBtn } from '../components/ui';
import { fM, parseVal } from '../utils/helpers';
import { getBillingPeriod } from '../utils/creditSync';

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
  installmentDay: '',   // day of month angsuran jatuh (1-31)
  // Mode B fields
  outstanding: '',
  interestRate: '',
  tenorMonths: '',
  // Revolving / Mode C — renewal date split for day precision
  plafon: '',
  renewalDay: '',
  renewalMonth: '',
  renewalYear: '',
  // Notification settings
  notifyEnabled: false,
  notifyDaysBefore: '3',
  // Shared
  notes: '',
  linkedAssetId: '',
};

function DebtForm({ onSave, onCancel, T, editData, assets = [], isPro = false, isProPlus = false, ajWallets = [], ajTransactions = [] }) {
  const allTypes = [...KONSUMTIF, ...PRODUKTIF];
  const [f, setF] = useState(() => {
    if (editData) {
      const state = {
        ...EMPTY_FORM,
        ...editData,
        // editData is saved as {type: "paylater", ...} — map type→key so the
        // form picker shows the correct value (not the EMPTY_FORM default 'kpr')
        key: editData.key || editData.type || EMPTY_FORM.key,
        renewalDay: '', renewalMonth: '', renewalYear: '',
      };
      if (editData.renewalDate) {
        const parts = editData.renewalDate.split('-');
        state.renewalYear  = parts[0] || '';
        state.renewalMonth = parts[1] || '';
        state.renewalDay   = parts[2] || '';
      }
      return state;
    }
    return EMPTY_FORM;
  });
  const setFF = (k, v) => setF(p => ({ ...p, [k]: v }));

  const typeList  = f.category === 'konsumtif' ? KONSUMTIF : PRODUKTIF;
  const typeDef   = allTypes.find(t => t.key === f.key) || allTypes[0];
  const isRevolving = typeDef.mode === 'revolving';
  // Bug fix: explicit 0 from user must not fall back to DEFAULT_RATE
  const effectiveRate = f.interestRate !== '' ? parseVal(f.interestRate) : (DEFAULT_RATE[f.key] ?? 10);

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
    // Revolving: always bunga/bulan = outstanding * rate/12
    if (isRevolving) return derivedOutstanding * (effectiveRate / 100 / 12);
    if (f.inputMode === 'A') return parseVal(f.monthlyPayment);
    const tenor = parseInt(f.tenorMonths) || 12;
    return derivedOutstanding > 0 ? calcMonthlyPayment(derivedOutstanding, effectiveRate, tenor) : 0;
  }, [f.inputMode, f.monthlyPayment, isRevolving, derivedOutstanding, effectiveRate, f.tenorMonths]);

  const utilisasi = isRevolving && parseVal(f.plafon) > 0
    ? (parseVal(f.outstanding) / parseVal(f.plafon)) * 100 : 0;

  // Net minimum outstanding = gross expenses − debt payments within current billing period.
  // Billing period: if renewalDate set → cycle from renewal day; else calendar month.
  const { minOutstandingFromAJ, ajGrossSpend, ajPayments } = useMemo(() => {
    const zero = { minOutstandingFromAJ: 0, ajGrossSpend: 0, ajPayments: 0 };
    if (!editData || !isRevolving) return zero;
    const debtTypeKeys = { cc: "Kartu Kredit", paylater: "Paylater" };
    const walletType = debtTypeKeys[editData.type || f.key];
    if (!walletType) return zero;

    // Linked wallets: by explicit debtId OR unlinked wallet of matching type
    const linkedWallets = ajWallets.filter(w =>
      w.debtId === editData.id ||
      (w.type === walletType && !w.debtId)
    );
    if (linkedWallets.length === 0) return zero;
    const linkedIds = new Set(linkedWallets.map(w => w.id));

    // Filter to current billing period (matching Rule 5 / creditSync.js)
    const { start, end } = getBillingPeriod(editData);
    const inPeriod = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr + "T00:00:00");
      return d >= start && d <= end;
    };

    // Gross spending via these wallets within billing period
    const grossSpend = ajTransactions
      .filter(t => t.type === "expense" && linkedIds.has(t.walletId) && inPeriod(t.date))
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);

    // Debt payments recorded against this debt in AJ within billing period
    const payments = ajTransactions
      .filter(t => t.type === "debt_payment" && t.debtId === editData.id && inPeriod(t.date))
      .reduce((s, t) => s + (Number(t.amount) || 0), 0);

    const net = Math.max(0, grossSpend - payments);
    return { minOutstandingFromAJ: net, ajGrossSpend: grossSpend, ajPayments: payments };
  }, [editData, isRevolving, ajWallets, ajTransactions, f.key]);

  // Synced = CC/Paylater debt that has at least one linked AJ wallet.
  // When synced, outstanding is read-only (source of truth = Artha Journey).
  const isSynced = useMemo(() => {
    if (!editData || !isRevolving) return false;
    const debtTypeKeys = { cc: "Kartu Kredit", paylater: "Paylater" };
    const walletType = debtTypeKeys[editData.type || f.key];
    if (!walletType) return false;
    return ajWallets.some(w =>
      w.debtId === editData.id ||
      (w.type === walletType && !w.debtId)
    );
  }, [editData, isRevolving, ajWallets, f.key]);

  // Synced debts skip the floor check — outstanding is managed by AJ automatically
  const canSave = f.name.trim() && derivedOutstanding > 0 && (isSynced || derivedOutstanding >= minOutstandingFromAJ);

  const handleSave = () => {
    if (!canSave) return;
    const renewalDate = (f.renewalYear && f.renewalMonth)
      ? `${f.renewalYear}-${f.renewalMonth}${f.renewalDay ? '-' + String(f.renewalDay).padStart(2,'0') : ''}`
      : '';
    onSave({
      id: editData?.id || Date.now().toString(),
      category: f.category,
      type: f.key,
      name: f.name,
      outstanding: String(Math.round(derivedOutstanding)),
      monthlyPayment: String(Math.round(derivedMonthlyPayment)),
      interestRate: String(effectiveRate),
      plafon: f.plafon || '0',
      renewalDate,
      linkedAssetId: f.linkedAssetId || '',
      notes: f.notes || '',
      inputMode: f.inputMode,
      endYearMonth: f.endYearMonth || '',
      tenorMonths: f.tenorMonths || '',
      installmentDay: f.installmentDay || '',
      notifyEnabled: f.notifyEnabled || false,
      notifyDaysBefore: f.notifyDaysBefore || '3',
    });
  };

  const fV = v => fM(v, 'IDR', false);
  const inp = { width:'100%', background:T.inputBg, border:`1px solid ${T.border}`, color:T.text, borderRadius:9, padding:'10px 12px', fontSize:12, outline:'none', boxSizing:'border-box' };
  const DAYS   = Array.from({length:31},(_,i)=>String(i+1).padStart(2,'0'));
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
            <div style={{ color:T.muted, fontSize:10, marginBottom:4 }}>Tanggal Angsuran per Bulan (opsional)</div>
            <select value={f.installmentDay} onChange={e=>setFF('installmentDay',e.target.value)} style={{...inp}}>
              <option value="">Pilih tanggal (opsional)</option>
              {DAYS.map(d=><option key={d} value={d}>Tanggal {parseInt(d,10)}</option>)}
            </select>
            {f.installmentDay && <div style={{ color:T.muted, fontSize:9, marginTop:3 }}>Cicilan jatuh setiap tanggal {parseInt(f.installmentDay,10)} tiap bulan</div>}
          </div>
          <div>
            <div style={{ color:T.muted, fontSize:10, marginBottom:4, display:'flex', alignItems:'center', gap:4 }}>
              Suku Bunga / Thn (%) - opsional
              <InfoBtn T={T} content={`Jika tidak diisi, digunakan asumsi default ${DEFAULT_RATE[f.key]||10}% untuk estimasi outstanding. Isi 0 untuk hutang tanpa bunga.`} />
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
            <div style={{ color:T.muted, fontSize:10, marginBottom:4, display:'flex', alignItems:'center', gap:4 }}>
              Outstanding Saat Ini (IDR){!isSynced && ' *'}
              {!isSynced && <span style={{ color:T.muted, fontSize:9 }}> - yang dihitung sebagai hutang</span>}
              {isSynced && <InfoBtn T={T} content={"Data otomatis dari Artha Journey. Update melalui Artha Journey."} />}
            </div>
            <input
              value={f.outstanding}
              readOnly={isSynced}
              onChange={isSynced ? undefined : e => setFF('outstanding', e.target.value)}
              placeholder="200000000"
              style={{
                ...inp,
                ...(isSynced ? { background: T.surface, color: T.muted, cursor: 'not-allowed', opacity: 0.75 } : {}),
                borderColor: (!isSynced && minOutstandingFromAJ > 0 && parseVal(f.outstanding) < minOutstandingFromAJ) ? T.red : inp.borderColor,
              }}
            />
            {/* Synced badge: outstanding managed by Artha Journey */}
            {isSynced && (
              <div style={{ marginTop: 6, padding: '8px 12px', background: T.accentDim, border: `1px solid ${T.accentSoft||T.accent}`, borderRadius: 8, fontSize: 11, color: T.accent, display: 'flex', alignItems: 'center', gap: 6 }}>
                🔗 Data otomatis dari Artha Journey. Update melalui Artha Journey.
              </div>
            )}
            {/* AJ integration breakdown — shown for synced (info) and non-synced (floor guard) */}
            {(minOutstandingFromAJ > 0 || ajGrossSpend > 0) && (
              <div style={{ marginTop: 6, padding: '10px 12px', background: (!isSynced && parseVal(f.outstanding) < minOutstandingFromAJ && minOutstandingFromAJ > 0) ? T.red + '22' : T.surface, border: `1px solid ${(!isSynced && parseVal(f.outstanding) < minOutstandingFromAJ && minOutstandingFromAJ > 0) ? T.red : T.border}`, borderRadius: 8, fontSize: 11, lineHeight: 1.7 }}>
                {/* Spend / Payment breakdown */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: T.muted }}>Pengeluaran via Artha Journey</span>
                  <span style={{ color: T.red, fontWeight: 600 }}>Rp {ajGrossSpend.toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: T.muted }}>Pembayaran hutang di AJ</span>
                  <span style={{ color: T.green, fontWeight: 600 }}>- Rp {ajPayments.toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 5, borderTop: `1px solid ${T.border}`, fontWeight: 700 }}>
                  <span style={{ color: T.text }}>Net outstanding periode ini</span>
                  <span style={{ color: minOutstandingFromAJ > 0 ? T.orange : T.green }}>Rp {minOutstandingFromAJ.toLocaleString('id-ID')}</span>
                </div>
                {/* Error when below floor — only for non-synced */}
                {!isSynced && parseVal(f.outstanding) < minOutstandingFromAJ && minOutstandingFromAJ > 0 && (
                  <div style={{ marginTop: 8, padding: '7px 10px', background: T.red + '22', borderRadius: 6, color: T.red, fontWeight: 600 }}>
                    ⛔ Outstanding tidak boleh lebih rendah dari net pengeluaran. Lakukan pembayaran hutang terlebih dahulu di Artha Journey.
                  </div>
                )}
              </div>
            )}
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
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:5 }}>
                <select value={f.renewalDay} onChange={e=>setFF('renewalDay',e.target.value)} style={{...inp,padding:'10px 6px'}}>
                  <option value="">Tgl</option>
                  {DAYS.map(d=><option key={d} value={d}>{parseInt(d,10)}</option>)}
                </select>
                <select value={f.renewalMonth} onChange={e=>setFF('renewalMonth',e.target.value)} style={{...inp,padding:'10px 6px'}}>
                  <option value="">Bln</option>
                  {MONTHS.map(m=><option key={m.v} value={m.v}>{m.l}</option>)}
                </select>
                <select value={f.renewalYear} onChange={e=>setFF('renewalYear',e.target.value)} style={{...inp,padding:'10px 6px'}}>
                  <option value="">Thn</option>
                  {YEARS.map(y=><option key={y.v} value={y.v}>{y.l}</option>)}
                </select>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Link to asset - Pro & Pro+ only (produktif + KPR konsumtif) */}
      {isPro && (f.category === 'produktif' || f.key === 'kpr') && (
        <div>
          <div style={{ color:T.muted, fontSize:10, marginBottom:4, display:'flex', alignItems:'center', gap:4 }}>
            {isProPlus
              ? (f.key === 'kpr' ? 'Link ke Properti (ekuitas bersih)' : 'Link ke Aset (mempengaruhi ROI)')
              : 'Referensi Aset'}
            <InfoBtn T={T} content={isProPlus
              ? (f.key === 'kpr'
                ? "Pro+: saldo KPR ini akan mengurangi ekuitas bersih properti terkait secara otomatis."
                : "Pro+: bunga hutang ini akan mengurangi ROI aset terkait secara otomatis.")
              : "Pro: catatan referensi saja, tidak mempengaruhi kalkulasi."} />
          </div>
          <select value={f.linkedAssetId} onChange={e=>setFF('linkedAssetId',e.target.value)} style={{...inp}}>
            <option value="">Pilih aset (opsional)</option>
            {assets
              .filter(a => f.key === 'kpr' ? a.classKey === 'property' : ['property','business'].includes(a.classKey))
              .map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      )}

      {/* Notes */}
      <div>
        <div style={{ color:T.muted, fontSize:10, marginBottom:4 }}>Catatan (opsional)</div>
        <input value={f.notes} onChange={e=>setFF('notes',e.target.value)} placeholder="Bank, no. rekening, dll" style={inp} />
      </div>

      {/* Notification settings — Pro & Pro+ only, requires installmentDay or renewalDate */}
      {isPro && (isRevolving ? (f.renewalYear && f.renewalMonth) : f.installmentDay) && (
        <div style={{ padding:'12px 14px', background:T.surface, borderRadius:10, border:`1px solid ${T.border}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: f.notifyEnabled ? 10 : 0 }}>
            <div>
              <div style={{ color:T.text, fontSize:12, fontWeight:'bold' }}>🔔 Notifikasi Jatuh Tempo</div>
              <div style={{ color:T.muted, fontSize:10 }}>{isProPlus ? 'Pro+: pilih H-1 hingga H-7' : 'Pro: default H-3'}</div>
            </div>
            <button
              type="button"
              onClick={() => setFF('notifyEnabled', !f.notifyEnabled)}
              style={{ width:40, height:22, borderRadius:11, border:'none', cursor:'pointer', background:f.notifyEnabled?T.accent:T.border, position:'relative', transition:'all 0.2s', flexShrink:0 }}
            >
              <span style={{ position:'absolute', top:2, width:18, height:18, borderRadius:9, background:'#fff', transition:'all 0.2s', left:f.notifyEnabled?20:2 }} />
            </button>
          </div>
          {f.notifyEnabled && (
            isProPlus ? (
              <div>
                <div style={{ color:T.muted, fontSize:10, marginBottom:6 }}>Ingatkan berapa hari sebelum:</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
                  {['7','6','5','4','3','2','1'].map(d=>(
                    <button key={d} type="button" onClick={()=>setFF('notifyDaysBefore',d)}
                      style={{ padding:'6px 2px', borderRadius:7, border:`1px solid ${f.notifyDaysBefore===d?T.accent:T.border}`, background:f.notifyDaysBefore===d?T.accentDim:T.surface, color:f.notifyDaysBefore===d?T.accent:T.muted, cursor:'pointer', fontSize:10, fontWeight:'bold' }}>
                      H-{d}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding:'7px 10px', background:T.accentDim, borderRadius:8, fontSize:11, color:T.accent, fontWeight:'bold' }}>
                ⚡ H-3 · Notifikasi 3 hari sebelum jatuh tempo
              </div>
            )
          )}
        </div>
      )}

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
// HELPERS
// ============================================================
function getNextInstallmentDate(dayStr) {
  const day = parseInt(dayStr, 10);
  if (!day || day < 1 || day > 31) return null;
  const now = new Date();
  let target = new Date(now.getFullYear(), now.getMonth(), day);
  if (target <= now) target = new Date(now.getFullYear(), now.getMonth() + 1, day);
  return target;
}

function formatRenewalDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const MONTH_NAMES = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
    const m = parseInt(parts[1], 10) - 1;
    return `${parseInt(parts[2],10)} ${MONTH_NAMES[m]} ${parts[0]}`;
  }
  if (parts.length === 2) {
    const MONTH_NAMES = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
    const m = parseInt(parts[1], 10) - 1;
    return `${MONTH_NAMES[m]} ${parts[0]}`;
  }
  return dateStr;
}

// ============================================================
// E-STATEMENT MODAL (Wealth Pulse — unsynced CC/Paylater only)
// Extracts: total_tagihan, tanggal_jatuh_tempo, sisa_cicilan, sisa_limit
// ============================================================
function EStatementModal({ debt, T, onClose, onApply }) {
  const [step, setStep]       = useState(1); // 1=upload, 2=scanning, 3=review
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setError('');
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const doScan = async () => {
    if (!file) return;
    setStep(2);
    setError('');
    try {
      const reader = new FileReader();
      await new Promise((resolve, reject) => {
        reader.onload = resolve;
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const base64 = reader.result.split(',')[1];
      const mimeType = file.type || 'image/jpeg';
      const res = await fetch('/api/scan-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType, mode: 'summary' }),
      });
      if (!res.ok) {
        let msg = 'Scan gagal (server error)';
        try { const b = await res.json(); msg = b.error || msg; } catch {}
        throw new Error(msg);
      }
      const data = await res.json();
      if (!data.total_tagihan && !data.tanggal_jatuh_tempo) {
        throw new Error('Tidak ada data terdeteksi. Pastikan gambar e-statement jelas dan terbaca.');
      }
      setResult(data);
      setStep(3);
    } catch (err) {
      setError('Scan gagal: ' + (err.message || 'Terjadi kesalahan.'));
      setStep(1);
    }
  };

  const handleApply = () => {
    if (!result) return;
    const updates = {};
    if (result.total_tagihan > 0)     updates.outstanding  = String(Math.round(result.total_tagihan));
    if (result.tanggal_jatuh_tempo)   updates.renewalDate  = result.tanggal_jatuh_tempo;
    if (result.sisa_limit > 0) {
      const used = result.total_tagihan || 0;
      updates.plafon = String(Math.round(result.sisa_limit + used));
    }
    onApply(updates);
    onClose();
  };

  const fV = v => v ? `Rp ${Number(v).toLocaleString('id-ID')}` : '—';
  const overlay = { position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1000, display:'flex', alignItems:'flex-end', justifyContent:'center' };
  const sheet   = { background:T.card, borderRadius:'16px 16px 0 0', width:'100%', maxWidth:480, maxHeight:'85vh', overflow:'auto', paddingBottom:24 };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={sheet}>
        <div style={{ padding:'16px 20px 12px', borderBottom:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontWeight:700, fontSize:15, color:T.text }}>📄 Upload E-Statement CC</div>
            <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{debt.name}</div>
          </div>
          <button onClick={onClose} style={{ background:T.surface, border:'none', borderRadius:20, padding:'6px 12px', color:T.textSoft, cursor:'pointer', fontSize:13 }}>✕</button>
        </div>

        <div style={{ padding:'16px 20px' }}>
          {error && <div style={{ padding:'10px 14px', background:T.red+'20', border:`1px solid ${T.red}44`, borderRadius:8, color:T.red, fontSize:12, marginBottom:12 }}>{error}</div>}

          {/* Step 1: Upload */}
          {step === 1 && (
            <div>
              <div style={{ fontSize:11, color:T.muted, marginBottom:12, lineHeight:1.6 }}>
                Upload foto atau screenshot e-statement kartu kredit. AI akan mengekstrak total tagihan, tanggal jatuh tempo, dan sisa limit.
              </div>
              {!preview ? (
                <label style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'28px', borderRadius:12, border:`2px dashed ${T.accentSoft}`, background:T.surface, cursor:'pointer', gap:8 }}>
                  <span style={{ fontSize:36 }}>📷</span>
                  <span style={{ color:T.accent, fontSize:13, fontWeight:700 }}>Pilih Gambar E-Statement</span>
                  <span style={{ color:T.muted, fontSize:11 }}>JPG, PNG, WebP</span>
                  <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => handleFile(e.target.files?.[0])} />
                </label>
              ) : (
                <div>
                  <img src={preview} alt="preview" style={{ width:'100%', borderRadius:10, maxHeight:220, objectFit:'contain', background:T.surface }} />
                  <div style={{ display:'flex', gap:8, marginTop:10 }}>
                    <button onClick={() => { setFile(null); setPreview(null); }} style={{ flex:1, padding:'9px', borderRadius:9, border:`1px solid ${T.border}`, background:T.surface, color:T.textSoft, cursor:'pointer', fontSize:12 }}>Ganti Gambar</button>
                    <button onClick={doScan} style={{ flex:2, padding:'9px', borderRadius:9, border:'none', background:T.accent, color:'#000', cursor:'pointer', fontSize:12, fontWeight:700 }}>
                      Scan E-Statement
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Scanning */}
          {step === 2 && (
            <div style={{ textAlign:'center', padding:'32px 16px' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🤖</div>
              <div style={{ fontWeight:700, fontSize:15, color:T.text, marginBottom:8 }}>AI sedang membaca e-statement...</div>
              <div style={{ fontSize:12, color:T.muted, marginBottom:20 }}>Mengekstrak total tagihan, tanggal jatuh tempo, dan sisa limit</div>
              <div style={{ display:'flex', justifyContent:'center', gap:8 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:10, height:10, borderRadius:'50%', background:T.accent, animation:`wcPulse 1.2s ${i*0.4}s ease-in-out infinite` }} />
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Review & Apply */}
          {step === 3 && result && (
            <div>
              <div style={{ fontSize:12, color:T.muted, marginBottom:12 }}>Konfirmasi data berikut akan diterapkan ke hutang <strong style={{ color:T.text }}>{debt.name}</strong>:</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
                {[
                  { label:'Total Tagihan', value: fV(result.total_tagihan), highlight: true },
                  { label:'Tanggal Jatuh Tempo', value: result.tanggal_jatuh_tempo || '—' },
                  { label:'Sisa Cicilan', value: result.sisa_cicilan > 0 ? fV(result.sisa_cicilan) : '—' },
                  { label:'Sisa Limit', value: result.sisa_limit > 0 ? fV(result.sisa_limit) : '—' },
                ].map(row => (
                  <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', background:T.surface, borderRadius:9 }}>
                    <span style={{ fontSize:12, color:T.muted }}>{row.label}</span>
                    <span style={{ fontSize:13, fontWeight:700, color: row.highlight ? T.red : T.text }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding:'10px 12px', background:T.accentDim, borderRadius:9, fontSize:11, color:T.accent, marginBottom:14 }}>
                ℹ️ Total tagihan akan digunakan sebagai <strong>Outstanding</strong>. Tanggal jatuh tempo sebagai <strong>Renewal Date</strong>.
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => { setStep(1); setResult(null); }} style={{ flex:1, padding:'10px', borderRadius:9, border:`1px solid ${T.border}`, background:T.surface, color:T.textSoft, cursor:'pointer', fontSize:12 }}>← Scan Ulang</button>
                <button onClick={handleApply} style={{ flex:2, padding:'10px', borderRadius:9, border:'none', background:T.accent, color:'#000', cursor:'pointer', fontSize:13, fontWeight:700 }}>✅ Terapkan</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN SCENE
// ============================================================
function DebtScene({ debts = [], setDebts, assets = [], dispCur, tier, T, hideValues = false, isPro = false, isProPlus = false, ajWallets = [], ajTransactions = [] }) {
  const fV = (v) => fM(v, dispCur, hideValues);
  const [mode, setMode]         = useState('list');
  const [editDebt, setEditDebt] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [statementDebt, setStatementDebt] = useState(null); // debt being statement-uploaded

  const totalOutstanding = debts.reduce((s, d) => s + parseVal(d.outstanding), 0);
  const getAllTypes = () => [...KONSUMTIF, ...PRODUKTIF];
  const getMonthlyForDebt = (d) => {
    const typeDef = getAllTypes().find(t => t.key === d.type);
    if (typeDef?.mode === 'revolving') {
      const rate = parseVal(d.interestRate) || DEFAULT_RATE[d.type] || 10;
      return parseVal(d.outstanding) * (rate / 100 / 12);
    }
    return parseVal(d.monthlyPayment);
  };
  const totalMonthly = debts.reduce((s, d) => s + getMonthlyForDebt(d), 0);

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

  const applyStatement = (debtId, updates) => {
    setDebts(p => p.map(d => d.id === debtId ? { ...d, ...updates } : d));
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
            key={editDebt?.id || 'new'}
            T={T}
            onSave={saveDebt}
            onCancel={()=>{setMode('list');setEditDebt(null);}}
            editData={editDebt}
            assets={assets}
            isPro={isPro}
            isProPlus={isProPlus}
            ajWallets={ajWallets}
            ajTransactions={ajTransactions}
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
              ? (() => {
                  const s = d.renewalDate.length === 7 ? d.renewalDate + '-01' : d.renewalDate;
                  return Math.ceil((new Date(s) - new Date()) / (1000*60*60*24));
                })()
              : null;
            const nextInstallDate = d.installmentDay ? getNextInstallmentDate(d.installmentDay) : null;
            const installmentDaysLeft = nextInstallDate ? Math.ceil((nextInstallDate - new Date()) / (1000*60*60*24)) : null;
            const notifyThreshold = d.notifyEnabled ? parseInt(d.notifyDaysBefore || '3', 10) : null;

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
                    <div style={{ color:T.orange||T.accent, fontSize:11, fontWeight:'bold' }}>{fV(getMonthlyForDebt(d), dispCur)}</div>
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

                {/* Renewal date chip */}
                {isRev && d.renewalDate && (
                  <div style={{ marginBottom:6, display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:9, padding:'2px 8px', borderRadius:6, background:T.surface, color:T.muted, border:`1px solid ${T.border}` }}>
                      📅 Renewal: {formatRenewalDate(d.renewalDate)}
                    </span>
                    {d.notifyEnabled && <span style={{ fontSize:9, padding:'2px 8px', borderRadius:6, background:T.accentDim, color:T.accent, border:`1px solid ${T.accentSoft}` }}>🔔 H-{d.notifyDaysBefore||3}</span>}
                  </div>
                )}

                {/* Installment date chip — non-revolving */}
                {!isRev && d.installmentDay && (
                  <div style={{ marginBottom:6, display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:9, padding:'2px 8px', borderRadius:6, background:T.surface, color:T.muted, border:`1px solid ${T.border}` }}>
                      📅 Cicilan tgl {parseInt(d.installmentDay,10)}{installmentDaysLeft !== null ? ` · ${installmentDaysLeft} hari lagi` : ''}
                    </span>
                    {d.notifyEnabled && <span style={{ fontSize:9, padding:'2px 8px', borderRadius:6, background:T.accentDim, color:T.accent, border:`1px solid ${T.accentSoft}` }}>🔔 H-{d.notifyDaysBefore||3}</span>}
                  </div>
                )}

                {/* Renewal warning */}
                {isRev && renewalDaysLeft !== null && renewalDaysLeft <= 60 && (
                  <div style={{ marginBottom:8, padding:'6px 10px', background:renewalDaysLeft<=14?T.redDim:T.accentDim, borderRadius:7, fontSize:10, color:renewalDaysLeft<=14?T.red:T.accent, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span>{renewalDaysLeft <= 0 ? '⚠ Renewal sudah jatuh tempo!' : `⏰ Renewal dalam ${renewalDaysLeft} hari`}</span>
                    {isProPlus && renewalDaysLeft > 0 && d.renewalDate && d.renewalDate.length === 10 && (
                      <a href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Renewal: '+d.name)}&dates=${d.renewalDate.replace(/-/g,'')}/${d.renewalDate.replace(/-/g,'')}&details=${encodeURIComponent('Jatuh tempo renewal '+d.name)}`} target="_blank" rel="noopener noreferrer" style={{ color:T.blue||T.accent, fontSize:9, textDecoration:'underline', whiteSpace:'nowrap' }}>
                        + GCal
                      </a>
                    )}
                  </div>
                )}

                {/* Installment alert — non-revolving */}
                {!isRev && notifyThreshold !== null && installmentDaysLeft !== null && installmentDaysLeft <= notifyThreshold && (
                  <div style={{ marginBottom:8, padding:'6px 10px', background:installmentDaysLeft<=3?T.redDim:T.accentDim, borderRadius:7, fontSize:10, color:installmentDaysLeft<=3?T.red:T.accent, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span>{installmentDaysLeft <= 0 ? '⚠ Angsuran jatuh tempo hari ini!' : `⏰ Angsuran dalam ${installmentDaysLeft} hari (tgl ${d.installmentDay})`}</span>
                    {isProPlus && nextInstallDate && (
                      <a href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Cicilan: '+d.name)}&dates=${nextInstallDate.toISOString().slice(0,10).replace(/-/g,'')}/${nextInstallDate.toISOString().slice(0,10).replace(/-/g,'')}&details=${encodeURIComponent('Angsuran bulanan '+d.name)}`} target="_blank" rel="noopener noreferrer" style={{ color:T.blue||T.accent, fontSize:9, textDecoration:'underline', whiteSpace:'nowrap' }}>
                        + GCal
                      </a>
                    )}
                  </div>
                )}

                {d.notes && <div style={{ color:T.muted, fontSize:10, marginBottom:8, fontStyle:'italic' }}>{d.notes}</div>}

                {/* E-Statement upload for CC/Paylater */}
                {isRev && (d.type === 'cc' || d.type === 'paylater') && (() => {
                  const isSynced = ajWallets.some(w => w.debtId === d.id);
                  return isSynced ? (
                    <div style={{ marginBottom:8, padding:'8px 12px', background:T.surface, borderRadius:9, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:18 }}>📄</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:11, fontWeight:600, color:T.muted }}>Upload E-Statement</div>
                        <div style={{ fontSize:10, color:T.accent, marginTop:1 }}>🔗 Upload dilakukan di Artha Journey</div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setStatementDebt(d)}
                      style={{ width:'100%', marginBottom:8, padding:'8px 12px', borderRadius:9, border:`1px solid ${T.border}`, background:T.surface, color:T.textSoft, cursor:'pointer', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', gap:6, justifyContent:'center' }}
                    >
                      📄 Upload E-Statement
                    </button>
                  );
                })()}
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

      {/* E-Statement modal */}
      {statementDebt && (
        <EStatementModal
          debt={statementDebt}
          T={T}
          onClose={() => setStatementDebt(null)}
          onApply={updates => applyStatement(statementDebt.id, updates)}
        />
      )}

      {/* Empty state */}
      {mode === 'list' && debts.length === 0 && (
        <div style={{ textAlign:'center', padding:'40px 24px', background:T.card, borderRadius:14, border:`1px dashed ${T.border}` }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
          <div style={{ color:T.textSoft, fontSize:14, fontWeight:'bold', marginBottom:8 }}>Belum ada catatan hutang</div>
          <div style={{ color:T.muted, fontSize:12, lineHeight:1.6, marginBottom:16 }}>
            Catat KPR, cicilan kendaraan, kartu kredit, atau pinjaman lainnya. Net Worth Anda akan otomatis terhitung setelah hutang dicatat.
          </div>
          <button
            onClick={() => setMode('add')}
            style={{ padding:'9px 22px', borderRadius:9, border:`1px solid ${T.accent}`, background:T.accentDim, color:T.accent, cursor:'pointer', fontSize:12, fontWeight:'bold' }}
          >
            + Catat Hutang Pertama
          </button>
        </div>
      )}
    </div>
  );
}

export { DebtScene };

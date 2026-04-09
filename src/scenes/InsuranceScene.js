import React, { useState, useMemo } from 'react';
import { Card, SL, Chip, Bar, TBtn, TInput, TSelect } from '../components/ui';
import { fM, parseVal, getIDR, FREQ_MULT, fv, calcLife, calcHealthInsurance, calcPropertyInsurance, calcVehicleInsurance, calcEducationInsurance, calcCreditInsurance } from '../utils/helpers';
import { INSURANCE_TYPES, LIQUID_ASSET_KEYS, FREQ_LABELS, INSURANCE_PRO_LIMIT } from '../constants/data';

// =========================================================
// CONSTANTS
// =========================================================
// INSURANCE_TYPES imported from data.js
const TYPE_EMOJI = { life:'fav', health:'hos', property:'hou', vehicle:'car', credit:'crd', travel:'fly' };
const TYPE_ICON  = { life:'X', health:'X', property:'X', vehicle:'X', credit:'X', travel:'X' };
const ITYPE_EMOJI = { life:'❤️', health:'🏥', property:'🏠', vehicle:'🚗', credit:'💳', travel:'✈️' };

// FREQ_LABELS imported from data.js
const PRO_LIMIT = INSURANCE_PRO_LIMIT;

const EMPTY_FORM = {
  name:'', type:'life', company:'',
  premium:'', premiumFreq:'annual',
  coverage:'', startDate:'', endDate:'', notes:'',
};

// Liquid asset classes only (truly cashable)
const LIQUID_KEYS = LIQUID_ASSET_KEYS;

// =========================================================
// CALCULATION ENGINES (from reference + improvements)
// =========================================================

// fv imported from helpers.js

// calcLife imported from helpers.js
// calcHealthInsurance imported from helpers.js
// calcPropertyInsurance imported from helpers.js
// calcVehicleInsurance imported from helpers.js
// calcEducationInsurance imported from helpers.js
// calcCreditInsurance imported from helpers.js
// =========================================================
// DROPDOWN COMPONENT
// =========================================================
function TypeDropdown({ value, onChange, T }) {
  const [open, setOpen] = useState(false);
  const selected = INSURANCE_TYPES.find(t => t.key === value);
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 9,
          border: `1px solid ${T.accentSoft}`, background: T.accentDim,
          color: T.accent, cursor: 'pointer', fontSize: 13,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontWeight: 'bold',
        }}
      >
        <span>{ITYPE_EMOJI[value]} {selected?.label}</span>
        <span style={{ fontSize: 10, opacity: 0.7 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, zIndex:99 }} />
          <div style={{
            position:'absolute', top:'calc(100% + 6px)', left:0, right:0,
            background: T.card, border:`1px solid ${T.border}`, borderRadius:10,
            zIndex:100, overflow:'hidden', boxShadow:`0 8px 24px ${T.shadow}`,
          }}>
            {INSURANCE_TYPES.map(t => (
              <div key={t.key}
                onClick={() => { onChange(t.key); setOpen(false); }}
                style={{
                  padding:'11px 14px', cursor:'pointer', fontSize:13,
                  background: value === t.key ? T.accentDim : 'transparent',
                  color: value === t.key ? T.accent : T.text,
                  display:'flex', alignItems:'center', gap:10,
                  borderBottom:`1px solid ${T.border}`,
                }}
              >
                <span style={{ fontSize:16 }}>{ITYPE_EMOJI[t.key]}</span>
                <div>
                  <div style={{ fontWeight: value===t.key?'bold':'normal' }}>{t.label}</div>
                  <div style={{ fontSize:10, color:T.muted }}>
                    {{ life:'UP jiwa, income replacement', health:'Gap rawat inap & kritis', property:'Nilai bangunan', vehicle:'All risk / TLO', credit:'Pelunasan KPR/KTA', travel:'Perjalanan domestik & internasional' }[t.key]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// =========================================================
// CALCULATOR FORMS (per type)
// =========================================================
function LifeCalcForm({ inputs, setInputs, autoData, T, fV, dispCur }) {
  const { annualIncome, yearsToCover, legacyTarget, educItems } = inputs;
  const addChild = () => setInputs(p => ({ ...p, educItems: [...p.educItems, { childAge:'1', annualCost:'40000000' }] }));
  const removeChild = i => setInputs(p => ({ ...p, educItems: p.educItems.filter((_,idx)=>idx!==i) }));
  const setChild = (i, k, v) => setInputs(p => {
    const arr = [...p.educItems]; arr[i] = { ...arr[i], [k]: v }; return { ...p, educItems: arr };
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {/* Auto data strip */}
      <div style={{ padding:'10px 12px', background:T.surface, borderRadius:9, border:`1px solid ${T.border}` }}>
        <div style={{ fontSize:9, color:T.accent, letterSpacing:1.5, marginBottom:8 }}>DARI PORTOFOLIO (OTOMATIS)</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
          {[
            { l:'Total Hutang', v: fV(autoData.totalDebt, dispCur), c: T.red },
            { l:'Aset Likuid', v: fV(autoData.liquidAssets, dispCur), c: T.green },
            { l:'Passive Income/Thn', v: fV(autoData.passiveAnnual, dispCur), c: T.blue },
          ].map(item => (
            <div key={item.l} style={{ padding:'6px 8px', background:T.card, borderRadius:7 }}>
              <div style={{ color:T.muted, fontSize:9 }}>{item.l}</div>
              <div style={{ color:item.c, fontSize:11, fontWeight:'bold' }}>{item.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Income */}
      <div>
        <div style={{ color:T.textSoft, fontSize:10, marginBottom:4 }}>
          Pendapatan Aktif/Bulan (IDR)
          <span style={{ color:T.muted }}> - isi jika belum di passive income</span>
        </div>
        <TInput T={T} value={annualIncome} onChange={e=>setInputs(p=>({...p,annualIncome:e.target.value}))} placeholder="15000000" />
        {parseVal(annualIncome) > 0 && <div style={{ color:T.muted,fontSize:9,marginTop:2 }}>≈ {fV(parseVal(annualIncome)*12,dispCur)}/thn</div>}
      </div>

      {/* Years to cover + Legacy side by side */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div>
          <div style={{ color:T.textSoft, fontSize:10, marginBottom:6 }}>Tahun Proteksi: <b style={{ color:T.accent }}>{yearsToCover} thn</b></div>
          <input type="range" min={3} max={30} value={yearsToCover}
            onChange={e=>setInputs(p=>({...p,yearsToCover:parseInt(e.target.value)}))}
            style={{ width:'100%', accentColor:T.accent }} />
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:T.muted }}>
            <span>3 thn</span><span>30 thn</span>
          </div>
        </div>
        <div>
          <div style={{ color:T.textSoft, fontSize:10, marginBottom:4 }}>Target Warisan (IDR)</div>
          <TInput T={T} value={legacyTarget} onChange={e=>setInputs(p=>({...p,legacyTarget:e.target.value}))} placeholder="500000000" />
        </div>
      </div>

      {/* Education items */}
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ color:T.textSoft, fontSize:10 }}>Dana Pendidikan Anak (per anak)</div>
          <button onClick={addChild} style={{ fontSize:10, padding:'3px 10px', borderRadius:6, border:`1px solid ${T.accentSoft}`, background:T.accentDim, color:T.accent, cursor:'pointer' }}>+ Tambah</button>
        </div>
        {educItems.map((e,i) => (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:8, marginBottom:8, padding:'10px 12px', background:T.surface, borderRadius:9, border:`1px solid ${T.border}` }}>
            <div>
              <div style={{ color:T.muted, fontSize:9, marginBottom:3 }}>Usia Anak Sekarang</div>
              <TInput T={T} value={e.childAge} onChange={ev=>setChild(i,'childAge',ev.target.value)} placeholder="5" />
            </div>
            <div>
              <div style={{ color:T.muted, fontSize:9, marginBottom:3 }}>Biaya Kuliah/Thn (IDR sekarang)</div>
              <TInput T={T} value={e.annualCost} onChange={ev=>setChild(i,'annualCost',ev.target.value)} placeholder="40000000" />
            </div>
            <button onClick={()=>removeChild(i)} style={{ alignSelf:'flex-end', padding:'10px 10px', background:T.redDim, border:'none', borderRadius:7, color:T.red, cursor:'pointer' }}>✕</button>
          </div>
        ))}
        {educItems.length === 0 && <div style={{ color:T.muted, fontSize:11, textAlign:'center', padding:'8px 0' }}>Belum ada data anak</div>}
        {educItems.length > 0 && (
          <div style={{ marginTop:6, padding:'8px 12px', background:T.surface, borderRadius:8, border:`1px solid ${T.border}` }}>
            <div style={{ color:T.muted, fontSize:10, lineHeight:1.6 }}>
              <b style={{ color:T.textSoft }}>Asumsi perhitungan:</b> Kenaikan biaya pendidikan <b style={{ color:T.orange }}>8% per tahun</b> (rata-rata inflasi pendidikan Indonesia). Biaya yang diinput adalah nilai saat ini - sistem menghitung proyeksi biaya saat anak masuk kuliah menggunakan rumus <i>Future Value</i>.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HealthCalcForm({ inputs, setInputs, T, fV, dispCur }) {
  const ROOM_RATES = [
    { label:'VVIP / Suite', rate:2500000 },
    { label:'VIP', rate:1500000 },
    { label:'Kelas 1', rate:700000 },
    { label:'Kelas 2', rate:400000 },
    { label:'Kelas 3 / BPJS', rate:150000 },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div>
        <div style={{ color:T.textSoft, fontSize:10, marginBottom:4 }}>Preferensi Kelas Kamar</div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {ROOM_RATES.map(r => (
            <div key={r.label} onClick={()=>setInputs(p=>({...p,roomRatePerDay:r.rate}))}
              style={{ padding:'9px 12px', borderRadius:9, border:`1px solid ${inputs.roomRatePerDay===r.rate?T.accent:T.border}`, background:inputs.roomRatePerDay===r.rate?T.accentDim:T.surface, cursor:'pointer', display:'flex', justifyContent:'space-between' }}>
              <span style={{ color:inputs.roomRatePerDay===r.rate?T.accent:T.text, fontSize:12, fontWeight:inputs.roomRatePerDay===r.rate?'bold':'normal' }}>{r.label}</span>
              <span style={{ color:T.muted, fontSize:11 }}>{fV(r.rate,dispCur)}/hari</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div>
          <div style={{ color:T.textSoft, fontSize:10, marginBottom:4 }}>Estimasi Hari Rawat/Thn</div>
          <input type="range" min={1} max={30} value={inputs.daysPerYear}
            onChange={e=>setInputs(p=>({...p,daysPerYear:parseInt(e.target.value)}))}
            style={{ width:'100%', accentColor:T.accent }} />
          <div style={{ textAlign:'center', color:T.accent, fontSize:12, fontWeight:'bold' }}>{inputs.daysPerYear} hari</div>
        </div>
        <div>
          <div style={{ color:T.textSoft, fontSize:10, marginBottom:4 }}>Coverage BPJS/Kantor/Thn (IDR)</div>
          <TInput T={T} value={inputs.annualCoverageExisting} onChange={e=>setInputs(p=>({...p,annualCoverageExisting:e.target.value}))} placeholder="0" />
          <div style={{ color:T.muted, fontSize:9, marginTop:2 }}>Isi 0 jika tidak ada</div>
        </div>
      </div>
    </div>
  );
}

function PropertyCalcForm({ inputs, setInputs, autoData, T, fV, dispCur }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {autoData.properties.length > 0 && (
        <div style={{ padding:'10px 12px', background:T.surface, borderRadius:9, border:`1px solid ${T.border}` }}>
          <div style={{ fontSize:9, color:T.accent, letterSpacing:1.5, marginBottom:8 }}>DARI PORTOFOLIO (PILIH PROPERTI)</div>
          {autoData.properties.map((p,i) => (
            <div key={i} onClick={()=>setInputs(pr=>({...pr,buildingValue:String(Math.round(getIDR(p)*0.5))}))}
              style={{ padding:'8px 10px', borderRadius:8, border:`1px solid ${T.border}`, marginBottom:6, cursor:'pointer', background:T.card }}>
              <div style={{ color:T.text, fontSize:12 }}>{p.name}</div>
              <div style={{ color:T.muted, fontSize:10 }}>Nilai: {fV(getIDR(p),dispCur)} · Estimasi bangunan 50%: {fV(getIDR(p)*0.5,dispCur)}</div>
            </div>
          ))}
        </div>
      )}
      <div>
        <div style={{ color:T.textSoft, fontSize:10, marginBottom:4 }}>Nilai Bangunan yang Diasuransikan (IDR)</div>
        <TInput T={T} value={inputs.buildingValue} onChange={e=>setInputs(p=>({...p,buildingValue:e.target.value}))} placeholder="200000000" />
        <div style={{ color:T.muted, fontSize:9, marginTop:2 }}>Hanya nilai bangunan, bukan tanah. Estimasi ~50% dari nilai properti.</div>
      </div>
    </div>
  );
}

function VehicleCalcForm({ inputs, setInputs, autoData, T, fV, dispCur }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {autoData.vehicles.length > 0 && (
        <div style={{ padding:'10px 12px', background:T.surface, borderRadius:9, border:`1px solid ${T.border}` }}>
          <div style={{ fontSize:9, color:T.accent, letterSpacing:1.5, marginBottom:8 }}>DARI PORTOFOLIO (PILIH KENDARAAN)</div>
          {autoData.vehicles.map((v,i) => (
            <div key={i} onClick={()=>setInputs(pr=>({...pr,vehicleValue:String(getIDR(v))}))}
              style={{ padding:'8px 10px', borderRadius:8, border:`1px solid ${T.border}`, marginBottom:6, cursor:'pointer', background:T.card }}>
              <div style={{ color:T.text, fontSize:12 }}>{v.name}</div>
              <div style={{ color:T.muted, fontSize:10 }}>{fV(getIDR(v),dispCur)}</div>
            </div>
          ))}
        </div>
      )}
      <div>
        <div style={{ color:T.textSoft, fontSize:10, marginBottom:4 }}>Nilai Kendaraan (IDR)</div>
        <TInput T={T} value={inputs.vehicleValue} onChange={e=>setInputs(p=>({...p,vehicleValue:e.target.value}))} placeholder="200000000" />
      </div>
      <div>
        <div style={{ color:T.textSoft, fontSize:10, marginBottom:8 }}>Jenis Coverage</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[
            { key:'allrisk', label:'All Risk', desc:'Ganti rugi semua jenis kerusakan', rate:'~3.5%/thn' },
            { key:'tlo', label:'TLO (Total Loss Only)', desc:'Hanya jika hilang / rusak >75%', rate:'~0.8%/thn' },
          ].map(c => (
            <div key={c.key} onClick={()=>setInputs(p=>({...p,coverageType:c.key}))}
              style={{ padding:'11px 12px', borderRadius:9, border:`1px solid ${inputs.coverageType===c.key?T.accent:T.border}`, background:inputs.coverageType===c.key?T.accentDim:T.surface, cursor:'pointer' }}>
              <div style={{ color:inputs.coverageType===c.key?T.accent:T.text, fontSize:12, fontWeight:'bold', marginBottom:3 }}>{c.label}</div>
              <div style={{ color:T.muted, fontSize:10 }}>{c.desc}</div>
              <div style={{ color:T.accent, fontSize:10, marginTop:3 }}>{c.rate}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EducationCalcForm({ inputs, setInputs, T, fV, dispCur }) {
  const LEVELS = [{ key:'d3', label:'D3 (3 thn)' }, { key:'s1', label:'S1 (4 thn)' }, { key:'s2', label:'S2 (6 thn)' }];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div>
          <div style={{ color:T.textSoft, fontSize:10, marginBottom:4 }}>Usia Anak Sekarang</div>
          <TInput T={T} value={inputs.childAge} onChange={e=>setInputs(p=>({...p,childAge:e.target.value}))} placeholder="5" />
          {parseInt(inputs.childAge) >= 0 && <div style={{ color:T.muted,fontSize:9,marginTop:2 }}>{Math.max(0,18-parseInt(inputs.childAge)||0)} tahun lagi kuliah</div>}
        </div>
        <div>
          <div style={{ color:T.textSoft, fontSize:10, marginBottom:4 }}>Biaya Kuliah/Thn (IDR sekarang)</div>
          <TInput T={T} value={inputs.annualCostNow} onChange={e=>setInputs(p=>({...p,annualCostNow:e.target.value}))} placeholder="40000000" />
        </div>
      </div>
      <div>
        <div style={{ color:T.textSoft, fontSize:10, marginBottom:8 }}>Target Jenjang</div>
        <div style={{ display:'flex', gap:8 }}>
          {LEVELS.map(l => (
            <button key={l.key} onClick={()=>setInputs(p=>({...p,targetLevel:l.key}))}
              style={{ flex:1, padding:'9px 0', borderRadius:8, border:`1px solid ${inputs.targetLevel===l.key?T.accent:T.border}`, background:inputs.targetLevel===l.key?T.accentDim:T.surface, color:inputs.targetLevel===l.key?T.accent:T.muted, cursor:'pointer', fontSize:11, fontWeight:inputs.targetLevel===l.key?'bold':'normal' }}>
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CreditCalcForm({ autoData, T, fV, dispCur }) {
  return (
    <div style={{ padding:'12px 14px', background:T.surface, borderRadius:10, border:`1px solid ${T.border}` }}>
      <div style={{ fontSize:9, color:T.accent, letterSpacing:1.5, marginBottom:10 }}>DATA DARI HUTANG (OTOMATIS)</div>
      {[
        { l:'Total KPR', v: fV(autoData.totalMortgage, dispCur), c:T.red },
        { l:'Total KTA/Cicilan Lain', v: fV(autoData.totalInstallment, dispCur), c:T.orange },
        { l:'Total Jiwa Kredit Dibutuhkan', v: fV(autoData.totalMortgage+autoData.totalInstallment, dispCur), c:T.accent },
      ].map(item => (
        <div key={item.l} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${T.border}` }}>
          <span style={{ color:T.textSoft, fontSize:12 }}>{item.l}</span>
          <span style={{ color:item.c, fontSize:13, fontWeight:'bold' }}>{item.v}</span>
        </div>
      ))}
      <div style={{ color:T.muted, fontSize:10, marginTop:10, lineHeight:1.6 }}>
        Asuransi jiwa kredit melunasi sisa hutang jika tertanggung meninggal. Biasanya wajib saat pengajuan KPR.
      </div>
    </div>
  );
}

function TravelCalcForm({ inputs, setInputs, T, fV, dispCur }) {
  const REGIONS = [{ key:'domestic', label:'Domestik', est:200000 }, { key:'asia', label:'Asia', est:800000 }, { key:'world', label:'Internasional (Dunia)', est:1500000 }];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div>
        <div style={{ color:T.textSoft, fontSize:10, marginBottom:8 }}>Wilayah Perjalanan</div>
        <div style={{ display:'flex', gap:8 }}>
          {REGIONS.map(r => (
            <button key={r.key} onClick={()=>setInputs(p=>({...p,region:r.key,estimatedPremium:r.est}))}
              style={{ flex:1, padding:'9px 0', borderRadius:8, border:`1px solid ${inputs.region===r.key?T.accent:T.border}`, background:inputs.region===r.key?T.accentDim:T.surface, color:inputs.region===r.key?T.accent:T.muted, cursor:'pointer', fontSize:11, fontWeight:inputs.region===r.key?'bold':'normal' }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div>
          <div style={{ color:T.textSoft, fontSize:10, marginBottom:4 }}>Jumlah Perjalanan/Thn</div>
          <TInput T={T} value={inputs.tripsPerYear} onChange={e=>setInputs(p=>({...p,tripsPerYear:e.target.value}))} placeholder="4" />
        </div>
        <div>
          <div style={{ color:T.textSoft, fontSize:10, marginBottom:4 }}>Jumlah Peserta (orang)</div>
          <TInput T={T} value={inputs.travelers} onChange={e=>setInputs(p=>({...p,travelers:e.target.value}))} placeholder="2" />
        </div>
      </div>
    </div>
  );
}

// =========================================================
// RESULT DISPLAY PER TYPE
// =========================================================
function CalcResult({ calcType, result, insurances, T, fV, dispCur }) {
  if (!result) return null;

  const existing = insurances.filter(i => i.type === calcType);
  const totalExistingCoverage = existing.reduce((s,i) => s + parseVal(i.coverage), 0);
  const totalExistingPremium  = existing.reduce((s,i) => s + parseVal(i.premium) * (FREQ_MULT[i.premiumFreq]||1), 0);

  let need = 0, rows = [], note = '';

  if (calcType === 'life' && result.net !== undefined) {
    need = result.net;
    rows = [
      { l:'Pengganti Pendapatan', v: result.incomeNeed, c: T.orange },
      { l:'Pelunasan Hutang', v: result.debtNeed, c: T.red },
      { l:'Dana Pendidikan Anak', v: result.educNeed, c: T.blue },
      { l:'Target Warisan', v: result.legacyNeed, c: T.purple },
      { l:'Dikurangi Aset Likuid', v: -result.existing, c: T.green },
    ];
    note = 'Metode: Income Replacement + Debt + Education + Legacy - Liquid Assets';
  } else if (calcType === 'health') {
    need = result.gap;
    rows = [
      { l:'Kebutuhan Rawat/Thn', v: result.annualNeed, c: T.orange },
      { l:'Coverage Existing', v: -parseVal(0), c: T.green },
    ];
    note = 'Estimasi biaya rawat inap per tahun dikurangi coverage yang sudah ada';
  } else if (calcType === 'property') {
    need = result.need;
    note = 'Nilai bangunan yang perlu dilindungi (tidak termasuk tanah)';
  } else if (calcType === 'vehicle') {
    need = result.need;
    rows = [{ l:'Estimasi Premi/Thn', v: result.estimatedPremium, c: T.orange }];
    note = 'Nilai pertanggungan kendaraan';
  } else if (calcType === 'education') {
    need = result.totalFund;
    rows = [
      { l:'Biaya Kuliah/Thn (future)', v: result.futureCostPerYear, c: T.orange },
      { l:'Dana Total Dibutuhkan', v: result.totalFund, c: T.accent },
      { l:'Tabungan/Bulan mulai sekarang', v: result.monthlySaving, c: T.blue },
    ];
    note = `Asumsi inflasi pendidikan 8%/thn, ${result.yearsLeft} tahun lagi`;
  } else if (calcType === 'credit') {
    need = result.need;
    note = 'Total hutang yang perlu dilindungi asuransi jiwa kredit';
  } else if (calcType === 'travel') {
    need = result.estimatedPremium * parseVal(result.trips||1) * parseVal(result.travelers||1);
    rows = [{ l:'Estimasi Premi/Perjalanan', v: result.estimatedPremium, c: T.orange }];
    note = 'Estimasi premi per perjalanan berdasarkan wilayah';
  }

  const gap      = Math.max(0, need - totalExistingCoverage);
  const surplus  = Math.max(0, totalExistingCoverage - need);
  const pct      = need > 0 ? Math.min(100, (totalExistingCoverage / need) * 100) : (totalExistingCoverage > 0 ? 100 : 0);
  const type     = INSURANCE_TYPES.find(t => t.key === calcType);

  return (
    <div>
      {/* Breakdown rows */}
      {rows.length > 0 && (
        <div style={{ marginBottom:12 }}>
          {rows.filter(r=>r.v!==0).map((r,i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'7px 10px', background:T.surface, borderRadius:7, marginBottom:5 }}>
              <span style={{ color:T.textSoft, fontSize:11 }}>{r.l}</span>
              <span style={{ color:r.c, fontSize:12, fontWeight:'bold' }}>{r.v<0?'-':''}{fV(Math.abs(r.v),dispCur)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Total need */}
      <div style={{ padding:'13px 14px', background: gap>0?T.redDim:T.greenDim, borderRadius:10, border:`1px solid ${gap>0?T.red:T.green}33`, marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
          <div>
            <div style={{ color:T.text, fontWeight:'bold', fontSize:13 }}>Kebutuhan {type?.label}</div>
            <div style={{ color:T.muted, fontSize:10 }}>{note}</div>
          </div>
          <div style={{ color:T.accent, fontSize:16, fontWeight:'bold', fontFamily:"'Playfair Display',serif" }}>{fV(need,dispCur)}</div>
        </div>

        {/* Coverage comparison */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:T.muted, marginBottom:4 }}>
            <span>Coverage polis aktif: {fV(totalExistingCoverage,dispCur)}</span>
            <span style={{ color:pct>=80?T.green:T.red, fontWeight:'bold' }}>{pct.toFixed(0)}%</span>
          </div>
          <Bar pct={pct} color={pct>=80?T.green:pct>=50?T.orange:T.red} h={8} T={T} />
          <div style={{ marginTop:8, fontSize:12 }}>
            {gap > 0
              ? <span style={{ color:T.red }}>⚠ Kekurangan: <b>{fV(gap,dispCur)}</b> - pertimbangkan tambah polis {type?.label.toLowerCase()}</span>
              : surplus > 0
              ? <span style={{ color:T.green }}>✓ Surplus coverage: {fV(surplus,dispCur)}</span>
              : <span style={{ color:T.green }}>✓ Coverage sudah memadai</span>
            }
          </div>
        </div>
      </div>

      {/* Existing policies for this type */}
      {existing.length > 0 && (
        <div>
          <div style={{ color:T.muted, fontSize:10, letterSpacing:1.5, marginBottom:6 }}>POLIS {type?.label.toUpperCase()} YANG DIMILIKI</div>
          {existing.map(ins => (
            <div key={ins.id} style={{ display:'flex', justifyContent:'space-between', padding:'9px 12px', background:T.surface, borderRadius:9, border:`1px solid ${T.border}`, marginBottom:6 }}>
              <div>
                <div style={{ color:T.text, fontSize:12, fontWeight:500 }}>{ins.name}</div>
                <div style={{ color:T.muted, fontSize:10 }}>{ins.company} · Premi {fV(parseVal(ins.premium),dispCur)}/{FREQ_LABELS[ins.premiumFreq]||'thn'}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ color:type?.color, fontSize:12, fontWeight:'bold' }}>{fV(parseVal(ins.coverage),dispCur)}</div>
                <div style={{ color:T.muted, fontSize:9 }}>UP</div>
              </div>
            </div>
          ))}
          <div style={{ padding:'8px 12px', background:T.surface, borderRadius:8, display:'flex', justifyContent:'space-between' }}>
            <span style={{ color:T.textSoft, fontSize:11 }}>Total Premi {type?.label}/Thn</span>
            <span style={{ color:T.accent, fontSize:12, fontWeight:'bold' }}>{fV(totalExistingPremium,dispCur)}</span>
          </div>
        </div>
      )}

      {existing.length === 0 && (
        <div style={{ padding:'10px 14px', background:T.surface, borderRadius:9, border:`1px dashed ${T.border}`, textAlign:'center' }}>
          <div style={{ color:T.muted, fontSize:11 }}>Belum ada polis {type?.label} di Tracker - tambahkan di tab Polis Saya</div>
        </div>
      )}
    </div>
  );
}

// =========================================================
// MAIN SCENE
// =========================================================
function InsuranceScene({
  assets = [], debts = [], goals = [], dispCur,
  T, hideValues = false,
  isPro = false, isProPlus = false,
  setShowUpgrade, insurances = [], setInsurances,
  pulseCredits = 0, setPulseCredits = null,
}) {
  const fV = (v, c) => fM(v, c, hideValues);

  const [subTab, setSubTab]     = useState('tracker');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const setF = (k,v) => setForm(p=>({...p,[k]:v}));

  // Calculator state
  const [calcType, setCalcType] = useState('life');
  const [calcResult, setCalcResult] = useState(null);
  const [calcSaved, setCalcSaved] = useState({}); // saved inputs per type

  // Default inputs per calc type
  const DEFAULT_INPUTS = {
    life:     { annualIncome:'', yearsToCover:10, legacyTarget:'', educItems:[] },
    health:   { roomRatePerDay:1500000, daysPerYear:7, annualCoverageExisting:'' },
    property: { buildingValue:'' },
    vehicle:  { vehicleValue:'', coverageType:'allrisk' },
    education:{ childAge:'', annualCostNow:'40000000', targetLevel:'s1' },
    credit:   {},
    travel:   { region:'asia', tripsPerYear:'4', travelers:'2', estimatedPremium:800000 },
  };

  const [calcInputs, setCalcInputs] = useState(DEFAULT_INPUTS.life);

  // When calcType changes, load saved inputs or defaults
  const handleChangeCalcType = (t) => {
    setCalcType(t);
    setCalcResult(null);
    setCalcInputs(calcSaved[t] || DEFAULT_INPUTS[t] || {});
  };

  // Auto data from portfolio
  const totalAssets    = useMemo(()=>assets.reduce((s,a)=>s+getIDR(a),0),[assets]);
  const totalDebt      = useMemo(()=>debts.reduce((s,d)=>s+parseVal(d.outstanding),0),[debts]);
  const liquidAssets   = useMemo(()=>assets.filter(a=>LIQUID_KEYS.includes(a.classKey)).reduce((s,a)=>s+getIDR(a),0),[assets]);
  const passiveAnnual  = useMemo(()=>assets.filter(a=>a.income?.amount>0).reduce((s,a)=>s+a.income.amount*(FREQ_MULT[a.income.frequency]||12),0),[assets]);
  const properties     = useMemo(()=>assets.filter(a=>a.classKey==='property'),[assets]);
  const vehicles       = useMemo(()=>assets.filter(a=>a.classKey==='vehicle'||a.name?.toLowerCase().includes('mobil')||a.name?.toLowerCase().includes('motor')),[assets]);
  const totalMortgage  = useMemo(()=>debts.filter(d=>d.type==='kpr').reduce((s,d)=>s+parseVal(d.outstanding),0),[debts]);
  const totalInstallment=useMemo(()=>debts.filter(d=>d.type!=='kpr').reduce((s,d)=>s+parseVal(d.outstanding),0),[debts]);

  const autoData = { totalDebt, liquidAssets, passiveAnnual, totalAssets, properties, vehicles, totalMortgage, totalInstallment };

  // Tracker state
  const atLimit = !isProPlus && isPro && insurances.length >= PRO_LIMIT;
  const canAdd  = isPro && !atLimit;
  const totalAnnualPremium = insurances.reduce((s,ins)=>s+parseVal(ins.premium)*(FREQ_MULT[ins.premiumFreq]||1),0);

  const openNew = () => { if(!canAdd) return; setEditId(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (ins) => { setEditId(ins.id); setForm({...ins}); setShowForm(true); };
  const savePolis = () => {
    if(!form.name.trim()) return;
    if(editId) setInsurances(p=>p.map(i=>i.id===editId?{...form,id:editId}:i));
    else setInsurances(p=>[...p,{...form,id:Date.now().toString()}]);
    setShowForm(false); setEditId(null); setForm(EMPTY_FORM);
  };
  const deletePolis = (id) => setInsurances(p=>p.filter(i=>i.id!==id));

  // Run calculation
  const runCalc = () => {
    let result = null;
    const inc = calcInputs;
    if(calcType==='life') {
      const annualInc = parseVal(inc.annualIncome)*12 || passiveAnnual;
      result = calcLife({ annualIncome:annualInc, yearsToCover:inc.yearsToCover, totalDebt:totalDebt, legacyTarget:parseVal(inc.legacyTarget), liquidAssets, educItems:(inc.educItems||[]).map(e=>({childAge:parseInt(e.childAge)||0,annualCost:parseVal(e.annualCost)})) });
    } else if(calcType==='health') {
      result = calcHealthInsurance({ roomRatePerDay:inc.roomRatePerDay, daysPerYear:inc.daysPerYear, annualCoverageExisting:parseVal(inc.annualCoverageExisting) });
    } else if(calcType==='property') {
      result = calcPropertyInsurance({ buildingValue:parseVal(inc.buildingValue) });
    } else if(calcType==='vehicle') {
      result = calcVehicleInsurance({ vehicleValue:parseVal(inc.vehicleValue), coverageType:inc.coverageType });
    } else if(calcType==='education') {
      result = calcEducationInsurance({ childAge:parseInt(inc.childAge)||0, annualCostNow:parseVal(inc.annualCostNow), targetLevel:inc.targetLevel });
    } else if(calcType==='credit') {
      result = calcCreditInsurance({ totalMortgage, totalInstallment });
    } else if(calcType==='travel') {
      result = { estimatedPremium:inc.estimatedPremium||800000, trips:inc.tripsPerYear, travelers:inc.travelers };
    }
    setCalcResult(result);
    setCalcSaved(p=>({...p,[calcType]:calcInputs}));
  };

  // -- GATE: Not Pro --------------------------------------------------------
  if (!isPro) {
    return (
      <div style={{ paddingBottom:40 }}>
        <div style={{ textAlign:'center', padding:'40px 24px', background:T.card, borderRadius:16, border:`1px solid ${T.border}`, marginBottom:16 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🛡️</div>
          <div style={{ color:T.accent, fontSize:17, fontWeight:'bold', fontFamily:"'Playfair Display',Georgia,serif", marginBottom:8 }}>Asuransi & Proteksi Kekayaan</div>
          <div style={{ color:T.textSoft, fontSize:13, lineHeight:1.7, marginBottom:20, maxWidth:300, margin:'0 auto 20px' }}>Lacak polis, hitung kebutuhan UP per jenis, dan analisa coverage gap.</div>
          <TBtn T={T} variant="primary" onClick={()=>setShowUpgrade&&setShowUpgrade(true)} style={{ padding:'11px 28px' }}>⭐ Upgrade Pro</TBtn>
        </div>
        {[{icon:'📋',l:'Tracker 6 Jenis Polis',d:'Jiwa, Kesehatan, Kendaraan, Properti, Jiwa Kredit, Perjalanan'},{icon:'🧮',l:'Kalkulator per Jenis',d:'Input minimal, hasil langsung dibandingkan dengan polis yang ada'},{icon:'📊',l:'Coverage Gap per Kategori',d:'Lihat mana yang kurang, mana yang sudah cukup'},{icon:'🤖',l:'Rekomendasi AI (Pro+)',d:'Analisa mendalam dan saran optimasi premi'}].map((f,i)=>(
          <div key={i} style={{ display:'flex', gap:12, padding:'12px 16px', background:T.card, borderRadius:12, border:`1px solid ${T.border}`, marginBottom:8, opacity:0.7 }}>
            <span style={{ fontSize:20 }}>{f.icon}</span>
            <div><div style={{ color:T.text, fontSize:13, fontWeight:600, marginBottom:2 }}>{f.l}</div><div style={{ color:T.muted, fontSize:11 }}>{f.d}</div></div>
          </div>
        ))}
      </div>
    );
  }

  // -- FULL SCENE -----------------------------------------------------------
  return (
    <div style={{ paddingBottom:40 }}>
      {/* Sub-tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[['tracker','📋 Polis Saya'],['calculator','🧮 Kalkulator'],...(isProPlus?[['ai','🤖 AI']]:[])]
          .map(([id,label])=>(
          <button key={id} onClick={()=>setSubTab(id)} style={{
            flex:1, padding:'9px 0', borderRadius:9, border:`1px solid ${subTab===id?T.accent:T.border}`,
            background:subTab===id?T.accentDim:T.surface, color:subTab===id?T.accent:T.muted,
            cursor:'pointer', fontSize:12, fontWeight:subTab===id?'bold':'normal',
          }}>{label}</button>
        ))}
      </div>

      {/* ===== TRACKER ===== */}
      {subTab==='tracker' && (
        <>
          <Card T={T} style={{ marginBottom:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:insurances.length>0?14:0 }}>
              <div style={{ padding:'10px 12px', background:T.surface, borderRadius:10, border:`1px solid ${T.border}` }}>
                <div style={{ color:T.muted, fontSize:10, marginBottom:3 }}>Total Polis</div>
                <div style={{ color:T.accent, fontSize:16, fontWeight:'bold' }}>{insurances.length}{isProPlus?'':'/'+PRO_LIMIT}</div>
              </div>
              <div style={{ padding:'10px 12px', background:T.surface, borderRadius:10, border:`1px solid ${T.border}` }}>
                <div style={{ color:T.muted, fontSize:10, marginBottom:3 }}>Total Premi/Thn</div>
                <div style={{ color:T.text, fontSize:14, fontWeight:'bold' }}>{fV(totalAnnualPremium,dispCur)}</div>
              </div>
            </div>
            {!isProPlus && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:T.muted, marginBottom:4 }}>
                  <span>Slot polis</span>
                  <span style={{ color:atLimit?T.red:T.accent }}>{insurances.length}/{PRO_LIMIT}</span>
                </div>
                <Bar pct={(insurances.length/PRO_LIMIT)*100} color={atLimit?T.red:T.accent} h={5} T={T} />
                {atLimit && <div style={{ marginTop:8, padding:'8px 12px', background:T.redDim, borderRadius:8, fontSize:11, color:T.red }}>Batas Pro tercapai · <span style={{ cursor:'pointer', textDecoration:'underline' }} onClick={()=>setShowUpgrade&&setShowUpgrade(true)}>Upgrade Pro+</span></div>}
              </div>
            )}
          </Card>

          {insurances.length===0&&!showForm&&(
            <div style={{ textAlign:'center', padding:'32px 20px', background:T.card, borderRadius:14, border:`1px dashed ${T.border}`, marginBottom:16 }}>
              <div style={{ fontSize:36, marginBottom:10 }}>🛡️</div>
              <div style={{ color:T.textSoft, fontSize:13, marginBottom:16 }}>Belum ada polis. Tambahkan polis pertama kamu.</div>
              <TBtn T={T} variant="primary" onClick={openNew}>+ Tambah Polis</TBtn>
            </div>
          )}

          {insurances.map(ins=>{
            const type=INSURANCE_TYPES.find(t=>t.key===ins.type)||INSURANCE_TYPES[0];
            const annualPrem=parseVal(ins.premium)*(FREQ_MULT[ins.premiumFreq]||1);
            const isExpired=ins.endDate&&new Date(ins.endDate)<new Date();
            const expiringSoon=ins.endDate&&!isExpired&&(new Date(ins.endDate)-new Date())<30*24*60*60*1000;
            return (
              <Card key={ins.id} T={T} style={{ padding:'14px 16px', marginBottom:10 }} glow={isExpired?T.red:expiringSoon?T.orange:undefined}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <span style={{ fontSize:22 }}>{ITYPE_EMOJI[ins.type]||'🛡️'}</span>
                    <div>
                      <div style={{ color:T.text, fontSize:13, fontWeight:600 }}>{ins.name||type.label}</div>
                      <div style={{ display:'flex', gap:6, alignItems:'center', marginTop:2 }}>
                        <span style={{ fontSize:9, padding:'1px 6px', borderRadius:4, background:type.color+'22', color:type.color, fontWeight:700 }}>{type.label}</span>
                        {ins.company&&<span style={{ color:T.muted, fontSize:10 }}>{ins.company}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    {isExpired?<span style={{ fontSize:10, color:T.red, fontWeight:'bold' }}>⚠ Kadaluarsa</span>
                    :expiringSoon?<span style={{ fontSize:10, color:T.orange, fontWeight:'bold' }}>⚠ Segera habis</span>
                    :ins.endDate?<span style={{ fontSize:10, color:T.muted }}>s/d {new Date(ins.endDate).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</span>
                    :null}
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
                  <div style={{ padding:'8px 10px', background:T.surface, borderRadius:8 }}>
                    <div style={{ color:T.muted, fontSize:9, marginBottom:2 }}>Premi/{FREQ_LABELS[ins.premiumFreq]||'thn'}</div>
                    <div style={{ color:T.text, fontSize:12, fontWeight:600 }}>{fV(parseVal(ins.premium),dispCur)}</div>
                    {ins.premiumFreq!=='annual'&&<div style={{ color:T.muted, fontSize:9 }}>≈ {fV(annualPrem,dispCur)}/thn</div>}
                  </div>
                  {parseVal(ins.coverage)>0&&(
                    <div style={{ padding:'8px 10px', background:T.surface, borderRadius:8 }}>
                      <div style={{ color:T.muted, fontSize:9, marginBottom:2 }}>Uang Pertanggungan</div>
                      <div style={{ color:type.color, fontSize:12, fontWeight:600 }}>{fV(parseVal(ins.coverage),dispCur)}</div>
                    </div>
                  )}
                </div>
                {ins.notes&&<div style={{ color:T.muted, fontSize:11, marginBottom:10, fontStyle:'italic' }}>{ins.notes}</div>}
                <div style={{ display:'flex', gap:8 }}>
                  <TBtn T={T} variant="ghost" onClick={()=>openEdit(ins)} style={{ flex:1, padding:'7px 0', fontSize:11 }}>✎ Edit</TBtn>
                  <TBtn T={T} variant="danger" onClick={()=>deletePolis(ins.id)} style={{ padding:'7px 14px', fontSize:11 }}>✕</TBtn>
                </div>
              </Card>
            );
          })}

          {!showForm&&insurances.length>0&&canAdd&&(
            <button onClick={openNew} style={{ width:'100%', padding:'12px', borderRadius:10, border:`1px dashed ${T.accentSoft}`, background:T.accentDim, color:T.accent, cursor:'pointer', fontSize:12, fontWeight:'bold' }}>
              + Tambah Polis
            </button>
          )}

          {showForm&&(
            <Card T={T} style={{ border:`1px solid ${T.accentSoft}`, marginBottom:16 }}>
              <SL T={T}>{editId?'Edit Polis':'Tambah Polis Baru'}</SL>
              <div style={{ marginBottom:12 }}>
                <div style={{ color:T.textSoft, fontSize:10, marginBottom:6 }}>Jenis Asuransi</div>
                <TypeDropdown value={form.type} onChange={v=>setF('type',v)} T={T} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                <div style={{ gridColumn:'span 2' }}>
                  <div style={{ color:T.textSoft, fontSize:10, marginBottom:4 }}>Nama Polis / Produk <span style={{ color:T.red }}>*</span></div>
                  <TInput T={T} value={form.name} onChange={e=>setF('name',e.target.value)} placeholder="Prudential PRUlink, AIA Critical Care..." />
                </div>
                <div>
                  <div style={{ color:T.textSoft, fontSize:10, marginBottom:4 }}>Perusahaan</div>
                  <TInput T={T} value={form.company} onChange={e=>setF('company',e.target.value)} placeholder="Prudential, AIA, Allianz..." />
                </div>
                <div>
                  <div style={{ color:T.textSoft, fontSize:10, marginBottom:4 }}>Uang Pertanggungan (IDR)</div>
                  <TInput T={T} value={form.coverage} onChange={e=>setF('coverage',e.target.value)} placeholder="500000000" />
                </div>
                <div>
                  <div style={{ color:T.textSoft, fontSize:10, marginBottom:4 }}>Premi (IDR)</div>
                  <TInput T={T} value={form.premium} onChange={e=>setF('premium',e.target.value)} placeholder="5000000" />
                </div>
                <div>
                  <div style={{ color:T.textSoft, fontSize:10, marginBottom:4 }}>Frekuensi</div>
                  <TSelect T={T} value={form.premiumFreq} onChange={e=>setF('premiumFreq',e.target.value)} style={{ width:'100%' }}>
                    <option value="monthly">Bulanan</option>
                    <option value="quarterly">Per Kwartal</option>
                    <option value="semiannual">Per Semester</option>
                    <option value="annual">Tahunan</option>
                  </TSelect>
                </div>
                <div>
                  <div style={{ color:T.textSoft, fontSize:10, marginBottom:4 }}>Mulai Berlaku</div>
                  <input type="date" value={form.startDate} onChange={e=>setF('startDate',e.target.value)} style={{ width:'100%', background:T.inputBg, border:`1px solid ${T.border}`, color:T.text, borderRadius:9, padding:'10px 12px', fontSize:13, outline:'none' }} />
                </div>
                <div>
                  <div style={{ color:T.textSoft, fontSize:10, marginBottom:4 }}>Jatuh Tempo</div>
                  <input type="date" value={form.endDate} onChange={e=>setF('endDate',e.target.value)} style={{ width:'100%', background:T.inputBg, border:`1px solid ${T.border}`, color:T.text, borderRadius:9, padding:'10px 12px', fontSize:13, outline:'none' }} />
                </div>
                <div style={{ gridColumn:'span 2' }}>
                  <div style={{ color:T.textSoft, fontSize:10, marginBottom:4 }}>Catatan</div>
                  <TInput T={T} value={form.notes} onChange={e=>setF('notes',e.target.value)} placeholder="No. polis, beneficiary, catatan lain..." />
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <TBtn T={T} variant="primary" onClick={savePolis} style={{ flex:1 }}>{editId?'✓ Simpan Perubahan':'+ Simpan Polis'}</TBtn>
                <TBtn T={T} variant="default" onClick={()=>{setShowForm(false);setEditId(null);}} style={{ padding:'10px 16px' }}>Batal</TBtn>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ===== CALCULATOR ===== */}
      {subTab==='calculator' && (
        <>
          {/* Type selector */}
          <Card T={T} style={{ marginBottom:16 }}>
            <SL T={T}>Pilih Jenis Kalkulator</SL>
            <TypeDropdown value={calcType} onChange={handleChangeCalcType} T={T} />
          </Card>

          {/* Form */}
          <Card T={T} style={{ marginBottom:16 }}>
            <SL T={T}>{'Kalkulator ' + (INSURANCE_TYPES.find(t=>t.key===calcType)?.label||'')}</SL>

            {calcType==='life'     && <LifeCalcForm inputs={calcInputs} setInputs={setCalcInputs} autoData={autoData} T={T} fV={fV} dispCur={dispCur} />}
            {calcType==='health'   && <HealthCalcForm inputs={calcInputs} setInputs={setCalcInputs} T={T} fV={fV} dispCur={dispCur} />}
            {calcType==='property' && <PropertyCalcForm inputs={calcInputs} setInputs={setCalcInputs} autoData={autoData} T={T} fV={fV} dispCur={dispCur} />}
            {calcType==='vehicle'  && <VehicleCalcForm inputs={calcInputs} setInputs={setCalcInputs} autoData={autoData} T={T} fV={fV} dispCur={dispCur} />}
            {calcType==='education'&& <EducationCalcForm inputs={calcInputs} setInputs={setCalcInputs} T={T} fV={fV} dispCur={dispCur} />}
            {calcType==='credit'   && <CreditCalcForm autoData={autoData} T={T} fV={fV} dispCur={dispCur} />}
            {calcType==='travel'   && <TravelCalcForm inputs={calcInputs} setInputs={setCalcInputs} T={T} fV={fV} dispCur={dispCur} />}

            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              <TBtn T={T} variant="primary" onClick={runCalc} style={{ flex:1 }}>Hitung Kebutuhan</TBtn>
              {calcSaved[calcType] && (
                <TBtn T={T} variant="ghost" onClick={()=>{setCalcInputs(calcSaved[calcType]);setCalcResult(null);}} style={{ padding:'10px 14px', fontSize:11 }}>↺ Reset</TBtn>
              )}
            </div>
            {calcSaved[calcType] && !calcResult && (
              <div style={{ color:T.green, fontSize:10, textAlign:'center', marginTop:8 }}>✓ Input tersimpan - klik Hitung untuk update</div>
            )}
          </Card>

          {/* Result + compare */}
          {calcResult && (
            <Card T={T} style={{ border:`1px solid ${T.accentSoft}` }}>
              <SL T={T}>Hasil & Perbandingan Polis</SL>
              <CalcResult calcType={calcType} result={calcResult} insurances={insurances} T={T} fV={fV} dispCur={dispCur} />
              {/* Disclaimer */}
              <div style={{ marginTop:14, padding:'10px 14px', background:T.surface, borderRadius:9, border:`1px solid ${T.border}` }}>
                <div style={{ color:T.muted, fontSize:10, lineHeight:1.7 }}>
                  <b style={{ color:T.textSoft }}>⚠ Disclaimer:</b> Hasil kalkulasi ini bersifat <b>estimasi</b> berdasarkan data portofolio dan asumsi umum yang digunakan dalam perencanaan keuangan. Angka aktual dapat berbeda tergantung kondisi kesehatan, profil risiko, produk asuransi yang tersedia, serta kebijakan masing-masing perusahaan asuransi. Untuk perhitungan yang lebih akurat dan rekomendasi produk yang sesuai, disarankan berkonsultasi dengan <b>Perencana Keuangan Bersertifikat (CFP)</b> atau <b>Agen/Pialang Asuransi berlisensi OJK</b>.
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ===== AI (Pro+) ===== */}
      {subTab==='ai' && isProPlus && (
        <InsuranceAITab T={T} dispCur={dispCur} fV={fV} insurances={insurances}
          totalAssets={totalAssets} totalDebt={totalDebt} passiveAnnual={passiveAnnual} liquidAssets={liquidAssets}
          pulseCredits={pulseCredits} setPulseCredits={setPulseCredits} />
      )}
    </div>
  );
}

// =========================================================
// AI TAB (Pro+ only)
// =========================================================
function InsuranceAITab({ T, dispCur, fV, insurances, totalAssets, totalDebt, passiveAnnual, liquidAssets, pulseCredits = 0, setPulseCredits = null }) {
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  const totalAnnualPremium = insurances.reduce((s,i)=>s+parseVal(i.premium)*(FREQ_MULT[i.premiumFreq]||1),0);
  const blocked = pulseCredits <= 0;

  const runAnalysis = async () => {
    if (blocked) { setAnalysis('PULSE Credit habis. Beli Pulse untuk melanjutkan.'); setDone(true); return; }
    // Deduct 1 Pulse before calling API
    if (setPulseCredits) setPulseCredits(p => Math.max(0, p - 1));
    setLoading(true); setAnalysis(''); setDone(false);
    const polisDetail = INSURANCE_TYPES.map(t=>{
      const polis = insurances.filter(i=>i.type===t.key);
      if(polis.length===0) return `- ${t.label}: belum ada polis`;
      return `- ${t.label}: ${polis.length} polis, total UP ${polis.reduce((s,i)=>s+parseVal(i.coverage),0)/1e6}jt, premi ${polis.reduce((s,i)=>s+parseVal(i.premium)*(FREQ_MULT[i.premiumFreq]||1),0)/1e6}jt/thn`;
    }).join('\n');

    const ctx = `Data keuangan:\n- Total aset: ${(totalAssets/1e6).toFixed(1)}jt\n- Aset likuid: ${(liquidAssets/1e6).toFixed(1)}jt\n- Total hutang: ${(totalDebt/1e6).toFixed(1)}jt\n- Passive income/thn: ${(passiveAnnual/1e6).toFixed(1)}jt\n- Total premi/thn: ${(totalAnnualPremium/1e6).toFixed(1)}jt\n- Rasio premi/aset: ${totalAssets>0?((totalAnnualPremium/totalAssets)*100).toFixed(2):0}%\n\nPolis per kategori:\n${polisDetail}`;

    try {
      const res = await fetch('/api/ai', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:1000,
          system:'Kamu konsultan proteksi keuangan independen Indonesia. Analisa singkat dalam Bahasa Indonesia: 1) Status Proteksi per kategori, 2) Kategori yang kritis/kekurangan, 3) Rekomendasi prioritas max 3 poin dengan angka konkret. Maksimal 300 kata.',
          messages:[{role:'user',content:`Analisa proteksi:\n${ctx}`}] }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAnalysis('Error: ' + (data?.error?.message || data?.error || `HTTP ${res.status}`));
      } else {
        setAnalysis(data.content?.filter(b=>b.type==='text').map(b=>b.text).join('')||'Tidak ada respons.');
      }
    } catch (e) { setAnalysis('Gagal terhubung ke server: ' + e.message); }
    setLoading(false); setDone(true);
  };

  return (
    <Card T={T}>
      <SL T={T}>Analisa AI - Proteksi Kekayaan</SL>
      <div style={{ color:T.textSoft, fontSize:12, lineHeight:1.7, marginBottom:10 }}>AI menganalisa semua polis dan profil keuangan kamu, lalu memberikan rekomendasi prioritas per kategori.</div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, padding:'7px 12px', background:T.surface, borderRadius:9, border:`1px solid ${T.border}` }}>
        <span style={{ fontSize:11, color:T.muted }}>Biaya: 1 Pulse per analisa</span>
        <span style={{ fontSize:11, color: pulseCredits <= 2 ? T.red : T.muted }}>
          ⚡ <strong style={{ color: pulseCredits <= 2 ? T.red : T.accent }}>{pulseCredits}</strong> Pulse tersisa
        </span>
      </div>
      {!done&&!loading&&<TBtn T={T} variant={blocked ? 'default' : 'primary'} onClick={runAnalysis} style={{ width:'100%', padding:'12px 0', opacity: blocked ? 0.6 : 1 }}>🤖 Jalankan Analisa AI (1 Pulse)</TBtn>}
      {loading&&<div style={{ textAlign:'center', padding:'24px 0', color:T.muted, fontSize:13 }}><div style={{ fontSize:28, marginBottom:8 }}>🤖</div>Menganalisa...</div>}
      {done&&analysis&&(
        <>
          <div style={{ padding:'16px', background:T.surface, borderRadius:10, border:`1px solid ${T.border}`, fontSize:13, color:T.text, lineHeight:1.8, whiteSpace:'pre-wrap', marginBottom:12 }}>{analysis}</div>
          <TBtn T={T} variant="default" onClick={()=>{setDone(false);setAnalysis('');}} style={{ width:'100%', fontSize:12 }}>Analisa Ulang</TBtn>
        </>
      )}
    </Card>
  );
}

export default InsuranceScene;

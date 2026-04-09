import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  Card,
  SL,
  Chip,
  Bar,
  TInput,
  TSelect,
  TBtn,
  Donut,
  InfoBtn,
  LineChart,
} from "../components/ui";
import {
  fMoney,
  fM,
  parseVal,
  getIDR,
  FREQ_MULT,
  LS,
  LS2,
  getWealthSegment,
} from "../utils/helpers";
import {
  TIERS,
  getAIUsage,
  addAIUsage,
  canUploadPDF,
  pdfUploadsRemaining,
  addPDFUsage,
} from "../constants/tiers";
import { ASSET_CLASSES, RATES } from "../constants/data";

function GoalScene({
  assets,
  goals: goalsProp,
  setGoals: setGoalsProp,
  dispCur,
  T,
  tier,
  hideValues = false,
}) {
  const fV = (v, c) => fM(v, c, hideValues);
  const maxGoals = tier
    ? tier.maxGoals === Infinity
      ? 999999
      : tier.maxGoals
    : 999999;
  const [_goals, _setGoals] = useState([
    {
      id: 1,
      name: "Dana Pensiun",
      target: 5000000000,
      years: 25,
      allocations: {},
    },
    {
      id: 2,
      name: "Dana Darurat",
      target: 100000000,
      years: 1,
      allocations: {},
    },
  ]);
  const goals = goalsProp !== undefined ? goalsProp : _goals;
  const setGoals = setGoalsProp || _setGoals;
  const [newGoal, setNewGoal] = useState({ name: "", target: "", years: "" });
  const [activeGoal, setActiveGoal] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);
  const [allocInput, setAllocInput] = useState({});
  const totalPortfolio = assets.reduce((s, a) => s + getIDR(a), 0);
  const totalAllocByAsset = {};
  goals.forEach((g) =>
    Object.entries(g.allocations || {}).forEach(([aid, val]) => {
      totalAllocByAsset[aid] = (totalAllocByAsset[aid] || 0) + val;
    })
  );

  const addGoal = () => {
    const t = parseVal(newGoal.target),
      y = parseVal(newGoal.years);
    const cur = newGoal.currency || "IDR";
    const targetIDR = t * (RATES[cur] || 1);
    if (!newGoal.name || !t || !y) return;
    if (goals.length >= maxGoals) return;
    setGoals((p) => [
      ...p,
      {
        id: crypto.randomUUID(),
        name: newGoal.name,
        target: targetIDR,
        years: y,
        currency: cur,
        allocations: {},
      },
    ]);
    setNewGoal({ name: "", target: "", years: "", currency: "IDR" });
  };
  const saveAlloc = (goalId) => {
    setGoals((p) =>
      p.map((g) => {
        if (g.id !== goalId) return g;
        const na = { ...g.allocations };
        Object.entries(allocInput).forEach(([aid, val]) => {
          const v = parseVal(val);
          if (v > 0) na[aid] = v;
          else delete na[aid];
        });
        return { ...g, allocations: na };
      })
    );
    setActiveGoal(null);
    setAllocInput({});
  };

  const saveEdit = (id, field, val) => {
  setGoals(p => p.map(g => g.id === id ? { ...g, [field]: parseVal(val) } : g));
};
  
  const totalAllocated = Object.values(totalAllocByAsset).reduce(
    (s, v) => s + v,
    0
  );

  return (
    <div>
      <Card T={T} style={{ marginBottom: 16 }}>
        <SL T={T}>Tambah Goal</SL>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 0.5fr 1fr auto",
            gap: 9,
          }}
        >
          <TInput
            T={T}
            placeholder="Nama goal"
            value={newGoal.name}
            onChange={(e) =>
              setNewGoal((p) => ({ ...p, name: e.target.value }))
            }
          />
          <TInput
            T={T}
            placeholder="Target"
            value={newGoal.target}
            onChange={(e) =>
              setNewGoal((p) => ({ ...p, target: e.target.value }))
            }
          />
          <TSelect
            T={T}
            value={newGoal.currency || "IDR"}
            onChange={(e) =>
              setNewGoal((p) => ({ ...p, currency: e.target.value }))
            }
          >
            <option value="IDR">IDR</option>
            <option value="USD">USD</option>
            <option value="CNY">CNY</option>
            <option value="EUR">EUR</option>
          </TSelect>
          <TInput
            T={T}
            placeholder="Tahun"
            type="number"
            value={newGoal.years}
            onChange={(e) =>
              setNewGoal((p) => ({ ...p, years: e.target.value }))
            }
          />
          <TBtn
            T={T}
            variant="primary"
            onClick={addGoal}
            style={{ padding: "10px 14px" }}
          >
            +
          </TBtn>
        </div>
      </Card>
      {goals.length === 0 && (
        <Card T={T} style={{ border: `1px dashed ${T.border}`, textAlign: "center", padding: "36px 20px" }}>
          <div style={{ fontSize: 38, marginBottom: 10 }}>🎯</div>
          <div style={{ color: T.text, fontWeight: "bold", fontSize: 14, marginBottom: 6 }}>Belum ada goal keuangan</div>
          <div style={{ color: T.muted, fontSize: 12, lineHeight: 1.7, marginBottom: 14 }}>
            Buat goal seperti "Dana Pensiun", "DP Rumah", atau "Dana Darurat" — lalu alokasikan aset Anda untuk melacak progresnya.
          </div>
        </Card>
      )}
      {goals.map((goal) => {
        const allocated = Object.values(goal.allocations || {}).reduce(
          (s, v) => s + v,
          0
        );
        const pct = Math.min((allocated / goal.target) * 100, 100);
        // KODE BARU (OPSI B):
        const currentYear = 2026; // Sesuai tahun saat ini
        const isCalendarYear = goal.years > 1000;
        const duration = isCalendarYear ? Math.max(0.08, goal.years - currentYear) : goal.years;
        const totalMonths = duration * 12;

        const monthly = Math.max(
        0, 
        (goal.target - allocated) / (totalMonths || 1)
        );
        
        const isActive = activeGoal === goal.id;
        return (
          <Card
            T={T}
            key={goal.id}
            style={{ marginBottom: 14 }}
            glow={pct >= 100 ? T.green : undefined}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 12,
              }}
            >
              <div>
                <div
                  style={{
                    color: T.text,
                    fontSize: 15,
                    fontWeight: "bold",
                    marginBottom: 3,
                  }}
                >
                  ◇ {goal.name}
                </div>
                <div style={{ color: T.muted, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
  {editingGoal === goal.id ? (
    <>
      <input 
        type="number" 
        defaultValue={goal.target} 
        onBlur={(e) => saveEdit(goal.id, 'target', e.target.value)}
        style={{ width: 85, background: T.surface, color: T.text, border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 11, padding: '2px 4px' }}
      />
      <span>·</span>
      <input 
        type="number" 
        defaultValue={goal.years} 
        onBlur={(e) => saveEdit(goal.id, 'years', e.target.value)}
        style={{ width: 55, background: T.surface, color: T.text, border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 11, padding: '2px 4px' }}
      />
    </>
  ) : (
    <>Target {fV(goal.target, dispCur)} · {goal.years > 1000 ? `Thn ${goal.years}` : `${goal.years} thn`}</>
  )}
</div>

    
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
  <button
    onClick={() => setEditingGoal(editingGoal === goal.id ? null : goal.id)}
    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, opacity: 0.6 }}
  >
    {editingGoal === goal.id ? "💾" : "✏️"}
  </button>
  <Chip
    color={pct >= 100 ? T.green : pct > 50 ? T.orange : T.red}
    T={T}
  >
    {pct.toFixed(1)}%
  </Chip>
</div>
      
                <button
                  onClick={() =>
                    setGoals((p) => p.filter((g) => g.id !== goal.id))
                  }
                  style={{
                    background: "none",
                    border: "none",
                    color: T.muted,
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  ×
                </button>
              </div>
            </div>
            <Bar pct={pct} color={T.accent} h={7} T={T} />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: T.muted,
                marginTop: 6,
                marginBottom: 12,
              }}
            >
              <span>
                Teralokasi:{" "}
                <b style={{ color: T.accent }}>{fV(allocated, dispCur)}</b>
              </span>
              <span>
                Butuh:{" "}
                <b style={{ color: T.blue }}>{fV(monthly, dispCur)}/bln</b>
              </span>
            </div>
            {assets
              .filter((a) => (goal.allocations || {})[a.id] > 0)
              .map((a) => {
                const ac = ASSET_CLASSES.find((c) => c.key === a.classKey);
                return (
                  <div
                    key={a.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 10px",
                      background: T.surface,
                      borderRadius: 7,
                      marginBottom: 5,
                    }}
                  >
                    <div
                      style={{ display: "flex", gap: 7, alignItems: "center" }}
                    >
                      <span style={{ fontSize: 12 }}>{ac?.icon}</span>
                      <span style={{ color: T.text, fontSize: 12 }}>
                        {a.name}
                      </span>
                    </div>
                    <span
                      style={{
                        color: T.accent,
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    >
                      {fV(goal.allocations[a.id], dispCur)}
                    </span>
                  </div>
                );
              })}
            {isActive ? (
              <div
                style={{
                  background: T.surface,
                  borderRadius: 10,
                  padding: 14,
                  border: `1px solid ${T.border}`,
                  marginTop: 10,
                }}
              >
                <SL T={T}>Alokasikan Aset</SL>
                {assets
                  .filter((a) => !["property", "business"].includes(a.classKey))
                  .map((a) => {
                    const ac = ASSET_CLASSES.find((c) => c.key === a.classKey);
                    const lv = getIDR(a);
                    const curGoalAlloc = goal.allocations[a.id] || 0;
                    const maxAvail =
                      lv - (totalAllocByAsset[a.id] || 0) + curGoalAlloc;
                    const over = parseVal(allocInput[a.id]) > maxAvail;
                    return (
                      <div key={a.id} style={{ marginBottom: 10 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: 5,
                          }}
                        >
                          <span style={{ color: T.text, fontSize: 12 }}>
                            {ac?.icon} {a.name}
                          </span>
                          <span style={{ color: T.muted, fontSize: 11 }}>
                            Maks. {fV(maxAvail, dispCur)}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 7 }}>
                          <TInput
                            T={T}
                            placeholder="0"
                            value={allocInput[a.id] || ""}
                            onChange={(e) =>
                              setAllocInput((p) => ({
                                ...p,
                                [a.id]: e.target.value,
                              }))
                            }
                            style={{
                              flex: 1,
                              border: `1px solid ${over ? T.red : T.border}`,
                            }}
                          />
                          <button
                            onClick={() =>
                              setAllocInput((p) => ({
                                ...p,
                                [a.id]: String(Math.round(maxAvail)),
                              }))
                            }
                            style={{
                              background: T.border,
                              color: T.textSoft,
                              border: "none",
                              borderRadius: 7,
                              padding: "7px 10px",
                              fontSize: 11,
                              cursor: "pointer",
                            }}
                          >
                            Max
                          </button>
                        </div>
                        {over && (
                          <div
                            style={{ color: T.red, fontSize: 10, marginTop: 3 }}
                          >
                            ⚠ Melebihi saldo tersedia
                          </div>
                        )}
                      </div>
                    );
                  })}
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <TBtn
                    T={T}
                    variant="primary"
                    onClick={() => saveAlloc(goal.id)}
                    style={{ flex: 1, padding: 10 }}
                  >
                    Simpan
                  </TBtn>
                  <TBtn
                    T={T}
                    onClick={() => setActiveGoal(null)}
                    style={{ padding: "10px 14px" }}
                  >
                    Batal
                  </TBtn>
                </div>
              </div>
            ) : (
              <TBtn
                T={T}
                variant="ghost"
                onClick={() => {
                  setActiveGoal(goal.id);
                  const inp = {};
                  assets.forEach((a) => {
                    if (goal.allocations[a.id])
                      inp[a.id] = String(goal.allocations[a.id]);
                  });
                  setAllocInput(inp);
                }}
                style={{ width: "100%", marginTop: 10, padding: 9 }}
              >
                {Object.keys(goal.allocations || {}).length > 0
                  ? "✎ Ubah Alokasi Aset"
                  : "+ Alokasikan Aset ke Goal Ini"}
              </TBtn>
            )}
          </Card>
        );
      })}
      {totalPortfolio > 0 && (
        <Card
          T={T}
          style={{ background: T.accentDim, borderColor: T.accentSoft }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: T.accent, fontSize: 13, fontWeight: "bold" }}>
              Total Portofolio
            </span>
            <span style={{ color: T.accent, fontSize: 13, fontWeight: "bold" }}>
              {fV(totalPortfolio, dispCur)}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 6,
            }}
          >
            <span style={{ color: T.muted, fontSize: 11 }}>Dialokasikan</span>
            <span style={{ color: T.textSoft, fontSize: 11 }}>
              {fV(totalAllocated, dispCur)}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 4,
            }}
          >
            <span style={{ color: T.muted, fontSize: 11 }}>Bebas</span>
            <span style={{ color: T.green, fontSize: 11, fontWeight: "bold" }}>
              {fV(totalPortfolio - totalAllocated, dispCur)}
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}

export default GoalScene;

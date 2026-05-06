import { useMemo, useState } from 'react';
import './index.css';

type BoltDiameter = 'M12' | 'M16' | 'M20' | 'M22' | 'M24' | 'M27' | 'M30';
type BoltType = 'torsia' | 'hex';

interface BoltSpec {
  pitch: number;
  washerHeight: number;
  nutHeight: number;
  addLengthTC: number | null;
  addLengthHex: number;
  increment: 5 | 10;
}

interface CalculationResult {
  gripLength: number;
  addLength: number;
  theoreticalLength: number;
  selectedLength: number;
  surplusLength: number;
  threadCrests: number;
}

interface SavedRecord {
  id: string;
  name: string;
  note: string;
  diameter: BoltDiameter;
  type: BoltType;
  p1: number;
  p2: number;
  p3: number;
  result: CalculationResult;
  createdAt: string;
}

const STORAGE_KEY = 'bolt-length-records-v2';

const BOLT_DATA: Record<BoltDiameter, BoltSpec> = {
  M12: { pitch: 1.75, washerHeight: 3.2, nutHeight: 12, addLengthTC: null, addLengthHex: 25, increment: 5 },
  M16: { pitch: 2.0, washerHeight: 4.5, nutHeight: 16, addLengthTC: 25, addLengthHex: 30, increment: 5 },
  M20: { pitch: 2.5, washerHeight: 4.5, nutHeight: 20, addLengthTC: 30, addLengthHex: 35, increment: 5 },
  M22: { pitch: 2.5, washerHeight: 6.0, nutHeight: 22, addLengthTC: 35, addLengthHex: 40, increment: 5 },
  M24: { pitch: 3.0, washerHeight: 6.0, nutHeight: 24, addLengthTC: 40, addLengthHex: 45, increment: 5 },
  M27: { pitch: 3.0, washerHeight: 6.0, nutHeight: 27, addLengthTC: 45, addLengthHex: 50, increment: 10 },
  M30: { pitch: 3.5, washerHeight: 8.0, nutHeight: 30, addLengthTC: 50, addLengthHex: 55, increment: 10 },
};

function roundBySpec(theoretical: number, increment: 5 | 10): number {
  if (theoretical <= 0) return 0;

  if (increment === 5) {
    const base = Math.floor(theoretical / 10) * 10;
    const lastDigit = theoretical % 10;

    if (lastDigit <= 2) return base;
    if (lastDigit <= 7) return base + 5;
    return base + 10;
  }

  return Math.round(theoretical / 10) * 10;
}

function calculateLength(
  diameter: BoltDiameter,
  type: BoltType,
  p1: number,
  p2: number,
  p3: number,
): CalculationResult | null {
  const spec = BOLT_DATA[diameter];
  const addLength = type === 'torsia' ? spec.addLengthTC : spec.addLengthHex;

  if (addLength === null) return null;

  const gripLength = p1 + p2 + p3;
  const theoreticalLength = gripLength + addLength;
  const selectedLength = roundBySpec(theoreticalLength, spec.increment);
  const surplusLength = selectedLength - gripLength - spec.washerHeight - spec.nutHeight;
  const threadCrests = surplusLength / spec.pitch;

  return {
    gripLength,
    addLength,
    theoreticalLength,
    selectedLength,
    surplusLength,
    threadCrests,
  };
}

function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function loadRecords(): SavedRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [diameter, setDiameter] = useState<BoltDiameter>('M20');
  const [type, setType] = useState<BoltType>('torsia');
  const [p1, setP1] = useState('20');
  const [p2, setP2] = useState('20');
  const [p3, setP3] = useState('10');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [records, setRecords] = useState<SavedRecord[]>(() => loadRecords());

  const result = useMemo(
    () => calculateLength(diameter, type, toNumber(p1), toNumber(p2), toNumber(p3)),
    [diameter, type, p1, p2, p3],
  );

  const spec = BOLT_DATA[diameter];

  const saveRecord = () => {
    if (!result) return;

    const next: SavedRecord = {
      id: crypto.randomUUID(),
      name: name.trim() || `B-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}`,
      note: note.trim(),
      diameter,
      type,
      p1: toNumber(p1),
      p2: toNumber(p2),
      p3: toNumber(p3),
      result,
      createdAt: new Date().toISOString(),
    };

    const updated = [next, ...records];
    setRecords(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setName('');
    setNote('');
  };

  const deleteRecord = (id: string) => {
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const threadOk = result ? result.threadCrests >= 1 && result.threadCrests <= 6 : false;

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Bolt Length Expert</h1>
        <p>JASS6 based bolt-length calculator for steel connections</p>
      </header>

      <main className="layout">
        <section className="card form-card">
          <h2>Input</h2>

          <div className="field-row">
            <label>Bolt type</label>
            <div className="pill-group">
              <button className={type === 'torsia' ? 'active' : ''} onClick={() => setType('torsia')}>S10T (Torsia)</button>
              <button className={type === 'hex' ? 'active' : ''} onClick={() => setType('hex')}>F10T (Hex)</button>
            </div>
          </div>

          <div className="field-row">
            <label>Diameter</label>
            <div className="grid-diameter">
              {(Object.keys(BOLT_DATA) as BoltDiameter[]).map((d) => (
                <button key={d} className={diameter === d ? 'active' : ''} onClick={() => setDiameter(d)}>{d}</button>
              ))}
            </div>
          </div>

          <div className="field-row">
            <label>Plate thickness (mm)</label>
            <div className="three-inputs">
              <input value={p1} onChange={(e) => setP1(e.target.value)} type="number" min="0" step="0.1" placeholder="P1" />
              <input value={p2} onChange={(e) => setP2(e.target.value)} type="number" min="0" step="0.1" placeholder="P2" />
              <input value={p3} onChange={(e) => setP3(e.target.value)} type="number" min="0" step="0.1" placeholder="P3" />
            </div>
          </div>

          <div className="field-row">
            <label>Save record</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (optional)" />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" />
            <button className="save-btn" onClick={saveRecord} disabled={!result}>Save</button>
          </div>
        </section>

        <section className="card result-card">
          <h2>Result</h2>
          {!result ? (
            <div className="warning">M12 cannot use Torsia in this rule set. Please switch to F10T.</div>
          ) : (
            <>
              <div className="main-number">{result.selectedLength}<span>mm</span></div>
              <div className="metrics">
                <div><strong>Grip</strong><span>{result.gripLength.toFixed(1)} mm</span></div>
                <div><strong>Addition</strong><span>{result.addLength.toFixed(1)} mm</span></div>
                <div><strong>Theoretical</strong><span>{result.theoreticalLength.toFixed(1)} mm</span></div>
                <div><strong>Surplus</strong><span>{result.surplusLength.toFixed(1)} mm</span></div>
                <div><strong>Thread crests</strong><span className={threadOk ? 'ok' : 'warn'}>{result.threadCrests.toFixed(2)}</span></div>
                <div><strong>Rule</strong><span>{spec.increment === 5 ? '2¡õ / 3-7¡÷5 / 8¡ô (mm)' : 'Nearest 10 mm'}</span></div>
              </div>
            </>
          )}
        </section>
      </main>

      <section className="card history-card">
        <h2>Saved Records ({records.length})</h2>
        {records.length === 0 ? (
          <p className="empty">No saved data yet.</p>
        ) : (
          <div className="record-list">
            {records.map((r) => {
              const ok = r.result.threadCrests >= 1 && r.result.threadCrests <= 6;
              return (
                <article key={r.id} className="record-item">
                  <div>
                    <h3>{r.name}</h3>
                    <p>{r.note || 'No note'}</p>
                    <p>
                      {r.diameter} {r.type === 'torsia' ? 'S10T' : 'F10T'} | P1/P2/P3 = {r.p1}/{r.p2}/{r.p3} mm
                    </p>
                  </div>
                  <div className="record-right">
                    <div className="record-len">{r.result.selectedLength} mm</div>
                    <div className={ok ? 'ok' : 'warn'}>Crest: {r.result.threadCrests.toFixed(2)}</div>
                    <button onClick={() => deleteRecord(r.id)}>Delete</button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
import { useState, useEffect } from "react";
import { ArrowDownUp, Loader2 } from "lucide-react";
import { fetchRates, CURRENCIES } from "../../../core/currency";
import { SegmentedControl } from "../../ui";

export default function Calculator() {
  const [tab, setTab] = useState<"calc" | "conv">("calc");
  return tab === "calc" ? (
    <CalcPanel onSwitch={() => setTab("conv")} />
  ) : (
    <CurrencyPanel onSwitch={() => setTab("calc")} />
  );
}

/* ---------------- Calculator ---------------- */

function CalcPanel({ onSwitch }: { onSwitch: () => void }) {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [fresh, setFresh] = useState(true);

  const handleNumber = (n: string) => {
    if (fresh) {
      setDisplay(n === "." ? "0." : n);
      setFresh(false);
    } else {
      if (n === "." && display.includes(".")) return;
      setDisplay(display === "0" && n !== "." ? n : display + n);
    }
  };

  const handleOp = (nextOp: string) => {
    const current = parseFloat(display);
    if (prev !== null && op && !fresh) {
      const result = calculate(prev, current, op);
      setDisplay(isFinite(result) ? String(result) : 'Error');
      setPrev(isFinite(result) ? result : null);
    } else {
      setPrev(current);
    }
    setOp(nextOp);
    setFresh(true);
  };

  const calculate = (a: number, b: number, operator: string) => {
    switch (operator) {
      case "+": return a + b;
      case "-": return a - b;
      case "*": return a * b;
      case "/": return b !== 0 ? a / b : NaN;
      default: return b;
    }
  };

  const handleEquals = () => {
    if (prev === null || !op) return;
    const current = parseFloat(display);
    const result = calculate(prev, current, op);
    setDisplay(isFinite(result) ? String(result) : 'Error');
    setPrev(null);
    setOp(null);
    setFresh(true);
  };

  const handleClear = () => {
    setDisplay("0");
    setPrev(null);
    setOp(null);
    setFresh(true);
  };

  const handlePlusMinus = () => {
    setDisplay(String(parseFloat(display) * -1));
  };

  const handlePercent = () => {
    setDisplay(String(parseFloat(display) / 100));
  };

  const isNumber = (v: string) => /^[0-9.]$/.test(v);

  const getBtnStyle = (label: string, wide = false): React.CSSProperties => {
    if (isNumber(label)) {
      return { ...styles.btn, ...(wide ? styles.btnWide : {}), backgroundColor: "#333", color: "#fff" };
    }
    if (["+", "-", "*", "/", "="].includes(label)) {
      return { ...styles.btn, ...(wide ? styles.btnWide : {}), backgroundColor: "#ff9500", color: "#fff", fontSize: 28 };
    }
    return { ...styles.btn, backgroundColor: "#a5a5a5", color: "#000", fontSize: 20 };
  };

  const rows = [
    ["AC", "+/-", "%", "/"],
    ["7", "8", "9", "*"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["0", ".", "="],
  ];

  return (
    <div style={styles.container}>
      <div style={styles.segmentWrap}>
        <SegmentedControl
          name="calc"
          options={[
            { label: "Calculadora", value: "calc" },
            { label: "Divisas", value: "conv" },
          ]}
          value="calc"
          onChange={onSwitch}
        />
      </div>
      <div style={styles.display}>
        <span style={styles.displayText}>{display}</span>
      </div>
      <div style={styles.grid}>
        {rows.map((row, ri) => (
          <div key={ri} style={styles.row}>
            {row.map((label) => {
              const isWide = label === "0" && row.length === 5;
              return (
                <button
                  key={label + ri}
                  className="pressable"
                  style={getBtnStyle(label, isWide)}
                  onClick={() => {
                    if (isNumber(label)) handleNumber(label);
                    else if (label === "AC") handleClear();
                    else if (label === "+/-") handlePlusMinus();
                    else if (label === "%") handlePercent();
                    else if (label === "=") handleEquals();
                    else handleOp(label);
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Currency converter ---------------- */

function CurrencyPanel({ onSwitch }: { onSwitch: () => void }) {
  const [amount, setAmount] = useState<string>("1");
  const [from, setFrom] = useState<string>("USD");
  const [to, setTo] = useState<string>("CRC");
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [base, setBase] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState("");

  useEffect(() => {
    if (!from || from === base) return;
    let alive = true;
    setLoading(true);
    fetchRates(from)
      .then(d => {
        if (!alive) return;
        setRates(d.rates);
        setBase(from);
        setUpdated(d.updated);
      })
      .catch(() => {
        if (alive) setRates(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from]);

  const num = parseFloat(amount.replace(',', '.')) || 0;
  const result = rates && base === from ? num * (rates[to] ?? 0) : null;

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div style={styles.container}>
      <div style={styles.segmentWrap}>
        <SegmentedControl
          name="calc"
          options={[
            { label: "Calculadora", value: "calc" },
            { label: "Divisas", value: "conv" },
          ]}
          value="conv"
          onChange={onSwitch}
        />
      </div>

      <div style={styles.convBody}>
        <div style={styles.amountRow}>
          <input
            style={styles.amountInput}
            value={amount}
            inputMode="decimal"
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
          />
        </div>

        {loading ? (
          <div style={styles.rateLoading}>
            <Loader2 size={20} color="#fff" className="spin" />
            <span style={styles.rateHint}>Actualizando tasas…</span>
          </div>
        ) : rates && base === from ? (
          <div style={styles.rateHint}>
            1 {from} = {(rates[to] ?? 0).toLocaleString('es', { maximumFractionDigits: 4 })} {to}
          </div>
        ) : (
          <div style={styles.rateHint}>Sin conexión con el servicio de tasas</div>
        )}

        <div style={styles.swapRow}>
          <select
            style={styles.pick}
            value={from}
            onChange={e => setFrom(e.target.value)}
            aria-label="De"
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.flag} {c.code} · {c.name}</option>
            ))}
          </select>
          <button className="pressable" style={styles.swapBtn} onClick={swap} aria-label="Intercambiar">
            <ArrowDownUp size={22} color="#ff9500" />
          </button>
          <select
            style={styles.pick}
            value={to}
            onChange={e => setTo(e.target.value)}
            aria-label="A"
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.flag} {c.code} · {c.name}</option>
            ))}
          </select>
        </div>

        <div style={styles.resultBox}>
          {result !== null ? (
            <>
              <div style={styles.resultAmount}>
                {result.toLocaleString('es', { maximumFractionDigits: 4 })} {to}
              </div>
              <div style={styles.resultSub}>
                {num.toLocaleString('es', { maximumFractionDigits: 4 })} {from} =
              </div>
            </>
          ) : (
            <div style={styles.resultAmount}>—</div>
          )}
        </div>

        {updated && (
          <div style={styles.updatedTxt}>
            Tasas de {new Date(updated).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: "#000",
    padding: "14px 14px 18px",
    boxSizing: "border-box",
  },
  segmentWrap: {
    padding: "2px 4px",
    marginBottom: 4,
  },
  display: {
    flex: 1,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    paddingRight: 12,
    minHeight: 90,
  },
  displayText: {
    color: "#fff",
    fontSize: 64,
    fontWeight: 300,
    lineHeight: 1.1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  grid: { display: "flex", flexDirection: "column", gap: 12, paddingBottom: 4 },
  row: { display: "flex", gap: 12, justifyContent: "space-between" },
  btn: {
    height: 62,
    borderRadius: 31,
    border: "none",
    fontSize: 28,
    fontWeight: 400,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    userSelect: "none",
  },
  btnWide: { flex: 2.15, borderRadius: 31, justifyContent: "flex-start", paddingLeft: 28 },
  convBody: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 },
  amountRow: { display: "flex", justifyContent: "center" },
  amountInput: {
    background: "none",
    border: "none",
    outline: "none",
    color: "#fff",
    fontSize: 52,
    fontWeight: 300,
    textAlign: "center" as const,
    width: "85%",
  },
  rateLoading: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  rateHint: { textAlign: "center" as const, fontSize: 13, color: "#98989E" },
  swapRow: { display: "flex", alignItems: "center", gap: 10 },
  pick: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    border: "none",
    background: "#1C1C1E",
    color: "#fff",
    fontSize: 13,
    padding: '0 10px',
    minWidth: 0,
  },
  swapBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    border: "none",
    background: "#1C1C1E",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  resultBox: {
    borderRadius: 16,
    background: "#1C1C1E",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  resultAmount: { color: "#fff", fontSize: 40, fontWeight: 600, textAlign: "right" as const },
  resultSub: { color: "#98989E", fontSize: 14, textAlign: "right" as const },
  updatedTxt: { textAlign: "center" as const, fontSize: 11, color: "#6E6E73" },
};
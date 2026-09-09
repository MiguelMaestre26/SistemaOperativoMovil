import { useState } from "react";

export default function Calculator() {
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
      return {
        ...styles.btn,
        ...(wide ? styles.btnWide : {}),
        backgroundColor: "#333",
        color: "#fff",
      };
    }
    if (["+", "-", "*", "/", "="].includes(label)) {
      return {
        ...styles.btn,
        ...(wide ? styles.btnWide : {}),
        backgroundColor: label === "=" ? "#ff9500" : "#ff9500",
        color: "#fff",
        fontSize: 28,
      };
    }
    return {
      ...styles.btn,
      backgroundColor: "#a5a5a5",
      color: "#000",
      fontSize: 20,
    };
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

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: "#000",
    padding: 20,
    boxSizing: "border-box",
  },
  display: {
    flex: 1,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    paddingRight: 10,
    minHeight: 100,
  },
  displayText: {
    color: "#fff",
    fontSize: 72,
    fontWeight: 300,
    lineHeight: 1.1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    paddingBottom: 10,
  },
  row: {
    display: "flex",
    gap: 12,
    justifyContent: "space-between",
  },
  btn: {
    height: 72,
    borderRadius: 36,
    border: "none",
    fontSize: 28,
    fontWeight: 400,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    userSelect: "none",
    transition: "opacity 0.1s",
  },
  btnWide: {
    flex: 2.15,
    borderRadius: 36,
    justifyContent: "flex-start",
    paddingLeft: 28,
  },
};

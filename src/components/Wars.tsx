import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell
} from "recharts";

const GOLD = "var(--gold)";
const GOLD2 = "var(--gold-dim)";
const RED = "var(--red)";
const PANEL = "var(--panel)";
const BORDER = "var(--border)";
const BORDER2 = "var(--border2)";
const TEXT = "var(--text)";
const TEXTDIM = "var(--text-dim)";
const BG = "var(--bg)";
const FONT_FAMILY = "var(--font-main)";
const FONT_STYLE = "var(--font-style)"

interface Props {
  warData: (any | number)[] | null;
  selectedTag: string;
  loading: boolean;
}

function fmt(n: any): string {
  const v = Number(n);
  if (isNaN(v)) return "—";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return v.toString();
}

export function WarHistoryView({ warData, selectedTag, loading }: Props) {
  const totalLosses = warData && typeof warData[warData.length - 1] === 'number' 
    ? (warData[warData.length - 1] as number) 
    : 0;
  
  const wars = warData 
    ? (warData.slice(0, -1) as any[]).filter(w => typeof w === 'object') 
    : [];

  if (loading) return <div style={{ color: TEXTDIM, fontStyle: FONT_STYLE, padding: 40, textAlign: "center" }}>Загрузка...</div>;
  if (!selectedTag || !warData) return <div style={{ color: TEXTDIM, fontStyle: FONT_STYLE, padding: 40, textAlign: "center", fontSize: 16 }}>Выберите державу для военного анализа</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 1200, margin: "0 auto" }}>
      
      {/* HEADER: TOTAL CASUALTIES */}
      <div style={{ 
        background: "linear-gradient(180deg, #1a0505 0%, var(--panel) 100%)", 
        border: `1px solid ${RED}`, 
        padding: "24px", 
        textAlign: "center",
        boxShadow: "inset 0 0 30px rgba(255,0,0,0.05)"
      }}>
        <div style={{ color: RED, fontSize: 10, letterSpacing: 3, marginBottom: 8, textTransform: "uppercase" }}>
          Общие человеческие потери за всю историю
        </div>
        <div style={{ color: "#eee", fontSize: 42, fontFamily: FONT_FAMILY, fontWeight: "bold", textShadow: "0 0 10px rgba(255,0,0,0.3)" }}>
          {fmt(totalLosses)}
        </div>
        <div style={{ color: TEXTDIM, fontSize: 11, marginTop: 4, fontStyle: FONT_STYLE }}>
          "Смерть и голод"
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16 }}>
        
        {/* CHART: TOP CONFLICTS */}
        <div style={{ background: PANEL, border: `1px solid ${BORDER}`, padding: 20 }}>
        <div style={{ color: GOLD2, fontSize: 10, letterSpacing: 2, marginBottom: 20, textTransform: "uppercase" }}>
            Масштаб крупнейших столкновений
        </div>
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={wars.slice(0, 6)}>
            <CartesianGrid stroke={BORDER2} vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="name" hide />
            <YAxis 
                tick={{ fill: "#ccc", fontSize: 10 }} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={fmt} 
            />
            <Tooltip 
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                contentStyle={{ 
                background: BG, 
                border: `1px solid ${BORDER}`, 
                fontSize: 12,
                color: "#fff"
                }}
                itemStyle={{ color: "#eee", fontWeight: "bold" }}
                labelStyle={{ color: GOLD, marginBottom: 4 }} 
                formatter={(v: any) => [fmt(v), "Потери"]}
            />
            <Bar dataKey="total_losses" radius={[2, 2, 0, 0]}>
                {wars.slice(0, 6).map((index) => (
                <Cell 
                    key={`cell-${index}`} 
                    fill={index === 0 ? RED : "rgba(168, 58, 42, 0.6)"} 
                />
                ))}
            </Bar>
            </BarChart>
        </ResponsiveContainer>
        </div>

        {/* RECENT LOSSES ANALYTICS */}
        <div style={{ background: PANEL, border: `1px solid ${BORDER}`, padding: 20, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: TEXTDIM, fontSize: 9, letterSpacing: 1 }}>ПОСЛЕДНЯЯ КРУПНАЯ ВОЙНА</div>
            <div style={{ color: GOLD, fontSize: 18, fontFamily: FONT_FAMILY }}>{wars[0]?.name || "—"}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ color: TEXTDIM, fontSize: 12 }}>АТАКУЮЩИЕ</div>
              <div style={{ color: "var(--blue)", fontSize: 16 }}>{wars[0]?.attackers.slice(0, 3).join(", ")}</div>
            </div>
            <div>
              <div style={{ color: TEXTDIM, fontSize: 12 }}>ОБОРОНА</div>
              <div style={{ color: "var(--orange)", fontSize: 16 }}>{wars[0]?.defenders.slice(0, 3).join(", ")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED CHRONICLE TABLE */}
      <div style={{ background: PANEL, border: `1px solid ${BORDER}`, padding: "0 20px 20px 20px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: TEXT }}>
          <thead>
            <tr style={{ textAlign: "left", color: TEXTDIM, fontSize: 9, letterSpacing: 1.5 }}>
              <th style={{ padding: "20px 0 10px 0", borderBottom: `1px solid ${BORDER2}` }}>КОНФЛИКТ / ПЕРИОД</th>
              <th style={{ padding: "20px 0 10px 0", borderBottom: `1px solid ${BORDER2}` }}>ТВОИ ПОТЕРИ</th>
              <th style={{ padding: "20px 0 10px 0", borderBottom: `1px solid ${BORDER2}`, textAlign: "right" }}>ОБЩИЕ ПОТЕРИ</th>
            </tr>
          </thead>
          <tbody>
            {wars.map((war, idx) => {
              const myLosses = (war.casualites_atk[selectedTag] || 0) + (war.casualites_def[selectedTag] || 0);
              return (
                <tr key={idx} style={{ borderBottom: `1px solid ${BORDER2}` }}>
                  <td style={{ padding: "14px 0" }}>
                    <div style={{ color: GOLD, fontSize: 14, fontFamily: FONT_FAMILY }}>{war.name}</div>
                    <div style={{ color: TEXTDIM, fontSize: 10 }}>{war.start_date} — {war.end_date}</div>
                  </td>
                  <td style={{ padding: "14px 0", color: myLosses > 0 ? RED : TEXTDIM, fontWeight: 600 }}>
                    {myLosses > 0 ? fmt(myLosses) : "0"}
                  </td>
                  <td style={{ padding: "14px 0", textAlign: "right", color: "#ccc" }}>
                    {fmt(war.total_losses)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
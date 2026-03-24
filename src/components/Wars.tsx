import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell
} from "recharts";

const GOLD = "var(--gold)";
const GOLD2 = "var(--gold-dim)";
const RED = "var(--red)";
const BLUE = "var(--blue)"
const PANEL = "var(--panel)";
const BORDER = "var(--border)";
const BORDER2 = "var(--border2)";
const TEXT = "var(--text)";
const TEXTDIM = "var(--text-dim)";
const BG = "var(--bg)";
const FONT_FAMILY = "var(--font-main)";
const FONT_STYLE = "var(--font-style)";

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

function SideBadge({ tag, attackers }: { tag: string; attackers: string[] }) {
  const isAtk = attackers.includes(tag);
  return (
    <span style={{ 
      fontSize: 9, padding: "2px 6px", borderRadius: 2, marginLeft: 8,
      background: isAtk ? "rgba(255, 71, 71, 0.15)" : "rgba(71, 149, 255, 0.15)",
      color: isAtk ? RED : BLUE,
      border: `1px solid ${isAtk ? RED : BLUE}`,
      textTransform: "uppercase", fontWeight: "bold"
    }}>
      {isAtk ? "Агрессор" : "Оборона"}
    </span>
  );
}

export function WarHistoryView({ warData, selectedTag, loading }: Props) {
  const totalLosses = warData && typeof warData[warData.length - 1] === 'number' 
    ? (warData[warData.length - 1] as number) 
    : 0;
  
  const wars = warData 
    ? (warData.slice(0, -1) as any[]).filter(w => typeof w === 'object') 
    : [];

  if (loading) return <div style={{ color: TEXTDIM, fontStyle: FONT_STYLE, padding: 40, textAlign: "center" }}>Сводка формируется...</div>;
  if (!selectedTag || !warData) return <div style={{ color: TEXTDIM, fontStyle: FONT_STYLE, padding: 40, textAlign: "center", fontSize: 16 }}>Выберите державу для детального анализа войн</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 1200, margin: "0 auto", paddingBottom: 40 }}>
      
      <div style={{ 
        background: "linear-gradient(180deg, #1a0505 0%, var(--panel) 100%)", 
        border: `1px solid ${RED}`, 
        padding: "24px", 
        textAlign: "center",
        boxShadow: "inset 0 0 30px rgba(255,0,0,0.05)"
      }}>
        <div style={{ color: RED, fontSize: 10, letterSpacing: 3, marginBottom: 8, textTransform: "uppercase" }}>
          Суммарные людские потери в мировых конфликтах
        </div>
        <div style={{ color: "#eee", fontSize: 42, fontFamily: FONT_FAMILY, fontWeight: "bold", textShadow: "0 0 10px rgba(255,0,0,0.3)" }}>
          {fmt(totalLosses)}
        </div>
        <div style={{ color: TEXTDIM, fontSize: 11, marginTop: 4, fontStyle: FONT_STYLE }}>
          "Bellum se ipsum alet"
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16 }}>
        
        <div style={{ background: PANEL, border: `1px solid ${BORDER}`, padding: 20 }}>
          <div style={{ color: GOLD2, fontSize: 10, letterSpacing: 2, marginBottom: 20, textTransform: "uppercase" }}>
            Масштабы крупнейших столкновений
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
                contentStyle={{ background: BG, border: `1px solid ${BORDER}`, fontSize: 12, color: "#fff" }}
                itemStyle={{ color: "#eee", fontWeight: "bold" }}
                labelStyle={{ color: GOLD, marginBottom: 4 }} 
                formatter={(v: any) => [fmt(v), "Потери"]}
              />
              <Bar dataKey="total_losses" radius={[2, 2, 0, 0]}>
                {wars.slice(0, 6).map((index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? RED : "rgba(168, 58, 42, 0.6)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: PANEL, border: `1px solid ${BORDER}`, padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: TEXTDIM, fontSize: 9, letterSpacing: 1, marginBottom: 8 }}>ПОСЛЕДНИЙ ГЛОБАЛЬНЫЙ КОНФЛИКТ</div>
            <div style={{ color: GOLD, fontSize: 20, fontFamily: FONT_FAMILY, lineHeight: 1.2 }}>{wars[0]?.name || "—"}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
            <div>
              <div style={{ color: TEXTDIM, fontSize: 10, marginBottom: 4 }}>АГРЕССОРЫ</div>
              <div style={{ color: RED, fontSize: 13, fontWeight: "bold", opacity: 0.9 }}>{wars[0]?.attackers.join(", ") || "—"}</div>
            </div>
            <div>
              <div style={{ color: TEXTDIM, fontSize: 10, marginBottom: 4 }}>ОБОРОНЯЮЩИЕСЯ</div>
              <div style={{ color: "#ff9547", fontSize: 13, fontWeight: "bold", opacity: 0.9 }}>{wars[0]?.defenders.join(", ") || "—"}</div>
            </div>
          </div>
          
          {wars[0]?.biggest_land_battle && (
             <div style={{ marginTop: 20, padding: 12, background: "rgba(255,255,255,0.02)", borderLeft: `2px solid ${RED}` }}>
                <div style={{ color: GOLD2, fontSize: 9, letterSpacing: 1 }}>ГЕНЕРАЛЬНОЕ СРАЖЕНИЕ</div>
                <div style={{ color: "#eee", fontSize: 14, marginTop: 2 }}>{wars[0].biggest_land_battle.name}</div>
                <div style={{ color: TEXTDIM, fontSize: 11, marginTop: 4 }}>
                  Потери сторон: <span style={{ color: RED }}>{fmt(wars[0].biggest_land_battle.attacker.losses + wars[0].biggest_land_battle.defender.losses)}</span>
                </div>
             </div>
          )}
        </div>
      </div>

      <div style={{ background: PANEL, border: `1px solid ${BORDER}`, padding: "8px 20px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: TEXT }}>
          <thead>
            <tr style={{ textAlign: "left", color: TEXTDIM, fontSize: 9, letterSpacing: 1.5 }}>
              <th style={{ padding: "16px 0", borderBottom: `1px solid ${BORDER2}` }}>ТЕАТР ВОЕННЫХ ДЕЙСТВИЙ</th>
              <th style={{ padding: "16px 0", borderBottom: `1px solid ${BORDER2}`, textAlign: "center" }}>ВАШ ВКЛАД</th>
              <th style={{ padding: "16px 0", borderBottom: `1px solid ${BORDER2}`, textAlign: "right" }}>ОБЩИЕ ПОТЕРИ</th>
            </tr>
          </thead>
          <tbody>
            {wars.map((war, idx) => {
              const myLosses = (war.casualites_atk[selectedTag] || 0) + (war.casualites_def[selectedTag] || 0);
              const isParticipant = war.attackers.includes(selectedTag) || war.defenders.includes(selectedTag);
              const land = war.biggest_land_battle;
              const sea = war.biggest_sea_battle;
              const totalShips = (war.fleet_casualites_atk || 0) + (war.fleet_casualites_def || 0);

              return (
                <tr key={idx} style={{ borderBottom: `1px solid ${BORDER2}` }}>
                  <td style={{ padding: "20px 0" }}>
                    <div style={{ display: "flex", alignItems: "", marginBottom: 6 }}>
                      <div style={{ color: GOLD, fontSize: 16, fontFamily: FONT_FAMILY, fontWeight: 500 }}>{war.name}</div>
                      {isParticipant && <SideBadge tag={selectedTag} attackers={war.attackers} />}
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: 8 }}>
                      {land && (
                        <div style={{ fontSize: 15, color: TEXTDIM, background: "rgba(255,255,255,0.03)", padding: "4px 8px", borderRadius: 2 }}>
                          <span style={{ marginRight: 6 }}>⚔️</span>
                          <span style={{ color: "#ccc", textAlign: "center" }}>{land.name}</span>
                          <div style={{ marginLeft: 18, fontSize: 13, opacity: 0.7 }}>
                            {land.attacker.leader || "Без лидера"} vs {land.defender.leader || "Без лидера"}
                          </div>
                          <div style={{ color: TEXTDIM, fontSize: 12, marginTop: 4 }}>
                            Потери сторон: <span style={{ color: RED }}>{fmt(land.attacker.losses + land.defender.losses)}</span>
                          </div>
                        </div>
                      )}
                      {sea && (
                        <div style={{ fontSize: 15, color: BLUE, background: "rgba(71, 149, 255, 0.05)", padding: "4px 8px", borderRadius: 2 }}>
                          <span style={{ marginRight: 6 }}>⚓</span>
                          <span style={{ color: BLUE }}>{sea.name}</span>
                          <div style={{ marginLeft: 18, fontSize: 13, opacity: 0.8 }}>
                            Результат: {sea.result ? "Победа атаки" : "Победа защиты"}
                          </div>
                          <div style={{ color: BLUE, fontSize: 12, marginTop: 4}}>
                            Потери сторон: <span style={{ color: BLUE }}>{fmt(sea.attacker.losses + sea.defender.losses)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ color: TEXTDIM, fontSize: 14, marginTop: 8, opacity: 0.6 }}>Период: {war.start_date} — {war.end_date}</div>
                  </td>
                  
                  <td style={{ padding: "20px 0" }}>
                    <div style={{ color: myLosses > 0 ? RED : TEXTDIM, fontSize: 18, fontWeight: "bold", fontFamily: FONT_FAMILY, textAlign: "center" }}>
                      {myLosses > 0 ? fmt(myLosses) : "—"}
                    </div>
                  </td>

                  <td style={{ padding: "20px 0", textAlign: "right" }}>
                    <div style={{ marginBottom: totalShips > 0 ? 12 : 0 }}>
                      <div style={{ color: "#eee", fontSize: 18, fontWeight: "bold", fontFamily: FONT_FAMILY }}>
                        {fmt(war.total_losses)}
                      </div>
                      <div style={{ fontSize: 9, color: TEXTDIM, letterSpacing: 0.5, textTransform: "uppercase" }}>
                        Суммарные жертвы
                      </div>
                    </div>
                    {totalShips > 0 && (
                      <div>
                        <div style={{ color: BLUE, fontSize: 18, fontWeight: "bold", fontFamily: FONT_FAMILY }}>
                          {totalShips}
                        </div>
                        <div style={{ fontSize: 9, color: TEXTDIM, letterSpacing: 0.5, textTransform: "uppercase" }}>
                          Потоплено кораблей
                        </div>
                      </div>
                    )}
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
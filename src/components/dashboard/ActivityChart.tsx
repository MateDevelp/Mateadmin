import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Lun", utenti: 45 },
  { name: "Mar", utenti: 52 },
  { name: "Mer", utenti: 48 },
  { name: "Gio", utenti: 61 },
  { name: "Ven", utenti: 55 },
  { name: "Sab", utenti: 42 },
  { name: "Dom", utenti: 38 },
];

export const ActivityChart = () => {
  return (
    <Card className="shadow-card p-6">
      <h2 className="text-xl font-semibold mb-6">Utenti Attivi (Ultimi 7 Giorni)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis 
            dataKey="name" 
            className="text-muted-foreground"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis 
            className="text-muted-foreground"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
          />
          <Line
            type="monotone"
            dataKey="utenti"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            dot={{ fill: "hsl(var(--primary))", r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

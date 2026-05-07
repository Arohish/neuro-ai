import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";

export function ContributorChart({ data }: { data: { name: string; weight: number }[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
          <XAxis type="number" hide domain={[0, 1]} />
          <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" fontSize={12} width={110} />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }}
            formatter={(v: number) => `${(v * 100).toFixed(0)}%`}
          />
          <Bar dataKey="weight" radius={[6, 6, 6, 6]}>
            {data.map((_, i) => (
              <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

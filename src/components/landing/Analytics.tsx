import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Section, SectionHeading } from "./Section";

const admissions = [
  { m: "Apr", v: 42 },
  { m: "May", v: 68 },
  { m: "Jun", v: 91 },
  { m: "Jul", v: 74 },
  { m: "Aug", v: 62 },
  { m: "Sep", v: 55 },
];

const attendance = [
  { m: "Apr", v: 93 },
  { m: "May", v: 91 },
  { m: "Jun", v: 95 },
  { m: "Jul", v: 94 },
  { m: "Aug", v: 96 },
  { m: "Sep", v: 94 },
];

const collection = [
  { m: "Term I", v: 96 },
  { m: "Term II", v: 82 },
  { m: "Term III", v: 41 },
];

const performance = [
  { m: "VI", v: 78 },
  { m: "VII", v: 81 },
  { m: "VIII", v: 76 },
  { m: "IX", v: 84 },
  { m: "X", v: 88 },
  { m: "XI", v: 80 },
  { m: "XII", v: 86 },
];

const axis = { fontSize: 11, fill: "var(--muted-foreground)" };

function Card({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <p className="text-sm font-bold">{title}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
      <div className="mt-4 h-44">
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function Analytics() {
  return (
    <Section id="analytics" tone="surface">
      <SectionHeading
        eyebrow="Reports & analytics"
        title="Decisions backed by live school data"
        description="Admissions, attendance, collections and exam performance — exportable reports for management, sample data shown."
      />
      <div className="mt-14 grid gap-4 lg:grid-cols-2">
        <Card title="Admissions" sub="New enrollments per month">
          <AreaChart data={admissions}>
            <defs>
              <linearGradient id="grad-adm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="m" tick={axis} axisLine={false} tickLine={false} />
            <YAxis tick={axis} axisLine={false} tickLine={false} width={28} />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid var(--border)" }} />
            <Area type="monotone" dataKey="v" stroke="var(--brand)" strokeWidth={2} fill="url(#grad-adm)" />
          </AreaChart>
        </Card>

        <Card title="Attendance rate" sub="School average %">
          <LineChart data={attendance}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="m" tick={axis} axisLine={false} tickLine={false} />
            <YAxis domain={[85, 100]} tick={axis} axisLine={false} tickLine={false} width={28} />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid var(--border)" }} />
            <Line type="monotone" dataKey="v" stroke="var(--brand-glow)" strokeWidth={2.5} dot={false} />
          </LineChart>
        </Card>

        <Card title="Fee collection" sub="% collected per term">
          <BarChart data={collection}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="m" tick={axis} axisLine={false} tickLine={false} />
            <YAxis tick={axis} axisLine={false} tickLine={false} width={28} />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid var(--border)" }} />
            <Bar dataKey="v" fill="var(--brand)" radius={[8, 8, 0, 0]} barSize={44} />
          </BarChart>
        </Card>

        <Card title="Exam performance" sub="Average score by class">
          <BarChart data={performance}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="m" tick={axis} axisLine={false} tickLine={false} />
            <YAxis tick={axis} axisLine={false} tickLine={false} width={28} />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid var(--border)" }} />
            <Bar dataKey="v" fill="var(--brand-glow)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </Card>
      </div>
    </Section>
  );
}

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface SubjectData {
  name: string;
  credits: number;
  grade: string;
  grade_point?: number;
}

const GRADE_POINTS: Record<string, number> = {
  'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'U': 0,
};

const getBarColor = (gp: number) => {
  if (gp >= 9) return 'hsl(142, 76%, 36%)';
  if (gp >= 7) return 'hsl(217, 91%, 60%)';
  if (gp >= 5) return 'hsl(45, 93%, 47%)';
  return 'hsl(0, 84%, 60%)';
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semester: number;
  gpa: number | null;
  subjects: SubjectData[] | null;
}

export function SemesterAnalysisDialog({ open, onOpenChange, semester, gpa, subjects }: Props) {
  const chartData = (subjects || []).map((sub) => ({
    name: sub.name?.length > 12 ? sub.name.slice(0, 12) + '…' : sub.name || 'N/A',
    fullName: sub.name || 'N/A',
    gradePoint: GRADE_POINTS[sub.grade] ?? 0,
    grade: sub.grade,
    credits: sub.credits,
  }));

  const totalCredits = chartData.reduce((s, d) => s + d.credits, 0);
  const avgGP = totalCredits > 0
    ? chartData.reduce((s, d) => s + d.gradePoint * d.credits, 0) / totalCredits
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            Semester {semester} — Performance Analysis
          </DialogTitle>
        </DialogHeader>

        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            No subject data available for analysis
          </p>
        ) : (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-accent/50 p-3 text-center">
                <p className="text-2xl font-display font-bold">{gpa !== null ? Number(gpa).toFixed(2) : '—'}</p>
                <p className="text-xs text-muted-foreground">GPA</p>
              </div>
              <div className="rounded-lg bg-accent/50 p-3 text-center">
                <p className="text-2xl font-display font-bold">{chartData.length}</p>
                <p className="text-xs text-muted-foreground">Subjects</p>
              </div>
              <div className="rounded-lg bg-accent/50 p-3 text-center">
                <p className="text-2xl font-display font-bold">{totalCredits}</p>
                <p className="text-xs text-muted-foreground">Total Credits</p>
              </div>
            </div>

            {/* Bar chart */}
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium mb-4">Subject-wise Grade Points</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    className="fill-muted-foreground"
                  />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-lg">
                          <p className="font-medium">{d.fullName}</p>
                          <p>Grade: {d.grade} ({d.gradePoint} pts)</p>
                          <p>Credits: {d.credits}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="gradePoint" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={getBarColor(entry.gradePoint)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Subject table */}
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-accent/50">
                    <th className="text-left px-3 py-2 font-medium">Subject</th>
                    <th className="text-center px-3 py-2 font-medium">Credits</th>
                    <th className="text-center px-3 py-2 font-medium">Grade</th>
                    <th className="text-center px-3 py-2 font-medium">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((d, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">{d.fullName}</td>
                      <td className="text-center px-3 py-2">{d.credits}</td>
                      <td className="text-center px-3 py-2 font-medium">{d.grade}</td>
                      <td className="text-center px-3 py-2">{d.gradePoint}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

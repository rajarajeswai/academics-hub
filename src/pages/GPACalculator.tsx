import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Calculator, Save } from 'lucide-react';
import { SubjectEntry, GRADE_OPTIONS, GRADE_POINTS, calculateGPA, getGradeColor } from '@/lib/gpa-calculator';

const GPACalculator = () => {
  const { user } = useAuth();
  const [semester, setSemester] = useState(1);
  const [subjects, setSubjects] = useState<SubjectEntry[]>([
    { name: '', credits: 3, grade: 'O' },
  ]);
  const [gpa, setGpa] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const addSubject = () => {
    setSubjects([...subjects, { name: '', credits: 3, grade: 'O' }]);
  };

  const removeSubject = (index: number) => {
    if (subjects.length <= 1) return;
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const updateSubject = (index: number, field: keyof SubjectEntry, value: any) => {
    const updated = [...subjects];
    updated[index] = { ...updated[index], [field]: value };
    setSubjects(updated);
  };

  const compute = () => {
    const result = calculateGPA(subjects);
    setGpa(result);
  };

  const saveResults = async () => {
    if (!user || gpa === null) return;
    setSaving(true);
    try {
      // Check if semester exists
      const { data: existing } = await supabase
        .from('marksheets')
        .select('id')
        .eq('user_id', user.id)
        .eq('semester', semester)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('marksheets')
          .update({
            extracted_data: subjects as unknown as any,
            gpa,
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('marksheets').insert({
          user_id: user.id,
          semester,
          extracted_data: subjects as unknown as any,
          gpa,
        } as any);
      }

      // Recalculate CGPA
      const { data: allMs } = await supabase
        .from('marksheets')
        .select('semester, gpa, extracted_data')
        .eq('user_id', user.id);

      if (allMs) {
        let totalWeighted = 0;
        let totalCreds = 0;
        for (const m of allMs) {
          if (m.gpa !== null && m.extracted_data) {
            const creds = (m.extracted_data as unknown as SubjectEntry[]).reduce((s: number, sub: SubjectEntry) => s + sub.credits, 0);
            totalWeighted += Number(m.gpa) * creds;
            totalCreds += creds;
          }
        }
        const newCgpa = totalCreds > 0 ? Math.round((totalWeighted / totalCreds) * 100) / 100 : 0;

        const { data: existingCgpa } = await supabase
          .from('cgpa_records')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingCgpa) {
          await supabase
            .from('cgpa_records')
            .update({ cgpa: newCgpa, total_credits: totalCreds })
            .eq('id', existingCgpa.id);
        } else {
          await supabase.from('cgpa_records').insert({
            user_id: user.id,
            cgpa: newCgpa,
            total_credits: totalCreds,
          });
        }
      }

      toast.success(`Semester ${semester} GPA saved!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">GPA Calculator</h1>
          <p className="text-muted-foreground mt-1">
            Anna University 10-point grading system
          </p>
        </div>

        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display">Enter Subjects</CardTitle>
            <CardDescription>Add your subjects with credits and grades</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Semester</label>
                <Select value={String(semester)} onValueChange={(v) => setSemester(Number(v))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 8 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        Semester {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Header */}
            <div className="hidden sm:grid grid-cols-12 gap-3 text-xs font-medium text-muted-foreground px-1">
              <div className="col-span-5">Subject Name</div>
              <div className="col-span-2">Credits</div>
              <div className="col-span-3">Grade</div>
              <div className="col-span-2">Points</div>
            </div>

            <AnimatePresence>
              {subjects.map((subject, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-12 gap-3 items-center"
                >
                  <div className="col-span-12 sm:col-span-5">
                    <Input
                      placeholder="Subject name"
                      value={subject.name}
                      onChange={(e) => updateSubject(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={subject.credits}
                      onChange={(e) => updateSubject(index, 'credits', Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-3">
                    <Select
                      value={subject.grade}
                      onValueChange={(v) => updateSubject(index, 'grade', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADE_OPTIONS.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g} ({GRADE_POINTS[g]})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3 sm:col-span-1 flex items-center justify-center">
                    <span className={`font-display font-bold ${getGradeColor(subject.grade)}`}>
                      {GRADE_POINTS[subject.grade]}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSubject(index)}
                      disabled={subjects.length <= 1}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <Button variant="outline" onClick={addSubject} className="w-full border-dashed">
              <Plus className="h-4 w-4 mr-2" /> Add Subject
            </Button>

            <div className="flex gap-3 pt-2">
              <Button onClick={compute} className="bg-gradient-primary flex-1">
                <Calculator className="h-4 w-4 mr-2" /> Calculate GPA
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        <AnimatePresence>
          {gpa !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="shadow-elevated border-0 bg-gradient-hero">
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-primary-foreground/60 font-medium uppercase tracking-wider">
                    Semester {semester} GPA
                  </p>
                  <p className="text-6xl font-display font-bold text-primary-foreground mt-2">
                    {gpa.toFixed(2)}
                  </p>
                  <p className="text-primary-foreground/50 text-sm mt-2">
                    {subjects.reduce((s, sub) => s + sub.credits, 0)} total credits
                  </p>
                  <Button
                    onClick={saveResults}
                    disabled={saving}
                    className="mt-6 bg-gradient-gold text-secondary-foreground hover:opacity-90"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save to Profile'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default GPACalculator;

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, BarChart3, Award } from 'lucide-react';
import { SemesterGPA, calculateCGPA, cgpaToPercentage } from '@/lib/gpa-calculator';

const CGPACalculator = () => {
  const { user } = useAuth();
  const [semesters, setSemesters] = useState<SemesterGPA[]>([
    { semester: 1, gpa: 0, totalCredits: 20 },
  ]);
  const [result, setResult] = useState<{ cgpa: number; totalCredits: number } | null>(null);
  const [savedData, setSavedData] = useState<SemesterGPA[]>([]);
  const [savedCGPA, setSavedCGPA] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: ms } = await supabase
        .from('marksheets')
        .select('semester, gpa, extracted_data')
        .eq('user_id', user.id)
        .order('semester');

      if (ms) {
        const semData: SemesterGPA[] = ms
          .filter(m => m.gpa !== null)
          .map(m => ({
            semester: m.semester,
            gpa: Number(m.gpa),
            totalCredits: m.extracted_data
              ? (m.extracted_data as any[]).reduce((s: number, sub: any) => s + (sub.credits || 0), 0)
              : 20,
          }));
        setSavedData(semData);
        if (semData.length > 0) {
          const res = calculateCGPA(semData);
          setSavedCGPA(res.cgpa);
        }
      }
    };
    load();
  }, [user]);

  const addSemester = () => {
    setSemesters([...semesters, { semester: semesters.length + 1, gpa: 0, totalCredits: 20 }]);
  };

  const removeSemester = (index: number) => {
    if (semesters.length <= 1) return;
    setSemesters(semesters.filter((_, i) => i !== index));
  };

  const updateSemester = (index: number, field: keyof SemesterGPA, value: number) => {
    const updated = [...semesters];
    updated[index] = { ...updated[index], [field]: value };
    setSemesters(updated);
  };

  const compute = () => {
    setResult(calculateCGPA(semesters));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">CGPA Calculator</h1>
          <p className="text-muted-foreground mt-1">Calculate your cumulative GPA across semesters</p>
        </div>

        <Tabs defaultValue="manual" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="auto">From Saved Data</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="font-display">Enter Semester GPAs</CardTitle>
                <CardDescription>Input GPA and total credits for each semester</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="hidden sm:grid grid-cols-12 gap-3 text-xs font-medium text-muted-foreground px-1">
                  <div className="col-span-3">Semester</div>
                  <div className="col-span-4">GPA</div>
                  <div className="col-span-4">Total Credits</div>
                  <div className="col-span-1"></div>
                </div>

                <AnimatePresence>
                  {semesters.map((sem, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-12 gap-3 items-center"
                    >
                      <div className="col-span-3">
                        <div className="bg-accent rounded-lg px-3 py-2 text-sm font-medium text-center">
                          Sem {sem.semester}
                        </div>
                      </div>
                      <div className="col-span-4">
                        <Input
                          type="number"
                          min={0}
                          max={10}
                          step={0.01}
                          value={sem.gpa}
                          onChange={(e) => updateSemester(index, 'gpa', Number(e.target.value))}
                        />
                      </div>
                      <div className="col-span-4">
                        <Input
                          type="number"
                          min={1}
                          value={sem.totalCredits}
                          onChange={(e) => updateSemester(index, 'totalCredits', Number(e.target.value))}
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSemester(index)}
                          disabled={semesters.length <= 1}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <Button variant="outline" onClick={addSemester} className="w-full border-dashed">
                  <Plus className="h-4 w-4 mr-2" /> Add Semester
                </Button>

                <Button onClick={compute} className="w-full bg-gradient-primary">
                  <BarChart3 className="h-4 w-4 mr-2" /> Calculate CGPA
                </Button>
              </CardContent>
            </Card>

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <CGPAResult cgpa={result.cgpa} totalCredits={result.totalCredits} />
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="auto" className="space-y-4">
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="font-display">Saved Semester Data</CardTitle>
                <CardDescription>Auto-calculated from your saved marksheets</CardDescription>
              </CardHeader>
              <CardContent>
                {savedData.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">No saved semester data</p>
                    <p className="text-sm text-muted-foreground/60 mt-1">
                      Use the GPA Calculator to save semester results first
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedData.map((sem) => (
                      <div
                        key={sem.semester}
                        className="flex items-center justify-between p-4 rounded-lg bg-accent/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-gradient-primary text-primary-foreground font-display font-bold text-sm w-10 h-10 rounded-lg flex items-center justify-center">
                            S{sem.semester}
                          </div>
                          <span className="text-sm font-medium">Semester {sem.semester}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-display font-bold">{sem.gpa.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{sem.totalCredits} credits</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {savedCGPA !== null && <CGPAResult cgpa={savedCGPA} totalCredits={savedData.reduce((s, d) => s + d.totalCredits, 0)} />}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

function CGPAResult({ cgpa, totalCredits }: { cgpa: number; totalCredits: number }) {
  return (
    <Card className="shadow-elevated border-0 bg-gradient-hero">
      <CardContent className="p-8 text-center">
        <p className="text-sm text-primary-foreground/60 font-medium uppercase tracking-wider">
          Cumulative GPA
        </p>
        <p className="text-6xl font-display font-bold text-primary-foreground mt-2">
          {cgpa.toFixed(2)}
        </p>
        <div className="flex items-center justify-center gap-6 mt-4 text-primary-foreground/50 text-sm">
          <span>{totalCredits} total credits</span>
          <span>•</span>
          <span>{cgpaToPercentage(cgpa)}% equivalent</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default CGPACalculator;

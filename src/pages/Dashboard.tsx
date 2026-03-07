import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { TrendingUp, BookOpen, Award, Percent, Eye, Trash2, Copy, BarChart3, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cgpaToPercentage } from '@/lib/gpa-calculator';
import { generateSemesterReport, downloadReport } from '@/lib/report-generator';
import { SemesterAnalysisDialog } from '@/components/SemesterAnalysisDialog';

interface MarksheetRow {
  id: string;
  semester: number;
  gpa: number | null;
  created_at: string;
  extracted_data: any;
  image_url: string | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [marksheets, setMarksheets] = useState<MarksheetRow[]>([]);
  const [cgpa, setCgpa] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMarksheet, setSelectedMarksheet] = useState<MarksheetRow | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [analysisMarksheet, setAnalysisMarksheet] = useState<MarksheetRow | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: ms } = await supabase
        .from('marksheets')
        .select('*')
        .eq('user_id', user.id)
        .order('semester', { ascending: true });
      setMarksheets((ms as MarksheetRow[]) || []);

      const { data: cr } = await supabase
        .from('cgpa_records')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cr) setCgpa(Number(cr.cgpa));
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleSelectSemester = async (m: MarksheetRow) => {
    setSelectedMarksheet(m);
    setImageUrl(null);
    if (m.image_url) {
      const { data } = await supabase.storage
        .from('marksheets')
        .createSignedUrl(m.image_url, 300);
      if (data?.signedUrl) setImageUrl(data.signedUrl);
    }
  };

  const handleDeleteSemester = async (m: MarksheetRow, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    // Delete storage file
    if (m.image_url) {
      await supabase.storage.from('marksheets').remove([m.image_url]);
    }
    // Delete DB record
    await supabase.from('marksheets').delete().eq('id', m.id);
    // Recalculate CGPA
    const remaining = marksheets.filter(ms => ms.id !== m.id);
    setMarksheets(remaining);
    let totalW = 0, totalC = 0;
    for (const ms of remaining) {
      if (ms.gpa !== null && ms.extracted_data) {
        const c = (ms.extracted_data as any[]).reduce((s: number, sub: any) => s + (sub.credits || 0), 0);
        totalW += Number(ms.gpa) * c;
        totalC += c;
      }
    }
    const newCgpa = totalC > 0 ? Math.round((totalW / totalC) * 100) / 100 : 0;
    setCgpa(totalC > 0 ? newCgpa : null);
    const { data: ec } = await supabase.from('cgpa_records').select('id').eq('user_id', user.id).maybeSingle();
    if (ec) {
      await supabase.from('cgpa_records').update({ cgpa: newCgpa, total_credits: totalC }).eq('id', ec.id);
    }
    toast.success(`Semester ${m.semester} deleted`);
  };

  const latestGPA = marksheets.length > 0 ? marksheets[marksheets.length - 1].gpa : null;
  const totalSemesters = marksheets.filter(m => m.gpa !== null).length;

  const stats = [
    {
      label: 'Current CGPA',
      value: cgpa !== null ? cgpa.toFixed(2) : '—',
      icon: Award,
      color: 'bg-gradient-gold',
    },
    {
      label: 'Latest GPA',
      value: latestGPA !== null ? Number(latestGPA).toFixed(2) : '—',
      icon: TrendingUp,
      color: 'bg-gradient-primary',
    },
    {
      label: 'Semesters',
      value: totalSemesters.toString(),
      icon: BookOpen,
      color: 'bg-gradient-primary',
    },
    {
      label: 'Percentage',
      value: cgpa !== null ? `${cgpaToPercentage(cgpa)}%` : '—',
      icon: Percent,
      color: 'bg-gradient-gold',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your academic performance at a glance</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="shadow-card hover:shadow-elevated transition-shadow border-0">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`${stat.color} p-2 rounded-lg`}>
                      <stat.icon className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                  <p className="text-2xl font-display font-bold">{loading ? '...' : stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Semester history */}
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display text-lg">Semester History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : marksheets.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No marksheets uploaded yet</p>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  Upload a marksheet or use the GPA calculator to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {marksheets.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => handleSelectSemester(m)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-primary text-primary-foreground font-display font-bold text-sm w-10 h-10 rounded-lg flex items-center justify-center">
                        S{m.semester}
                      </div>
                      <div>
                        <p className="font-medium text-sm">Semester {m.semester}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(m.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="font-display font-bold text-lg">
                          {m.gpa !== null ? Number(m.gpa).toFixed(2) : '—'}
                        </p>
                        <p className="text-xs text-muted-foreground">GPA</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleSelectSemester(m); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => handleDeleteSemester(m, e)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Marksheet Detail Dialog */}
        <Dialog open={!!selectedMarksheet} onOpenChange={(open) => { if (!open) { setSelectedMarksheet(null); setImageUrl(null); } }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">
                Semester {selectedMarksheet?.semester} Marksheet
              </DialogTitle>
            </DialogHeader>
            {imageUrl ? (
              <div className="space-y-3">
                <img src={imageUrl} alt={`Semester ${selectedMarksheet?.semester} marksheet`} className="w-full rounded-lg border" />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={async () => {
                    try {
                      const response = await fetch(imageUrl);
                      const blob = await response.blob();
                      await navigator.clipboard.write([
                        new ClipboardItem({ [blob.type]: blob }),
                      ]);
                      toast.success('Image copied to clipboard');
                    } catch {
                      toast.error('Failed to copy image');
                    }
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Image
                </Button>
              </div>
            ) : selectedMarksheet?.image_url ? (
              <p className="text-muted-foreground text-sm text-center py-8">Loading image...</p>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">No marksheet image uploaded for this semester</p>
            )}
            {selectedMarksheet?.gpa !== null && selectedMarksheet?.gpa !== undefined && (
              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50">
                <span className="text-sm font-medium">GPA</span>
                <span className="font-display font-bold text-lg">{Number(selectedMarksheet.gpa).toFixed(2)}</span>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

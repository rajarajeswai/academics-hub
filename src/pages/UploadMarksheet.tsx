import { useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileImage, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { SubjectEntry, calculateGPA, getGradeColor, GRADE_POINTS } from '@/lib/gpa-calculator';

type UploadState = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

const UploadMarksheet = () => {
  const { user } = useAuth();
  const [semester, setSemester] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, setState] = useState<UploadState>('idle');
  const [extractedData, setExtractedData] = useState<SubjectEntry[] | null>(null);
  const [gpa, setGpa] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setExtractedData(null);
    setGpa(null);
    setState('idle');
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setExtractedData(null);
    setGpa(null);
    setState('idle');
  }, []);

  const handleUpload = async () => {
    if (!file || !user) return;

    try {
      setState('uploading');
      const filePath = `${user.id}/${semester}/marksheet.${file.name.split('.').pop()}`;

      const { error: uploadError } = await supabase.storage
        .from('marksheets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      setState('processing');

      // Convert file to base64 for OCR
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];

        try {
          const { data, error } = await supabase.functions.invoke('ocr-marksheet', {
            body: { image_base64: base64, semester },
          });

          if (error) throw error;

          const subjects: SubjectEntry[] = data.subjects || [];
          const calculatedGpa = calculateGPA(subjects);

          setExtractedData(subjects);
          setGpa(calculatedGpa);

          // Save to database
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
                image_url: filePath,
                extracted_data: subjects as unknown as any,
                gpa: calculatedGpa,
              })
              .eq('id', existing.id);
          } else {
            await supabase.from('marksheets').insert({
              user_id: user.id,
              semester,
              image_url: filePath,
              extracted_data: subjects as unknown as any,
              gpa: calculatedGpa,
            } as any);
          }

          // Update CGPA
          const { data: allMs } = await supabase
            .from('marksheets')
            .select('gpa, extracted_data')
            .eq('user_id', user.id);

          if (allMs) {
            let totalW = 0, totalC = 0;
            for (const m of allMs) {
              if (m.gpa !== null && m.extracted_data) {
                const c = (m.extracted_data as any[]).reduce((s: number, sub: any) => s + (sub.credits || 0), 0);
                totalW += Number(m.gpa) * c;
                totalC += c;
              }
            }
            const newCgpa = totalC > 0 ? Math.round((totalW / totalC) * 100) / 100 : 0;

            const { data: ec } = await supabase
              .from('cgpa_records')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle();

            if (ec) {
              await supabase.from('cgpa_records').update({ cgpa: newCgpa, total_credits: totalC }).eq('id', ec.id);
            } else {
              await supabase.from('cgpa_records').insert({ user_id: user.id, cgpa: newCgpa, total_credits: totalC });
            }
          }

          setState('done');
          toast.success('Marksheet processed successfully!');
        } catch (ocrError: any) {
          console.error('OCR Error:', ocrError);
          setState('error');
          toast.error('Failed to process marksheet. You can manually enter grades in the GPA Calculator.');
        }
      };
    } catch (error: any) {
      setState('error');
      toast.error(error.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Upload Marksheet</h1>
          <p className="text-muted-foreground mt-1">
            Upload your semester marksheet for automatic grade extraction
          </p>
        </div>

        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display">Marksheet Image</CardTitle>
            <CardDescription>Upload a clear image of your marksheet</CardDescription>
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

            {/* Drop zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="relative border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {preview ? (
                <div className="space-y-4">
                  <img
                    src={preview}
                    alt="Marksheet preview"
                    className="max-h-64 mx-auto rounded-lg shadow-card"
                  />
                  <p className="text-sm text-muted-foreground">{file?.name}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-accent p-4 rounded-full w-fit mx-auto">
                    <FileImage className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Drop your marksheet here</p>
                    <p className="text-sm text-muted-foreground">or click to browse</p>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleUpload}
              disabled={!file || state === 'uploading' || state === 'processing'}
              className="w-full bg-gradient-primary"
            >
              {state === 'uploading' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {state === 'processing' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {state === 'idle' && <Upload className="h-4 w-4 mr-2" />}
              {state === 'done' && <CheckCircle2 className="h-4 w-4 mr-2" />}
              {state === 'error' && <AlertCircle className="h-4 w-4 mr-2" />}
              {state === 'uploading'
                ? 'Uploading...'
                : state === 'processing'
                ? 'Extracting grades...'
                : state === 'done'
                ? 'Upload Another'
                : 'Upload & Process'}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <AnimatePresence>
          {extractedData && gpa !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className="shadow-elevated border-0 bg-gradient-hero">
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-primary-foreground/60 font-medium uppercase tracking-wider">
                    Semester {semester} GPA
                  </p>
                  <p className="text-6xl font-display font-bold text-primary-foreground mt-2">
                    {gpa.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Extracted Subjects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {extractedData.map((sub, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg bg-accent/50"
                      >
                        <span className="text-sm font-medium">{sub.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground">{sub.credits} cr</span>
                          <span className={`font-display font-bold ${getGradeColor(sub.grade)}`}>
                            {sub.grade} ({GRADE_POINTS[sub.grade]})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default UploadMarksheet;

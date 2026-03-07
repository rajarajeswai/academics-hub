interface SubjectData {
  name: string;
  credits: number;
  grade: string;
  grade_point?: number;
}

interface SemesterData {
  semester: number;
  gpa: number | null;
  created_at: string;
  extracted_data: SubjectData[] | null;
}

export function generateSemesterReport(semesters: SemesterData[], cgpa: number | null): string {
  const lines: string[] = [];
  lines.push('ACADEMIC PERFORMANCE REPORT');
  lines.push('='.repeat(50));
  lines.push(`Generated: ${new Date().toLocaleDateString()}`);
  lines.push('');

  for (const sem of semesters) {
    lines.push(`SEMESTER ${sem.semester}`);
    lines.push('-'.repeat(40));
    lines.push(`Date: ${new Date(sem.created_at).toLocaleDateString()}`);
    lines.push(`GPA: ${sem.gpa !== null ? Number(sem.gpa).toFixed(2) : 'N/A'}`);

    const subjects = sem.extracted_data as SubjectData[] | null;
    if (subjects && subjects.length > 0) {
      lines.push('');
      lines.push('Subject'.padEnd(30) + 'Credits'.padEnd(10) + 'Grade');
      lines.push('-'.repeat(50));
      for (const sub of subjects) {
        lines.push(
          (sub.name || 'Unknown').padEnd(30) +
          String(sub.credits || 0).padEnd(10) +
          (sub.grade || 'N/A')
        );
      }
    }
    lines.push('');
  }

  if (cgpa !== null) {
    lines.push('='.repeat(50));
    lines.push(`CUMULATIVE GPA (CGPA): ${cgpa.toFixed(2)}`);
    lines.push(`PERCENTAGE: ${(cgpa * 10).toFixed(2)}%`);
  }

  return lines.join('\n');
}

export function downloadReport(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

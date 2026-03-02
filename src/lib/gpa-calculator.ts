// Anna University 10-point grading system
export const GRADE_POINTS: Record<string, number> = {
  'O': 10,
  'A+': 9,
  'A': 8,
  'B+': 7,
  'B': 6,
  'C': 5,
  'U': 0,
};

export const GRADE_OPTIONS = Object.keys(GRADE_POINTS);

export interface SubjectEntry {
  name: string;
  credits: number;
  grade: string;
}

export function calculateGPA(subjects: SubjectEntry[]): number {
  if (subjects.length === 0) return 0;
  
  let totalWeighted = 0;
  let totalCredits = 0;

  for (const subject of subjects) {
    const gradePoint = GRADE_POINTS[subject.grade] ?? 0;
    totalWeighted += subject.credits * gradePoint;
    totalCredits += subject.credits;
  }

  if (totalCredits === 0) return 0;
  return Math.round((totalWeighted / totalCredits) * 100) / 100;
}

export interface SemesterGPA {
  semester: number;
  gpa: number;
  totalCredits: number;
}

export function calculateCGPA(semesters: SemesterGPA[]): { cgpa: number; totalCredits: number } {
  if (semesters.length === 0) return { cgpa: 0, totalCredits: 0 };

  let weightedSum = 0;
  let totalCredits = 0;

  for (const sem of semesters) {
    weightedSum += sem.gpa * sem.totalCredits;
    totalCredits += sem.totalCredits;
  }

  if (totalCredits === 0) return { cgpa: 0, totalCredits: 0 };
  return {
    cgpa: Math.round((weightedSum / totalCredits) * 100) / 100,
    totalCredits,
  };
}

export function cgpaToPercentage(cgpa: number): number {
  return Math.round(cgpa * 10 * 100) / 100;
}

export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'O': return 'text-success';
    case 'A+': return 'text-success';
    case 'A': return 'text-primary';
    case 'B+': return 'text-secondary';
    case 'B': return 'text-warning';
    case 'C': return 'text-warning';
    case 'U': return 'text-destructive';
    default: return 'text-muted-foreground';
  }
}

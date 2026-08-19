import type {
  GradingScale,
  GradeRule,
  SubjectResult,
  ResultStatus,
} from "@/types/exams";

export const DEFAULT_GRADE_RULES: GradeRule[] = [
  { grade: "A+", minPercentage: 90, maxPercentage: 100, gradePoint: 10, description: "Outstanding" },
  { grade: "A", minPercentage: 80, maxPercentage: 89.99, gradePoint: 9, description: "Excellent" },
  { grade: "B+", minPercentage: 70, maxPercentage: 79.99, gradePoint: 8, description: "Very Good" },
  { grade: "B", minPercentage: 60, maxPercentage: 69.99, gradePoint: 7, description: "Good" },
  { grade: "C", minPercentage: 50, maxPercentage: 59.99, gradePoint: 6, description: "Average" },
  { grade: "D", minPercentage: 40, maxPercentage: 49.99, gradePoint: 5, description: "Below Average" },
  { grade: "E", minPercentage: 33, maxPercentage: 39.99, gradePoint: 4, description: "Marginal" },
  { grade: "F", minPercentage: 0, maxPercentage: 32.99, gradePoint: 0, description: "Fail" },
];

export const getGradeForPercentage = (
  percentage: number,
  customScale?: GradingScale | null
): { grade: string; gradePoint: number; description?: string } => {
  const rules = customScale?.grades?.length ? customScale.grades : DEFAULT_GRADE_RULES;
  // Sort descending by minPercentage
  const sorted = [...rules].sort((a, b) => b.minPercentage - a.minPercentage);

  for (const rule of sorted) {
    if (percentage >= rule.minPercentage) {
      return {
        grade: rule.grade,
        gradePoint: rule.gradePoint,
        description: rule.description,
      };
    }
  }

  const fallback = sorted[sorted.length - 1];
  return {
    grade: fallback?.grade || "F",
    gradePoint: fallback?.gradePoint || 0,
    description: fallback?.description || "Fail",
  };
};

export const calculateSubjectResult = (
  subjectId: string,
  subjectName: string,
  maximumMarks: number,
  marksObtained: number | null,
  passingMarks: number,
  absent: boolean,
  customScale?: GradingScale | null,
  remarks?: string
): SubjectResult => {
  if (absent) {
    return {
      subjectId,
      subjectName,
      maximumMarks,
      marksObtained: null,
      absent: true,
      percentage: 0,
      grade: "AB",
      gradePoint: 0,
      passed: false,
      remarks: remarks || "Absent",
    };
  }

  const obtained = marksObtained !== null && marksObtained !== undefined ? Number(marksObtained) : 0;
  const percentage = maximumMarks > 0 ? Math.round((obtained / maximumMarks) * 10000) / 100 : 0;
  const { grade, gradePoint } = getGradeForPercentage(percentage, customScale);

  const passed = passingMarks > 0 ? obtained >= passingMarks : percentage >= 33;

  return {
    subjectId,
    subjectName,
    maximumMarks,
    marksObtained: obtained,
    absent: false,
    percentage,
    grade,
    gradePoint,
    passed,
    remarks,
  };
};

export interface OverallCalculationOutput {
  totalMaximum: number;
  totalObtained: number;
  percentage: number;
  grade: string;
  gradePoint: number;
  resultStatus: ResultStatus;
}

export const calculateOverallResult = (
  subjectResults: SubjectResult[],
  passingPercentage = 33,
  requireAllSubjectsPass = true,
  customScale?: GradingScale | null
): OverallCalculationOutput => {
  if (subjectResults.length === 0) {
    return {
      totalMaximum: 0,
      totalObtained: 0,
      percentage: 0,
      grade: "N/A",
      gradePoint: 0,
      resultStatus: "Incomplete",
    };
  }

  const allAbsent = subjectResults.every((s) => s.absent);
  if (allAbsent) {
    const totalMax = subjectResults.reduce((sum, s) => sum + s.maximumMarks, 0);
    return {
      totalMaximum: totalMax,
      totalObtained: 0,
      percentage: 0,
      grade: "AB",
      gradePoint: 0,
      resultStatus: "Absent",
    };
  }

  const hasIncomplete = subjectResults.some((s) => !s.absent && (s.marksObtained === null || s.marksObtained === undefined));
  const totalMaximum = subjectResults.reduce((sum, s) => sum + s.maximumMarks, 0);
  const totalObtained = subjectResults.reduce((sum, s) => sum + (s.absent ? 0 : s.marksObtained || 0), 0);

  const percentage = totalMaximum > 0 ? Math.round((totalObtained / totalMaximum) * 10000) / 100 : 0;
  const { grade, gradePoint } = getGradeForPercentage(percentage, customScale);

  let resultStatus: ResultStatus = "Pass";

  if (hasIncomplete) {
    resultStatus = "Incomplete";
  } else {
    const anyFailed = subjectResults.some((s) => !s.passed);
    if (requireAllSubjectsPass && anyFailed) {
      resultStatus = "Fail";
    } else if (percentage < passingPercentage) {
      resultStatus = "Fail";
    } else {
      resultStatus = "Pass";
    }
  }

  return {
    totalMaximum,
    totalObtained,
    percentage,
    grade,
    gradePoint,
    resultStatus,
  };
};

/**
 * Standard Competition Ranking (1224 method)
 */
export const applyRankings = <T extends { totalObtained: number; percentage: number; resultStatus: ResultStatus }>(
  items: T[]
): (T & { rank: number })[] => {
  // Sort by totalObtained desc, then percentage desc
  const sorted = [...items].sort((a, b) => {
    if (b.totalObtained !== a.totalObtained) {
      return b.totalObtained - a.totalObtained;
    }
    return b.percentage - a.percentage;
  });

  let currentRank = 1;
  return sorted.map((item, index) => {
    if (index > 0) {
      const prev = sorted[index - 1];
      if (item.totalObtained === prev.totalObtained && item.percentage === prev.percentage) {
        // Tied rank
        return { ...item, rank: currentRank };
      }
    }
    currentRank = index + 1;
    return { ...item, rank: currentRank };
  });
};

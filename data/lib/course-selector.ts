import rawCourses from "../generated/courses.json";
import { courseGradeOverrides } from "./course-grade-overrides";

export type Semester =
  | "前期"
  | "後期"
  | "前期 第一ターム"
  | "前期 第二ターム"
  | "後期 第三ターム"
  | "後期 第四ターム";

function normalizeSemester(
  semester: string,
): "前期" | "後期" | undefined {
  if (semester.startsWith("前期")) return "前期";
  if (semester.startsWith("後期")) return "後期";
  return undefined;
}

export function getSelectableCourses(
  grade: number,
  semester: Semester,
) {
  const selectedSemester = normalizeSemester(semester);

  return rawCourses.filter((course) => {
    const override = courseGradeOverrides[course.id];

    if (override) {
      return (
        override.grades.includes(grade) &&
        selectedSemester !== undefined &&
        override.semesters.includes(selectedSemester)
      );
    }

    return (
      course.grade === grade &&
      normalizeSemester(course.semester) === selectedSemester
    );
  });
}

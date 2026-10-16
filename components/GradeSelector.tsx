"use client";
const TUTORIAL_KEY = "timetable-tutorial-completed";
import { gradeThemes, type Grade } from "../data/lib/grade-theme";
import styles from "./GradeSelector.module.css";
import type { Semester } from "../data/lib/course-selector";

type Props = {
  value: Grade;
  onChange: (grade: Grade) => void;
  semester: Semester;
  onSemesterChange: (semester: Semester) => void;
};

export default function GradeSelector({
  value,
  onChange,
  semester,
  onSemesterChange,
}: Props) {
  return (
    <div className={styles.controls} aria-label="学年・学期選択">
      <div className={styles.selector} aria-label="学年選択">
        {([1, 2, 3, 4] as const).map((grade) => {
          const theme = gradeThemes[grade];
          const selected = value === grade;

          return (
            <button
              data-tour="grade-selector"
              key={grade}
              type="button"
              className={`${styles.option} ${
                selected ? styles.selected : ""
              }`}
              style={{
                "--grade-color": theme.color,
                "--grade-background": theme.background,
                "--grade-border": theme.border,
              } as React.CSSProperties}
              aria-pressed={selected}
              onClick={() => onChange(grade)}
            >
              <span className={styles.number}>{grade}</span>
              <span>年</span>
            </button>
          );
        })}
      </div>

      <div className={styles.semesterSelector} aria-label="学期選択">
        {(["前期", "後期"] as const).map((item) => (
          <button
            data-tour="semester-selector"
            key={item}
            type="button"
            className={`${styles.semesterOption} ${
              semester === item ? styles.semesterSelected : ""
            }`}
            aria-pressed={semester === item}
            onClick={() => onSemesterChange(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}


"use client";

import { gradeThemes, type Grade } from "../data/lib/grade-theme";
import styles from "./GradeSelector.module.css";

type Props = {
  value: Grade;
  onChange: (grade: Grade) => void;
};

export default function GradeSelector({ value, onChange }: Props) {
  return (
    <div className={styles.selector} aria-label="学年選択">
      {([1, 2, 3, 4] as const).map((grade) => {
        const theme = gradeThemes[grade];
        const selected = value === grade;

        return (
          <button
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
  );
}

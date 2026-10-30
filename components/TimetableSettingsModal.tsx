
"use client";

import { useEffect, useState } from "react";

const GRADES = ["1", "2", "3", "4"];
const SEMESTERS = ["前期", "後期"];
const COURSES = [
  "SEコース",
  "IoTコース",
  "DSコース",
  "CSコース",
  "CGコース",
  "DEコース",
];

type SettingsStyles = Record<string, string>;

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (settings: {
    grade: string;
    semester: string;
    course: string;
  }) => void;
  styles: SettingsStyles;
  initialGrade: string;
  initialSemester: string;
  initialCourse: string;
  submitLabel?: string;
  cancelLabel?: string;
};

export default function TimetableSettingsModal({
  open,
  onClose,
  onSave,
  styles,
  initialGrade,
  initialSemester,
  initialCourse,
  submitLabel = "変更を保存",
}: Props) {
  const [grade, setGrade] = useState(initialGrade);
  const [semester, setSemester] = useState(initialSemester);
  const [course, setCourse] = useState(initialCourse);

  useEffect(() => {
    if (open) {
      setGrade(initialGrade);
      setSemester(initialSemester);
      setCourse(initialCourse);
    }
  }, [open, initialGrade, initialSemester, initialCourse]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={styles.modalOverlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onTouchStart={(event) => {
        if (event.target === event.currentTarget) {
          // 背景へのタッチを記録するだけ。閉じる処理はクリックに任せる。
        }
      }}
    >
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.eyebrow}>YOUR SETTINGS</p>
            <h2 id="settings-title">時間割の設定</h2>
          </div>

          <button
            type="button"
            className={styles.modalClose}
            aria-label="閉じる"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <p className={styles.modalDescription}>
          時間割を作成するために、学習情報を入力してください。
        </p>

        <div className={styles.field}>
          <label>学年</label>
          <div className={styles.gradeGrid}>
            {GRADES.map((value) => (
              <button
                key={value}
                type="button"
                className={`${styles.gradeButton} ${
                  grade === value ? styles.active : ""
                }`}
                aria-pressed={grade === value}
                onClick={() => setGrade(value)}
              >
                <strong>{value}</strong>
                <span>年生</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label>学期</label>
          <div className={styles.segmented}>
            {SEMESTERS.map((value) => (
              <button
                key={value}
                type="button"
                className={semester === value ? styles.active : ""}
                aria-pressed={semester === value}
                onClick={() => setSemester(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          {/*<label htmlFor="course-select">コース</label>
          <select
            id="course-select"
            value={course}
            onChange={(event) => setCourse(event.target.value)}
          >
            {COURSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
            </select>*/}
        </div>

        <div className={styles.settingsActions}>


          <button
            type="button"
            className={styles.modalSubmit}
            onClick={() => onSave({ grade, semester, course })}
          >
            {submitLabel}
            <span aria-hidden="true">→</span>
          </button>
        </div>

        <p className={styles.modalNote}>
          入力内容はこのブラウザに保存されます。
        </p>
      </section>
    </div>
  );
}

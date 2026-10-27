"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./home.module.css";

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

const FEATURES = [
  {
    icon: "▦",
    title: "時間割作成",
    description: "授業を配置して、自分だけの時間割をつくる。",
    tag: "SCHEDULE",
  },
  {
    icon: "✦",
    title: "履修口コミ",
    description: "授業の口コミを参考に、履修する科目を考える。",
    tag: "REVIEWS",
  },
  {
    icon: "◎",
    title: "単位計算",
    description: "取得単位や卒業要件を確認する。",
    tag: "CREDITS",
  },
  {
    icon: "◇",
    title: "実績解除",
    description: "時間割作成などに挑戦して、実績を集める。",
    tag: "ACHIEVEMENTS",
  },
];

export default function HomePage() {
  const router = useRouter();

  const [grade, setGrade] = useState("1");
  const [semester, setSemester] = useState("前期");
  const [course, setCourse] = useState("SEコース");
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    try {
      const savedGrade = localStorage.getItem("selectedGrade");
      const savedSemester = localStorage.getItem("selectedSemester");
      const savedCourse = localStorage.getItem("selectedCourse");

      if (savedGrade && GRADES.includes(savedGrade)) {
        setGrade(savedGrade);
      }

      if (savedSemester && SEMESTERS.includes(savedSemester)) {
        setSemester(savedSemester);
      }

      if (savedCourse && COURSES.includes(savedCourse)) {
        setCourse(savedCourse);
      }
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!modalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalOpen]);

  function openTimetable() {
    localStorage.setItem("selectedGrade", grade);
    localStorage.setItem("selectedSemester", semester);
    localStorage.setItem("selectedCourse", course);

    setModalOpen(false);
    router.push("/timetable");
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <span className={styles.logo}>履</span>
          <span>履修ナビ</span>
        </Link>

        <span className={styles.headerLabel}>
          YOUR CAMPUS, YOUR SCHEDULE
        </span>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>CAMPUS TOOLKIT</p>
        <h1>
          キャンパス生活を、
          <br />
          もっと便利に。
        </h1>
        <p className={styles.description}>
          履修計画に必要なツールを、ここから。
        </p>
      </section>

      <section className={styles.features}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>EXPLORE FEATURES</p>
            <h2>機能一覧</h2>
          </div>
          <span className={styles.featureCount}>04 TOOLS</span>
        </div>

        <div className={styles.featureGrid}>
          {FEATURES.map((feature, index) => (
            <article
              key={feature.tag}
              className={styles.featureCard}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className={styles.featureTop}>
                <span className={styles.featureIcon}>
                  {feature.icon}
                </span>
                <span className={styles.featureTag}>
                  {feature.tag}
                </span>
              </div>

              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.startSection}>
        <div className={styles.startText}>
          <p className={styles.eyebrow}>LET'S GET STARTED</p>
          <h2>時間割をつくろう。</h2>
          <p>
            学年・学期・コースを設定して、
            自分の時間割を編集しよう。
          </p>
        </div>

        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => setModalOpen(true)}
        >
          時間割を編集する
          <span aria-hidden="true">→</span>
        </button>
      </section>

      <section className={styles.tutorial}>
        <div className={styles.tutorialText}>
          <p className={styles.eyebrow}>GETTING STARTED</p>
          <h2>使い方がわからない？</h2>
          <p>チュートリアルで操作方法を確認できます。</p>
        </div>

        <Link href="/tutorial" className={styles.tutorialButton}>
          使い方を見る
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      <footer className={styles.footer}>
        <span>履修ナビ</span>
        <span>YOUR CAMPUS, YOUR SCHEDULE</span>
      </footer>

      {modalOpen && (
        <div
          className={styles.modalOverlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setModalOpen(false);
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
                onClick={() => setModalOpen(false)}
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
              <label htmlFor="course-select">コース</label>
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
              </select>
            </div>

            <button
              type="button"
              className={styles.modalSubmit}
              disabled={!loaded}
              onClick={openTimetable}
            >
              時間割を開く
              <span aria-hidden="true">→</span>
            </button>

            <p className={styles.modalNote}>
              入力内容はこのブラウザに保存されます。
            </p>
          </section>
        </div>
      )}
    </main>
  );
}

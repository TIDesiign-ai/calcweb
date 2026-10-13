from pathlib import Path

base = Path("/mnt/data")
out = base / "履修ナビ_Next.js実装.md"

content = r'''# 履修ナビ — Next.js 実装

提示されたHTMLを Next.js App Router + TypeScript に分割した実装です。

## 1. ファイル構成

既存の Next.js プロジェクトのルートに、次のファイルを配置します。

```text
app/
├── components/
│   └── TimetableApp.tsx
├── courses/
│   └── [courseCode]/
│       └── page.tsx
├── globals.css
├── layout.tsx
└── page.tsx
data/
└── reviews.ts
```

> `app/layout.tsx` と `app/globals.css` が既に存在する場合は、既存の設定を確認して統合してください。以下のCSSは Tailwind CSS v4 を利用するプロジェクトを想定しています。Tailwindを使っていない場合は、`@import "tailwindcss";` を削除して構いません。

---

## 2. `data/reviews.ts`

```ts
export type Review = {
  author: string;
  comment: string;
  rating?: number;
};

export type Course = {
  code: string;
  name: string;
  rating: number;
  reviews: Review[];
  color: string;
  textColor: string;
};

export const courses: Course[] = [
  {
    code: "programming-advanced-b",
    name: "プログラミング応用B",
    rating: 4.2,
    color: "#e4e9ff",
    textColor: "#34477d",
    reviews: [
      { author: "3年生", comment: "課題は多めですが、説明は分かりやすいです。" },
      { author: "2年生", comment: "実際にコードを書く機会が多いです。" },
    ],
  },
  {
    code: "linux-practice-a",
    name: "Linux演習A",
    rating: 4.5,
    color: "#d9f4e9",
    textColor: "#21654c",
    reviews: [
      { author: "先輩", comment: "Linuxを実際に触るので、環境構築に慣れておくと楽です。" },
    ],
  },
  {
    code: "digital-marketing-practice",
    name: "デジタルマーケティング演習",
    rating: 4.3,
    color: "#ffe4ed",
    textColor: "#8b3454",
    reviews: [
      {
        author: "3年生（テストデータ）",
        comment: "実際の事例を扱いながら学べるので、マーケティングに興味がある人には面白い授業です。",
      },
      {
        author: "2年生（テストデータ）",
        comment: "演習形式なので、話を聞くだけの授業よりも実践的に学べます。",
      },
    ],
  },
  {
    code: "artificial-intelligence-practice",
    name: "人工知能演習",
    rating: 4.5,
    color: "#ffedcc",
    textColor: "#80541a",
    reviews: [
      {
        author: "3年生（テストデータ）",
        comment: "AIに興味がある人には面白い授業です。事前に基本的な用語を調べておくと理解しやすいです。",
      },
      {
        author: "先輩（テストデータ）",
        comment: "演習内容を復習しながら進めると、理解が深まりやすいです。",
      },
    ],
  },
  {
    code: "cloud-advanced-practice",
    name: "クラウド応用演習",
    rating: 4.2,
    color: "#e9e0ff",
    textColor: "#5d4388",
    reviews: [
      {
        author: "3年生（テストデータ）",
        comment: "クラウド技術を実践的に学ぶ授業です。関連する用語を事前に確認しておくとよさそうです。",
      },
      {
        author: "2年生（テストデータ）",
        comment: "演習で学んだ内容を自分の環境でも試してみると理解しやすいです。",
      },
    ],
  },
  {
    code: "human-resources-and-organization",
    name: "人的資源と組織論",
    rating: 4.0,
    color: "#d9f0f7",
    textColor: "#225d71",
    reviews: [
      {
        author: "2年生（テストデータ）",
        comment: "組織や人材について考える授業です。授業で扱った内容を自分の経験と結びつけると理解しやすいです。",
      },
    ],
  },
  {
    code: "game-informatics",
    name: "ゲーム情報学",
    rating: 4.4,
    color: "#fbe2d2",
    textColor: "#844a2b",
    reviews: [
      {
        author: "3年生（テストデータ）",
        comment: "ゲームと情報技術の関係に興味がある人に向いている授業です。",
      },
      {
        author: "先輩（テストデータ）",
        comment: "専門用語を整理しながら学ぶと、授業内容を理解しやすいです。",
      },
    ],
  },
];

export function getCourseByCode(code: string): Course | undefined {
  return courses.find((course) => course.code === code);
}
```

---

## 3. `app/layout.tsx`

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "履修ナビ — 時間割と先輩の口コミ",
  description:
    "時間割を組みながら、先輩たちの授業レビューを確認できる履修登録支援サイト。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
```

---

## 4. `app/page.tsx`

```tsx
import TimetableApp from "./components/TimetableApp";

export default function HomePage() {
  return <TimetableApp />;
}
```

---

## 5. `app/courses/[courseCode]/page.tsx`

科目コードをURLに利用します。例：`/courses/linux-practice-a`

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { courses, getCourseByCode } from "../../../data/reviews";

export function generateStaticParams() {
  return courses.map((course) => ({
    courseCode: course.code,
  }));
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseCode: string }>;
}) {
  const { courseCode } = await params;
  const course = getCourseByCode(courseCode);

  if (!course) notFound();

  return (
    <main className="main detail-main">
      <Link className="detail-back" href="/#courses">
        ← 履修ナビに戻る
      </Link>

      <section className="panel detail-panel">
        <div className="eyebrow">COURSE REVIEW</div>
        <h1>{course.name}</h1>

        <div className="review-summary">
          <div className="rating">
            {course.rating.toFixed(1)}
            <span className="rating-scale"> / 5.0</span>
          </div>
          <div>
            <div
              className="stars"
              aria-label={`評価 ${course.rating} / 5`}
            >
              ★★★★★
            </div>
            <div className="small-muted">
              {course.reviews.length}件の口コミ
            </div>
          </div>
        </div>

        <h2 className="section-title">学生の口コミ</h2>

        {course.reviews.map((review, index) => (
          <article
            className="review-item"
            key={`${course.code}-${index}`}
          >
            <div className="author">{review.author}</div>
            <p>{review.comment}</p>
          </article>
        ))}

        <Link className="action secondary link-action" href="/#timetable">
          時間割ツールに戻る
        </Link>

        <p className="small-muted detail-note">
          ※ 一部の口コミは動作確認用のテストデータです。
        </p>
      </section>
    </main>
  );
}
```

---

## 6. `app/components/TimetableApp.tsx`

```tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
import { courses } from "../../data/reviews";

type ScheduleItem = {
  id: string;
  code: string;
  day: number;
  period: number;
};

type Theme = "system" | "light" | "dark";

const DAYS = ["月", "火", "水", "木", "金", "土"];
const PERIODS = ["1限", "2限", "3限", "4限", "5限"];
const SCHEDULE_KEY = "course-nav-schedule";
const THEME_KEY = "course-nav-theme";

function makeId() {
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function Rating({ rating }: { rating: number }) {
  return (
    <span className="rating-inline">
      <span className="stars" aria-label={`評価 ${rating} / 5`}>
        ★★★★★
      </span>
      <strong>{rating.toFixed(1)}</strong>
    </span>
  );
}

function ReviewCard({ code }: { code: string }) {
  const course = courses.find((item) => item.code === code);
  if (!course) return null;

  return (
    <Link className="review-card" href={`/courses/${course.code}`}>
      <h3>{course.name}</h3>
      <Rating rating={course.rating} />
      <div className="meta">口コミ {course.reviews.length}件</div>
      <p>{course.reviews[0]?.comment ?? "口コミはまだありません。"}</p>
    </Link>
  );
}

export default function TimetableApp() {
  const [page, setPage] = useState<"timetable" | "courses">("timetable");
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [theme, setTheme] = useState<Theme>("system");
  const [ready, setReady] = useState(false);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [dragging, setDragging] = useState<{
    code: string;
    id?: string;
  } | null>(null);

  const totalReviews = useMemo(
    () =>
      courses.reduce((sum, course) => sum + course.reviews.length, 0),
    [],
  );

  useEffect(() => {
    try {
      const storedSchedule = localStorage.getItem(SCHEDULE_KEY);
      if (storedSchedule) {
        const parsed: unknown = JSON.parse(storedSchedule);
        if (Array.isArray(parsed)) {
          setSchedule(parsed as ScheduleItem[]);
        }
      }

      const storedTheme = localStorage.getItem(THEME_KEY);
      if (
        storedTheme === "light" ||
        storedTheme === "dark" ||
        storedTheme === "system"
      ) {
        setTheme(storedTheme);
      }
    } catch {
      // 保存データが壊れている場合は初期状態で起動
    }

    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
  }, [schedule, ready]);

  useEffect(() => {
    if (!ready) return;

    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme =
      theme === "system" ? "light dark" : theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme, ready]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => setToastMessage(""), 2200);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const notify = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  const placeCourse = useCallback(
    (code: string, day: number, period: number) => {
      const course = courses.find((item) => item.code === code);
      if (!course) return;

      setSchedule((current) => {
        if (
          current.some(
            (item) => item.day === day && item.period === period,
          )
        ) {
          notify("このコマにはすでに科目があります");
          return current;
        }

        notify(`${course.name} を配置しました`);
        return [
          ...current,
          { id: makeId(), code, day, period },
        ];
      });

      setPendingCode(null);
    },
    [notify],
  );

  const moveCourse = useCallback(
    (id: string, day: number, period: number) => {
      setSchedule((current) => {
        const item = current.find((entry) => entry.id === id);
        if (!item) return current;

        if (
          current.some(
            (entry) =>
              entry.id !== id &&
              entry.day === day &&
              entry.period === period,
          )
        ) {
          notify("移動先のコマが埋まっています");
          return current;
        }

        notify("時間割を更新しました");
        return current.map((entry) =>
          entry.id === id ? { ...entry, day, period } : entry,
        );
      });
    },
    [notify],
  );

  const removeCourse = (id: string) => {
    setSchedule((current) =>
      current.filter((item) => item.id !== id),
    );
    notify("科目を削除しました");
  };

  const clearSchedule = () => {
    if (!window.confirm("時間割をすべて削除しますか？")) return;
    setSchedule([]);
    setPendingCode(null);
    notify("時間割をリセットしました");
  };

  const changeTheme = () => {
    setTheme((current) =>
      current === "system"
        ? "light"
        : current === "light"
          ? "dark"
          : "system",
    );
  };

  const onDrop = (
    event: DragEvent<HTMLDivElement>,
    day: number,
    period: number,
  ) => {
    event.preventDefault();

    // ドラッグ状態を優先。dataTransfer はブラウザごとの差異があるため、
    // React の state と併用して科目追加・移動を処理する。
    if (!dragging) return;

    if (dragging.id) {
      moveCourse(dragging.id, day, period);
    } else {
      placeCourse(dragging.code, day, period);
    }

    setDragging(null);
  };

  const themeLabel =
    theme === "light"
      ? "☀ ライト"
      : theme === "dark"
        ? "☾ ダーク"
        : "◐ 自動";

  return (
    <div className="root">
      <header className="topbar">
        <Link href="/" className="brand" aria-label="履修ナビ トップ">
          <span className="logo">履</span>
          <span>履修ナビ</span>
        </Link>

        <nav className="nav" aria-label="メインメニュー">
          <button
            className={page === "timetable" ? "active" : ""}
            onClick={() => setPage("timetable")}
          >
            時間割ツール
          </button>
          <button
            className={page === "courses" ? "active" : ""}
            onClick={() => setPage("courses")}
          >
            履修口コミ
          </button>
        </nav>

        <button className="theme-btn" onClick={changeTheme}>
          {themeLabel}
        </button>
      </header>

      <main className="main">
        {page === "timetable" ? (
          <section id="timetable">
            <div className="page-head">
              <div>
                <div className="eyebrow">YOUR CAMPUS, YOUR PLAN</div>
                <h1>時間割を、自由に組もう。</h1>
                <p className="sub">
                  科目ブロックをつかんで、好きなコマへドラッグ。
                </p>
              </div>
              <span className="pill">自動保存 · このブラウザ内</span>
            </div>

            <div className="workspace">
              <section className="panel">
                <div className="schedule-tools">
                  <div>
                    <strong>マイ時間割</strong>
                    <div className="small-muted">
                      月曜日 — 土曜日 ／ 1〜5限
                    </div>
                  </div>
                  <button
                    className="action secondary"
                    onClick={clearSchedule}
                  >
                    時間割をリセット
                  </button>
                </div>

                <div className="grid-wrap">
                  <div className="timetable">
                    <div />
                    {DAYS.map((day) => (
                      <div className="day" key={day}>
                        {day}
                      </div>
                    ))}

                    {PERIODS.map((period, periodIndex) => (
                      <div className="timetable-row" key={period}>
                        <div className="period">{period}</div>

                        {DAYS.map((day, dayIndex) => {
                          const item = schedule.find(
                            (entry) =>
                              entry.day === dayIndex &&
                              entry.period === periodIndex,
                          );
                          const course = item
                            ? courses.find(
                                (entry) => entry.code === item.code,
                              )
                            : undefined;

                          return (
                            <div
                              className={`slot${dragging ? " slot-ready" : ""}`}
                              key={`${day}-${period}`}
                              onDragOver={(event) =>
                                event.preventDefault()
                              }
                              onDrop={(event) =>
                                onDrop(event, dayIndex, periodIndex)
                              }
                              onClick={() => {
                                if (pendingCode) {
                                  placeCourse(
                                    pendingCode,
                                    dayIndex,
                                    periodIndex,
                                  );
                                }
                              }}
                            >
                              {item && course ? (
                                <div
                                  className="course-block"
                                  draggable
                                  style={{
                                    background: course.color,
                                    color: course.textColor,
                                  }}
                                  onDragStart={(event) => {
                                    event.dataTransfer.effectAllowed =
                                      "move";
                                    event.dataTransfer.setData(
                                      "text/plain",
                                      item.id,
                                    );
                                    setDragging({
                                      code: item.code,
                                      id: item.id,
                                    });
                                  }}
                                  onDragEnd={() => setDragging(null)}
                                  onClick={(event) =>
                                    event.stopPropagation()
                                  }
                                >
                                  <strong>{course.name}</strong>
                                  <small>
                                    {DAYS[item.day]}曜日 ·{" "}
                                    {PERIODS[item.period]}
                                  </small>
                                  <div className="block-actions">
                                    <Link
                                      className="mini"
                                      href={`/courses/${course.code}`}
                                      onClick={(event) =>
                                        event.stopPropagation()
                                      }
                                    >
                                      口コミ
                                    </Link>
                                    <button
                                      className="mini"
                                      aria-label={`${course.name}を削除`}
                                      onClick={() =>
                                        removeCourse(item.id)
                                      }
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <aside className="panel side">
                <h2>科目ブロック</h2>
                <span className="small-muted">
                  下からドラッグ、またはクリックして配置
                </span>

                <div className="course-list">
                  {courses.map((course) => (
                    <button
                      className={`course-choice${
                        pendingCode === course.code ? " selected" : ""
                      }`}
                      key={course.code}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "copy";
                        event.dataTransfer.setData(
                          "text/plain",
                          course.code,
                        );
                        setDragging({ code: course.code });
                      }}
                      onDragEnd={() => setDragging(null)}
                      onClick={() => {
                        setPendingCode(course.code);
                        notify(
                          `${course.name}：配置先の曜日・時限をクリックしてください`,
                        );
                      }}
                    >
                      <span
                        className="swatch"
                        style={{ background: course.color }}
                      />
                      <span>
                        <strong>{course.name}</strong>
                        <small>
                          {course.rating.toFixed(1)} ★ ·{" "}
                          {course.reviews.length}件
                        </small>
                      </span>
                    </button>
                  ))}
                </div>

                <div className="hint">
                  ✦ ブロックは曜日・時限のマスにスナップします。
                  配置後もドラッグして移動できます。
                </div>
              </aside>
            </div>

            <h2 className="section-title">口コミを見ながら選ぶ</h2>
            <div className="course-catalog">
              {courses.slice(0, 3).map((course) => (
                <ReviewCard key={course.code} code={course.code} />
              ))}
            </div>
          </section>
        ) : (
          <section id="courses">
            <div className="page-head">
              <div>
                <div className="eyebrow">STUDENT REVIEWS</div>
                <h1>先輩たちの授業レビュー</h1>
                <p className="sub">
                  授業選びのヒントを、受講した学生の声から。
                </p>
              </div>
              <span className="pill">
                {courses.length}科目 · {totalReviews}件の口コミ
              </span>
            </div>

            <div className="course-catalog">
              {courses.map((course) => (
                <ReviewCard key={course.code} code={course.code} />
              ))}
            </div>
          </section>
        )}

        <footer className="footer">
          履修ナビ · 学生の科目選びをサポート
        </footer>
      </main>

      {toastMessage ? (
        <div className="toast" role="status">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
```

---

## 7. `app/globals.css`

```css
@import "tailwindcss";

:root {
  color-scheme: light dark;
  --bg: light-dark(#f6f7fb, #101116);
  --surface: light-dark(#fff, #1a1b22);
  --surface2: light-dark(#f0f1f6, #24252e);
  --text: light-dark(#20212a, #f2f2f6);
  --muted: light-dark(#777987, #a4a6b5);
  --line: light-dark(#e2e4ec, #343541);
  --accent: light-dark(#e83e83, #ff5b9b);
  --accent-soft: light-dark(#fff0f6, #3b202d);
  --shadow: 0 8px 28px #0000000b;
}

:root[data-theme="light"] {
  color-scheme: light;
  --bg: #f6f7fb;
  --surface: #fff;
  --surface2: #f0f1f6;
  --text: #20212a;
  --muted: #777987;
  --line: #e2e4ec;
  --accent: #e83e83;
  --accent-soft: #fff0f6;
}

:root[data-theme="dark"] {
  color-scheme: dark;
  --bg: #101116;
  --surface: #1a1b22;
  --surface2: #24252e;
  --text: #f2f2f6;
  --muted: #a4a6b5;
  --line: #343541;
  --accent: #ff5b9b;
  --accent-soft: #3b202d;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font: 15px/1.5 Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans JP", sans-serif;
}
button, input { font: inherit; }
button { cursor: pointer; }
a { color: inherit; text-decoration: none; }
.root { min-height: 100vh; background: var(--bg); }

.topbar {
  height: 72px;
  border-bottom: 1px solid var(--line);
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(18px, 4vw, 56px);
  position: sticky;
  top: 0;
  z-index: 10;
}
.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  font-weight: 800;
  font-size: 18px;
  letter-spacing: -.5px;
}
.logo {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: var(--accent);
  color: white;
  display: grid;
  place-items: center;
  font-weight: 900;
}
.nav { display: flex; align-items: center; gap: 8px; }
.nav button, .theme-btn {
  border: 0;
  background: transparent;
  color: var(--muted);
  padding: 10px 14px;
  border-radius: 11px;
  font-weight: 650;
}
.nav button.active, .nav button:hover {
  background: var(--accent-soft);
  color: var(--accent);
}
.theme-btn {
  border: 1px solid var(--line);
  color: var(--text);
  padding: 9px 12px;
}

.main { max-width: 1240px; margin: auto; padding: 34px 24px 70px; }
.page-head {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-end;
  margin-bottom: 25px;
}
.eyebrow {
  font-size: 11px;
  font-weight: 800;
  color: var(--accent);
  letter-spacing: 1.7px;
  text-transform: uppercase;
}
.page-head h1 {
  font-size: clamp(27px, 4vw, 38px);
  letter-spacing: -1.2px;
  line-height: 1.2;
  margin: 7px 0 8px;
}
.sub { color: var(--muted); margin: 0; }
.pill {
  font-size: 12px;
  border: 1px solid var(--line);
  padding: 7px 11px;
  border-radius: 999px;
  color: var(--muted);
  white-space: nowrap;
}
.panel {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  box-shadow: var(--shadow);
}
.schedule-tools {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 18px;
  border-bottom: 1px solid var(--line);
  gap: 12px;
  flex-wrap: wrap;
}
.schedule-tools strong { font-size: 15px; }
.small-muted { font-size: 12px; color: var(--muted); }

.action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 10px;
  background: var(--accent);
  color: #fff;
  font-weight: 750;
  padding: 10px 15px;
}
.action.secondary {
  background: var(--surface2);
  color: var(--text);
  border: 1px solid var(--line);
}
.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 255px;
  gap: 18px;
  align-items: start;
}
.grid-wrap { overflow: auto; padding: 12px; }
.timetable {
  display: grid;
  grid-template-columns: 58px repeat(6, minmax(95px, 1fr));
  grid-template-rows: 40px repeat(5, 105px);
  min-width: 690px;
  gap: 5px;
}
.timetable-row { display: contents; }
.day, .period {
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 750;
  color: var(--muted);
}
.period { background: var(--surface2); border-radius: 10px; }
.slot {
  position: relative;
  background: var(--bg);
  border: 1px dashed var(--line);
  border-radius: 11px;
  min-width: 0;
  transition: background .15s, border-color .15s;
}
.slot-ready:hover {
  background: var(--accent-soft);
  border: 2px dashed var(--accent);
}
.course-block {
  position: absolute;
  inset: 4px;
  border-radius: 9px;
  padding: 8px 7px;
  cursor: grab;
  box-shadow: 0 2px 7px #0000000c;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
  user-select: none;
}
.course-block:active { cursor: grabbing; }
.course-block strong { font-size: 12px; line-height: 1.35; }
.course-block small { font-size: 10px; opacity: .8; }
.block-actions {
  display: flex;
  gap: 5px;
  margin-top: auto;
  align-items: center;
}
.mini {
  border: 0;
  border-radius: 6px;
  background: #ffffff88;
  color: inherit;
  font-size: 10px;
  padding: 3px 5px;
}
.side { padding: 17px; }
.side h2 { font-size: 15px; margin: 0 0 5px; }
.side .small-muted { margin-bottom: 14px; display: block; }
.course-list { display: flex; flex-direction: column; gap: 8px; }
.course-choice {
  width: 100%;
  text-align: left;
  background: var(--surface2);
  border: 1px solid var(--line);
  border-radius: 11px;
  padding: 10px;
  display: flex;
  gap: 9px;
  align-items: flex-start;
  color: var(--text);
}
.course-choice:hover, .course-choice.selected { border-color: var(--accent); }
.swatch {
  width: 9px;
  min-height: 34px;
  border-radius: 9px;
  flex: none;
}
.course-choice strong { font-size: 12px; display: block; }
.course-choice small { font-size: 11px; color: var(--muted); }
.hint {
  background: var(--accent-soft);
  color: var(--accent);
  border-radius: 11px;
  padding: 11px;
  font-size: 11px;
  line-height: 1.6;
  margin-top: 13px;
}

.section-title { font-size: 19px; margin: 28px 0 14px; }
.rating-inline { display: inline-flex; align-items: center; gap: 7px; }
.stars { color: #f5a623; letter-spacing: 1px; white-space: nowrap; }
.rating-inline strong { font-size: 14px; }
.course-catalog {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 15px;
}
.review-card {
  display: block;
  width: 100%;
  padding: 19px;
  text-align: left;
  color: var(--text);
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
  transition: transform .15s, border-color .15s;
  cursor: pointer;
}
.review-card:hover { transform: translateY(-2px); border-color: var(--accent); }
.review-card h3 { margin: 0 0 12px; font-size: 16px; }
.review-card .meta { font-size: 12px; color: var(--muted); margin-top: 9px; }
.review-card p {
  font-size: 13px;
  line-height: 1.7;
  margin: 13px 0 0;
  color: var(--muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.detail-main { max-width: 900px; }
.detail-back {
  display: inline-block;
  color: var(--muted);
  padding: 0;
  margin-bottom: 20px;
}
.detail-panel { padding: clamp(20px, 4vw, 34px); }
.detail-panel h1 { font-size: clamp(25px, 4vw, 36px); margin: 8px 0; }
.review-summary { display: flex; gap: 12px; align-items: center; padding: 14px 0 0; }
.rating { font-size: 25px; font-weight: 850; }
.rating-scale { font-size: 13px; color: var(--muted); font-weight: 400; }
.review-item { padding: 18px 0; border-top: 1px solid var(--line); }
.review-item p { line-height: 1.8; margin: 9px 0 0; }
.author { font-size: 12px; color: var(--muted); }
.link-action { margin-top: 15px; }
.detail-note { margin-top: 18px; }
.footer { margin-top: 35px; text-align: center; color: var(--muted); font-size: 11px; }
.toast {
  position: fixed;
  bottom: 22px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--text);
  color: var(--surface);
  padding: 10px 16px;
  border-radius: 10px;
  box-shadow: var(--shadow);
  z-index: 30;
  max-width: calc(100vw - 30px);
  text-align: center;
}

@media (max-width: 900px) {
  .workspace { grid-template-columns: 1fr; }
  .side { order: -1; }
  .course-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .course-catalog { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .timetable { grid-template-rows: 36px repeat(5, 90px); }
}
@media (max-width: 600px) {
  .topbar {
    height: auto;
    min-height: 64px;
    padding: 12px 15px;
    flex-wrap: wrap;
    gap: 8px;
  }
  .brand { font-size: 16px; }
  .nav { order: 3; width: 100%; justify-content: space-between; }
  .nav button { flex: 1; padding: 9px 6px; font-size: 12px; }
  .theme-btn { font-size: 12px; }
  .main { padding: 24px 13px 50px; }
  .page-head { align-items: flex-start; flex-direction: column; }
  .course-catalog { grid-template-columns: 1fr; }
  .course-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .course-choice { padding: 8px; }
  .detail-panel { padding: 20px; }
  .timetable {
    grid-template-columns: 45px repeat(6, minmax(90px, 1fr));
    grid-template-rows: 34px repeat(5, 85px);
    min-width: 625px;
  }
}
```

---

## 8. 起動方法

既存の Next.js プロジェクトのルートで実行します。

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

## 9. 実装済み機能

- 月〜土、1〜5限の時間割グリッド
- 科目一覧からクリックしてコマに配置
- 科目ブロックのドラッグ＆ドロップ移動
- 同じコマへの重複配置を防止
- 配置済み科目の削除
- 時間割のリセット
- `localStorage` による時間割・テーマ保存
- ライト／ダーク／システム設定の切り替え
- 口コミ一覧と科目詳細ページ
- `/courses/[courseCode]` 形式の科目別URL
- PC・スマートフォン向けレスポンシブ表示

## 10. 現段階の制約と次の作業

1. **口コミデータは仮データです。** `data/reviews.ts` を既存の `review.json` から読み込む形に変更する場合、JSONの構造を確認してからデータ変換処理を実装します。
2. **保存先は利用中のブラウザです。** `localStorage` のため、別端末とは同期されません。アカウント間共有が必要になった段階でAPI・データベースを検討します。
3. **ドラッグ操作はHTML Drag and Drop APIを使用しています。** タッチ端末でのドラッグ操作はブラウザによって挙動が異なるため、必要なら Pointer Events ベースの操作に置き換えます。
4. **平均評価は現在固定値です。** 口コミ単位の評価データが確定したら、平均値を自動計算する形に変更します。
5. **科目コードは仮のslugです。** 実際の科目コードが分かり次第、`data/reviews.ts` の `code` を正式な識別子に置き換えます。
'''

out.write_text(content, encoding="utf-8")
print(f"Created: {out}")
print(f"Size: {out.stat().st_size} bytes")

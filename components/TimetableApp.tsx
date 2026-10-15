"use client";


import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
import { courses } from "../data/lib/reviews";

import GradeSelector from "./GradeSelector";
import type { Grade } from "../data/lib/grade-theme";


type ScheduleItem = {
  id: string;
  code: string;
  day: number;
  period: number;
};

type Theme = "light" | "dark";

const DAYS = ["月", "火", "水", "木", "金", "土"];
const PERIODS = ["1限", "2限", "3限", "4限", "5限"];
const SCHEDULE_KEY = "course-nav-schedule";
const THEME_KEY = "course-nav-theme";

console.log("[DEBUG] TimetableApp rendered");

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

type TimetableAppProps = {
  initialPage?: "timetable" | "courses";
};

export default function TimetableApp({
  initialPage = "timetable",
}: TimetableAppProps) {
  const [page, setPage] = useState<"timetable" | "courses">(
    initialPage,
  );
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [dragging, setDragging] = useState<{
    code: string;
    id?: string;
  } | null>(null);
  const [trashActive, setTrashActive] = useState(false);

  const totalReviews = useMemo(
    () =>
      courses.reduce((sum, course) => sum + course.reviews.length, 0),
    [],
  );
  const [selectedGrade, setSelectedGrade] = useState<Grade>(1);

  useEffect(() => {
    // 保存済みの時間割を復元
    try {
      const storedSchedule = localStorage.getItem(SCHEDULE_KEY);

      if (storedSchedule) {
        const parsed: unknown = JSON.parse(storedSchedule);

        if (Array.isArray(parsed)) {
          setSchedule(parsed as ScheduleItem[]);
        }
      }
    } catch {
      // 時間割データが壊れている場合は初期状態で起動
    }


    // 保存済みのテーマを復元
    const storedTheme = localStorage.getItem(THEME_KEY);

    if (storedTheme === "light" || storedTheme === "dark") {
      // ユーザーが選択したテーマを優先
      setTheme(storedTheme);
      console.log("[Theme Debug] 保存値を復元:", storedTheme);
    } else {
      // 保存値がなければブラウザ・OSの設定を読む
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

      const initialTheme: Theme = prefersDark ? "dark" : "light";

      setTheme(initialTheme);
      console.log("[Theme Debug] システム設定から初期化:", {
        prefersDark,
        initialTheme,
      });
    }


    // 初期読み込み完了
    setReady(true);
  }, []);


  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
  }, [schedule, ready]);

  useEffect(() => {
    if (!ready) return;

    const isDark = theme === "dark";

    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";

    localStorage.setItem(THEME_KEY, theme);

    console.log("[Theme Debug] 適用テーマ:", {
      theme,
      dark: isDark,
    });
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

  const onTrashDrop = (
    event: DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();

    if (dragging?.id) {
      removeCourse(dragging.id);
    } else {
      notify("削除するには、時間割上の科目を移動してください");
    }

    setDragging(null);
    setTrashActive(false);
  };

  const clearSchedule = () => {
    if (!window.confirm("時間割をすべて削除しますか？")) return;
    setSchedule([]);
    setPendingCode(null);
    notify("時間割をリセットしました");
  };

  const changeTheme = () => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
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
    <div className="root" data-grade={selectedGrade}>
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

            <GradeSelector
              value={selectedGrade}
              onChange={setSelectedGrade}
            />
            <div className="workspace">
              <section className="panel">
                <div className="schedule-actions">
                  <div
                    className={`trash-dropzone${trashActive ? " active" : ""}`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                    }}
                    onDragEnter={() => setTrashActive(true)}
                    onDragLeave={(event) => {
                      if (
                        !event.currentTarget.contains(
                          event.relatedTarget as Node | null,
                        )
                      ) {
                        setTrashActive(false);
                      }
                    }}
                    onDrop={onTrashDrop}
                    role="region"
                    aria-label="科目の削除エリア"
                  >
                    <span aria-hidden="true">🗑</span>
                    <span>ここにドロップして削除</span>
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

"use client";
import { courses as reviewCourses } from "../data/lib/reviews";
import CreditSimulator from "./credits/CreditSimulator";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
import { courses } from "../data/lib/reviews";

import GradeSelector from "./GradeSelector";
import type { Grade } from "../data/lib/grade-theme";


import {
  getSelectableCourses,
  type Semester,
} from "../data/lib/course-selector";

import { courses as catalogCourses } from "../data/lib/courses";

import TimetableTutorial from "./TimetableTutorial";


type ScheduleItem = {
  id: string;
  code: string;
  day: number;
  period: number;
};

type Theme = "light" | "dark";

const DAYS = ["月", "火", "水", "木", "金"];
const PERIODS = ["1限", "2限", "3限", "4限", "5限"];
const SCHEDULE_KEY = "course-nav-schedule";
const THEME_KEY = "course-nav-theme";


const TIMETABLE_ROWS = [
  { label: "1限", start: "9:10", end: "10:50", periodIndex: 0 },
  { label: "2限", start: "11:00", end: "12:40", periodIndex: 1 },
  { label: "3限", start: "13:40", end: "15:20", periodIndex: 2 },
  { label: "4限", start: "15:30", end: "17:10", periodIndex: 3 },
  { label: "5限", start: "17:20", end: "19:00", periodIndex: 4 },
] as const;

type CustomBlock = {
  id: string;
  title: string;
  memo: string;
  color: string;
};

type ScheduleEvent = {
  id: string;
  blockId: string;
  day: number;
  rowIndex: number;
};

const CUSTOM_BLOCKS_KEY = "course-nav-custom-blocks";
const EVENTS_KEY = "course-nav-events";
const DEFAULT_EVENT_COLOR = "#8b7cf6";

type CourseModelId = "SE" | "IoT" | "DS" | "CS" | "CG" | "DE";



type TimetableCourseInfo = {
  name: string;
  color: string;
  textColor: string;
};

function getTimetableCourse(
  code: string,
): TimetableCourseInfo | undefined {
  // 口コミデータに存在する科目
  const reviewCourse = reviewCourses.find(
    (item) => item.code === code,
  );

  if (reviewCourse) {
    return {
      name: reviewCourse.name,
      color: reviewCourse.color,
      textColor: reviewCourse.textColor,
    };
  }

  // シラバス由来の科目
  // 新しい識別子 catalog:<id> と、旧形式の id の両方に対応
  const catalogId = code.startsWith("catalog:")
    ? code.slice("catalog:".length)
    : code;

  const catalogCourse = catalogCourses.find(
    (item) => item.id === catalogId,
  );

  if (!catalogCourse) return undefined;

  return {
    name: catalogCourse.course_name,
    color: "#64748b",
    textColor: "#ffffff",
  };
}

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
  const [page, setPage] = useState<
    "courses" | "timetable" | "calccalc"
  >("timetable");
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const totalCredits = useMemo(() => {
    // 時間割に配置されている科目を、科目名で重複排除
    const uniqueCourses = new Map<string, number>();

    for (const item of schedule) {
      const catalogId = item.code.startsWith("catalog:")
        ? item.code.slice("catalog:".length)
        : item.code;

      const catalogCourse = catalogCourses.find(
        (course) => course.id === catalogId,
      );

      const reviewCourse = reviewCourses.find(
        (course) => course.code === item.code,
      );

      const courseName =
        catalogCourse?.course_name ?? reviewCourse?.name;

      if (!courseName) continue;

      const credits = catalogCourse?.credits ?? 2;

      // 同じ科目名は1回だけ登録する
      if (!uniqueCourses.has(courseName)) {
        uniqueCourses.set(courseName, credits);
      }
    }

    return Array.from(uniqueCourses.values()).reduce(
      (total, credits) => total + credits,
      0,
    );
  }, [schedule]);


  const workload =
    totalCredits <= 12
      ? {
          label: "楽！",
          description: "比較的余裕を持って取り組めそうです。",
          level: "easy",
        }
      : totalCredits <= 20
        ? {
            label: "ちょっと大変",
            description: "課題や試験の日程を確認しておきましょう。",
            level: "moderate",
          }
        : {
            label: "きつい〜",
            description: "課題・試験が重なる時期に注意しましょう。",
            level: "hard",
          };
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [dragging, setDragging] = useState<{
    code: string;
    id?: string;
    kind?: "event" | "custom";
    blockId?: string;
  } | null>(null);
  const [trashActive, setTrashActive] = useState(false);

  const [selectedModel, setSelectedModel] =
    useState<CourseModelId | null>(null);


  // 単位数の目安（必要に応じて変更）
  const CREDIT_LIMIT = 24;
  const CREDITS_PER_COURSE = 2;

  // 履修負荷の目安
  const LOAD_THRESHOLDS = {
    easy: 12,
    moderate: 18,
  } as const;

  const totalReviews = useMemo(
    () =>
      courses.reduce((sum, course) => sum + course.reviews.length, 0),
    [],
  );
  const [selectedGrade, setSelectedGrade] = useState<Grade>(1);




  const [selectedSemester, setSelectedSemester] =
    useState<Semester>("前期");

  const [selectionLoaded, setSelectionLoaded] = useState(false);

  const [tutorialOpen, setTutorialOpen] = useState(false);

  // 前回の選択を復元
  useEffect(() => {
    try {
      const savedGrade = localStorage.getItem("selectedGrade");
      const savedSemester = localStorage.getItem("selectedSemester");

      if (savedGrade !== null) {
        const grade = Number(savedGrade);

        if ([1, 2, 3, 4].includes(grade)) {
          setSelectedGrade(grade as Grade);
        }
      }

      if (
        savedSemester === "前期" ||
        savedSemester === "後期"
      ) {
        setSelectedSemester(savedSemester);
      }
    } finally {
      setSelectionLoaded(true);
    }
  }, []);

  // 選択状態を保存
  useEffect(() => {
    if (!selectionLoaded) return;

    localStorage.setItem("selectedGrade", String(selectedGrade));
    localStorage.setItem("selectedSemester", selectedSemester);
  }, [selectedGrade, selectedSemester, selectionLoaded]);

  const selectableCourses = useMemo(
    () => getSelectableCourses(selectedGrade, selectedSemester),
    [selectedGrade, selectedSemester],
  );

  const visibleReviewCourses = selectableCourses
    .map((course) =>
      reviewCourses.find(
        (review) => review.name === course.course_name,
      ),
    )
    .filter((course) => course !== undefined);

  const visibleReviewCount = visibleReviewCourses.reduce(
    (total, course) => total + course.reviews.length,
    0,
  );

  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [customBlocks, setCustomBlocks] = useState<CustomBlock[]>([]);
  const [pendingCustomBlockId, setPendingCustomBlockId] =
    useState<string | null>(null);

  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventMemo, setEventMemo] = useState("");
  const [eventColor, setEventColor] = useState(DEFAULT_EVENT_COLOR);

  useEffect(() => {
    try {
      const storedBlocks = localStorage.getItem(CUSTOM_BLOCKS_KEY);
      if (storedBlocks) {
        const parsed: unknown = JSON.parse(storedBlocks);
        if (Array.isArray(parsed)) {
          setCustomBlocks(parsed as CustomBlock[]);
        }
      }

      const storedEvents = localStorage.getItem(EVENTS_KEY);
      if (storedEvents) {
        const parsed: unknown = JSON.parse(storedEvents);

        if (Array.isArray(parsed)) {
          // 新形式の配置データを復元
          if (
            parsed.every(
              (item) =>
                typeof item === "object" &&
                item !== null &&
                "blockId" in item,
            )
          ) {
            setEvents(parsed as ScheduleEvent[]);
          } else {
            // 旧形式の予定データがあれば、新形式へ移行
            const legacy = parsed as {
              id: string;
              title: string;
              day: number;
              rowIndex: number;
            }[];

            const blockByTitle = new Map<string, CustomBlock>();
            const migratedEvents: ScheduleEvent[] = [];

            for (const item of legacy) {
              if (
                typeof item.title !== "string" ||
                typeof item.day !== "number" ||
                typeof item.rowIndex !== "number"
              ) {
                continue;
              }

              let block = blockByTitle.get(item.title);

              if (!block) {
                block = {
                  id: makeId(),
                  title: item.title,
                  memo: "",
                  color: DEFAULT_EVENT_COLOR,
                };
                blockByTitle.set(item.title, block);
              }

              migratedEvents.push({
                id: item.id || makeId(),
                blockId: block.id,
                day: item.day,
                rowIndex: item.rowIndex,
              });
            }

            if (migratedEvents.length > 0) {
              setCustomBlocks((current) => [
                ...current,
                ...Array.from(blockByTitle.values()),
              ]);
              setEvents(migratedEvents);
            }
          }
        }
      }

      const storedSchedule = localStorage.getItem(SCHEDULE_KEY);
      if (storedSchedule) {
        const parsed: unknown = JSON.parse(storedSchedule);
        if (Array.isArray(parsed)) {
          setSchedule(parsed as ScheduleItem[]);
        }
      }
    } catch {
      console.warn("保存データを読み込めませんでした。");
    }

    const storedTheme = localStorage.getItem(THEME_KEY);

    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
    } else {
      setTheme(
        window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light",
      );
    }

    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
  }, [schedule, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(CUSTOM_BLOCKS_KEY, JSON.stringify(customBlocks));
  }, [customBlocks, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  }, [events, ready]);

  const addCustomBlock = () => {
    const title = eventTitle.trim();

    if (!title) {
      notify("予定名を入力してください");
      return;
    }

    const block: CustomBlock = {
      id: makeId(),
      title,
      memo: eventMemo.trim(),
      color: eventColor,
    };

    setCustomBlocks((current) => [...current, block]);
    setEventTitle("");
    setEventMemo("");
    setEventColor(DEFAULT_EVENT_COLOR);
    setShowEventForm(false);
    notify(`「${title}」を登録しました`);
  };

  const addEvent = (
    blockId: string,
    day: number,
    rowIndex: number,
  ) => {
    const block = customBlocks.find((item) => item.id === blockId);
    const row = TIMETABLE_ROWS[rowIndex];

    if (!block || !row) return;

    const occupiedByCourse =
      row.periodIndex !== null &&
      schedule.some(
        (item) =>
          item.day === day && item.period === row.periodIndex,
      );

    const occupiedByEvent = events.some(
      (item) => item.day === day && item.rowIndex === rowIndex,
    );

    if (occupiedByCourse || occupiedByEvent) {
      notify("このマスにはすでに予定があります");
      return;
    }

    setEvents((current) => [
      ...current,
      {
        id: makeId(),
        blockId,
        day,
        rowIndex,
      },
    ]);

    setPendingCustomBlockId(null);
    notify(`「${block.title}」を配置しました`);
  };

  const moveEvent = (
    id: string,
    day: number,
    rowIndex: number,
  ) => {
    const row = TIMETABLE_ROWS[rowIndex];
    if (!row) return;

    const occupiedByCourse =
      row.periodIndex !== null &&
      schedule.some(
        (item) =>
          item.day === day && item.period === row.periodIndex,
      );

    const occupiedByEvent = events.some(
      (item) =>
        item.id !== id &&
        item.day === day &&
        item.rowIndex === rowIndex,
    );

    if (occupiedByCourse || occupiedByEvent) {
      notify("移動先のマスが埋まっています");
      return;
    }

    setEvents((current) =>
      current.map((item) =>
        item.id === id ? { ...item, day, rowIndex } : item,
      ),
    );

    notify("予定を移動しました");
  };

  const removeEvent = (id: string) => {
    setEvents((current) =>
      current.filter((item) => item.id !== id),
    );
    notify("配置した予定を削除しました");
  };

  const removeCustomBlock = (blockId: string) => {
    const block = customBlocks.find((item) => item.id === blockId);
    if (!block) return;

    if (
      !window.confirm(
        `「${block.title}」と、その時間割上の配置をすべて削除しますか？`,
      )
    ) {
      return;
    }

    setCustomBlocks((current) =>
      current.filter((item) => item.id !== blockId),
    );

    setEvents((current) =>
      current.filter((item) => item.blockId !== blockId),
    );

    setPendingCustomBlockId((current) =>
      current === blockId ? null : current,
    );

    notify(`「${block.title}」を削除しました`);
  };

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
      const course = getTimetableCourse(code);
      if (!course) {
        notify("科目情報を取得できませんでした");
        return;
      }

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
      if (dragging.kind === "event") {
        removeEvent(dragging.id);
      } else {
        removeCourse(dragging.id);
      }
    }

    setDragging(null);
    setTrashActive(false);
  };

  const clearSchedule = () => {
    if (!window.confirm("時間割をすべて削除しますか？")) return;

    setSchedule([]);
    setEvents([]);
    setPendingCode(null);
    setPendingCustomBlockId(null);
    notify("時間割をリセットしました");
  };

  const changeTheme = () => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  };

  const onDrop = (
    event: DragEvent<HTMLDivElement>,
    day: number,
    rowIndex: number,
  ) => {
    event.preventDefault();

    if (!dragging) return;

    if (dragging.kind === "event" && dragging.id) {
      moveEvent(dragging.id, day, rowIndex);
    } else if (dragging.kind === "custom" && dragging.blockId) {
      addEvent(dragging.blockId, day, rowIndex);
    } else if (dragging.id) {
      const periodIndex = TIMETABLE_ROWS[rowIndex]?.periodIndex;

      if (periodIndex !== null && periodIndex !== undefined) {
        moveCourse(dragging.id, day, periodIndex);
      } else {
        notify("授業は休み時間に移動できません");
      }
    } else {
      const periodIndex = TIMETABLE_ROWS[rowIndex]?.periodIndex;

      if (periodIndex !== null && periodIndex !== undefined) {
        placeCourse(dragging.code, day, periodIndex);
      } else {
        notify("休み時間には授業を配置できません");
      }
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
        <button
          className={page === "calccalc" ? "active" : ""}
          onClick={() => setPage("calccalc")}
        >
          単位計算ツール
        </button>
      </nav>

      <div className="header-actions">
        <button
          type="button"
          className="tutorial-launch-btn"
          onClick={() => {
            setPage("timetable");
            setTutorialOpen(false);
            requestAnimationFrame(() => setTutorialOpen(true));
          }}
        >
          <span aria-hidden="true">✦</span>
          使い方
        </button>

        <button className="theme-btn" onClick={changeTheme}>
          {themeLabel}
        </button>
      </div>
    </header>

      <main className="main">
        {page === "timetable" ? (
          <section id="timetable" data-tour="timetable">
            <div className="page-head">
              <div>
                <div className="eyebrow">YOUR CAMPUS, YOUR PLAN</div>
                <h1>時間割を、自由に組もう。</h1>
                <p className="sub">
                  科目ブロックをつかんで、好きなコマへドラッグ。
                </p>
              </div>

              <div className="header-actions">
                <a href="https://aaaportal.tid.ac.jp/aa_web/portal/mt0010.aspx" className="back-button">
                  AAAへ戻る
                </a>
              </div>

              <div className="header-actions">
                <a href="https://aaaportal.tid.ac.jp/aa_web/portal/mt0010.aspx" className="back-button">
                  履修登録ページに行く！
                </a>
              </div>

              <span className="pill">自動保存 · このブラウザ内</span>
            </div>

            <div data-tour="grade-selector">
              <GradeSelector
                value={selectedGrade}
                onChange={setSelectedGrade}
                semester={selectedSemester}
                onSemesterChange={setSelectedSemester}
                selectedModel={selectedModel}
                onModelChange={(model) => {
                  setSelectedModel(model);
                  notify(`履修モデルを「${model}」に設定しました`);
                }}
              />
            </div>
            <div className="workspace">
              <section className="panel">
                <div className="schedule-tools">
                  <div>
                    <h3>マイ時間割</h3>
                  </div>


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
                      <span className="trash-label">
                        <span className="desktop-trash-label">削除エリア</span>
                        <span className="mobile-trash-label">削除</span>
                      </span>
                    </div>

                    <button
                      className="action secondary"
                      onClick={clearSchedule}
                    >
                      時間割をリセット
                    </button>
                  </div>
                </div>

                <div className="grid-wrap">
                  <div className={`credit-attention ${workload.level}`}>
                    <div className="credit-attention-header">
                      <div>
                        <span className="credit-eyebrow">CREDIT CHECK</span>
                        <h4>今学期の履修状況</h4>
                      </div>

                      <span className={`workload-badge ${workload.level}`}>
                        {workload.label}
                      </span>
                    </div>

                    <div className="credit-summary">
                      <div className="credit-number">
                        <strong>{totalCredits}</strong>
                        <span> / {CREDIT_LIMIT} 単位</span>
                      </div>

                      <span className="credit-remaining">
                        残り {Math.max(0, CREDIT_LIMIT - totalCredits)} 単位
                      </span>
                    </div>

                    <div
                      className="credit-progress"
                      role="progressbar"
                      aria-label="単位上限に対する履修状況"
                      aria-valuemin={0}
                      aria-valuemax={CREDIT_LIMIT}
                      aria-valuenow={Math.min(totalCredits, CREDIT_LIMIT)}
                    >
                      <div
                        className={`credit-progress-bar ${workload.level}`}
                        style={{
                          width: `${Math.min(100, (totalCredits / CREDIT_LIMIT) * 100)}%`,
                        }}
                      />
                    </div>

                    <p className="credit-description">
                      {totalCredits > CREDIT_LIMIT
                        ? `上限を${totalCredits - CREDIT_LIMIT}単位超えています。履修規定を確認してください。`
                        : workload.description}
                    </p>
                  </div>
                  <div className="timetable">
                    <div />
                    {DAYS.map((day) => (
                      <div className="day" key={day}>
                        {day}
                      </div>
                    ))}

                    {TIMETABLE_ROWS.map((row, rowIndex) => (
                      <div className="timetable-row" key={row.label}>
                        <div className="period">
                          {row.label}
                          <small>
                            {row.start}
                            <br />
                            {row.end}
                          </small>
                        </div>

                        {DAYS.map((day, dayIndex) => {
                          const item =
                            row.periodIndex === null
                              ? undefined
                              : schedule.find(
                                  (entry) =>
                                    entry.day === dayIndex &&
                                    entry.period === row.periodIndex,
                                );

                          const course = item
                            ? getTimetableCourse(item.code)
                            : undefined;
                          const plannedEvent = events.find(
                            (entry) =>
                              entry.day === dayIndex &&
                              entry.rowIndex === rowIndex,
                          );
                          const plannedBlock = plannedEvent
                            ? customBlocks.find((block) => block.id === plannedEvent.blockId)
                            : undefined;

                          return (
                            <div
                              className={`slot${dragging ? " slot-ready" : ""}`}
                              key={`${day}-${row.label}`}
                              onDragOver={(event) =>
                                event.preventDefault()
                              }
                              onDrop={(event) => onDrop(event, dayIndex, rowIndex)}
                              onClick={() => {
                                if (pendingCustomBlockId) {
                                  addEvent(pendingCustomBlockId, dayIndex, rowIndex);
                                } else if (pendingCode) {
                                  if (row.periodIndex === null) {
                                    notify("休み時間には授業ではなく予定を配置してください");
                                  } else {
                                    placeCourse(pendingCode, dayIndex, row.periodIndex);
                                  }
                                }
                              }}
                            >
                              {item && course ? (
                                <div
                                  className="course-block"
                                  data-tour="course-block"
                                  draggable
                                  style={{
                                    background: course.color,
                                    color: course.textColor,
                                  }}

                                  onContextMenu={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();

                                    removeCourse(item.id);
                                  }}

                                  onDragStart={(event) => {
                                    event.dataTransfer.effectAllowed = "move";
                                    event.dataTransfer.setData("text/plain", item.id);
                                    setDragging({
                                      code: item.code,
                                      id: item.id,
                                    });
                                  }}
                                  onDragEnd={() => setDragging(null)}
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <strong>{course.name}</strong>
                                  <small>
                                    {DAYS[item.day]}曜日 · {PERIODS[item.period]}
                                  </small>

                                </div>
                              ) : plannedEvent && plannedBlock ? (
                                <div
                                  className="course-block event-block"
                                  draggable
                                  style={{
                                    background: plannedBlock.color,
                                    color: "#ffffff",
                                  }}


                                  onContextMenu={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();

                                    if (
                                      window.confirm(
                                        `「${plannedBlock.title}」を削除しますか？`,
                                      )
                                    ) {
                                      removeEvent(plannedEvent.id);
                                    }
                                  }}

                                  onDragStart={(event) => {
                                    event.dataTransfer.effectAllowed = "move";
                                    event.dataTransfer.setData("text/plain", plannedEvent.id);
                                    setDragging({
                                      code: "",
                                      id: plannedEvent.id,
                                      kind: "event",
                                    });
                                  }}
                                  onDragEnd={() => setDragging(null)}
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <strong>{plannedBlock.title}</strong>
                                  {plannedBlock.memo ? (
                                    <small className="event-memo">{plannedBlock.memo}</small>
                                  ) : (
                                    <small>予定</small>
                                  )}
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
                <h2>科目・予定ブロック</h2>
                <span className="small-muted">
                  ドラッグ、または選択して配置先をクリック
                </span>

                <div className="course-list">
                  {selectableCourses.length === 0 ? (
                    <p className="small-muted">
                      選択した学年・学期の科目はありません。
                    </p>
                  ) : (
                    selectableCourses.map((course) => {
                      const reviewCourse = reviewCourses.find(
                        (item) => item.name === course.course_name,
                      );

                      const courseCode = reviewCourse?.code ??
                      `catalog:${course.id}`;
                      const courseName = course.course_name;

                      return (
                        <button
                          key={course.id}
                          data-tour="course-choice"
                          className={`course-choice${
                            pendingCode === courseCode ? " selected" : ""
                          }`}
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.effectAllowed = "copy";
                            event.dataTransfer.setData("text/plain", courseCode);
                            setPendingCode(null);
                            setPendingCustomBlockId(null);
                            setDragging({ code: courseCode });
                          }}
                          onDragEnd={() => setDragging(null)}
                          onClick={() => {
                            setPendingCode(courseCode);
                            setPendingCustomBlockId(null);
                            notify(
                              `${courseName}：配置先の曜日・時限をクリックしてください`,
                            );
                          }}
                        >
                          <span
                            className="swatch"
                            style={{
                              background: reviewCourse?.color ?? "#64748b",
                            }}
                          />
                          <span>
                            <strong>{courseName}</strong>
                            <small>
                              {reviewCourse ? (
                                <>
                                  {reviewCourse.rating.toFixed(1)} ★ ·{" "}
                                  {reviewCourse.reviews.length}件
                                </>
                              ) : (
                                "口コミはまだありません"
                              )}
                            </small>
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="custom-event-section">
                  <div className="custom-event-heading">
                    <h3>自分の予定</h3>
                    <button
                      type="button"
                      className="action secondary"
                      onClick={() => setShowEventForm((current) => !current)}
                    >
                      {showEventForm ? "閉じる" : "＋ 予定を追加"}
                    </button>
                  </div>

                  {showEventForm && (
                    <div className="custom-event-form">
                      <label>
                        予定名
                        <input
                          type="text"
                          value={eventTitle}
                          maxLength={60}
                          placeholder="例：サークル、アルバイト"
                          onChange={(event) => setEventTitle(event.target.value)}
                        />
                      </label>

                      <label>
                        メモ（任意）
                        <textarea
                          value={eventMemo}
                          maxLength={200}
                          rows={3}
                          placeholder="場所、持ち物、簡単なメモなど"
                          onChange={(event) => setEventMemo(event.target.value)}
                        />
                      </label>

                      <label>
                        ブロックの色
                        <input
                          className="custom-event-color"
                          type="color"
                          value={eventColor}
                          onChange={(event) => setEventColor(event.target.value)}
                        />
                      </label>

                      <button
                        type="button"
                        className="action primary"
                        onClick={addCustomBlock}
                      >
                        予定を登録
                      </button>
                    </div>
                  )}

                  {customBlocks.length === 0 ? (
                    <p className="small-muted custom-event-empty">
                      サークルやバイトなど、自分の予定を登録できます。
                    </p>
                  ) : (
                    <div className="course-list custom-event-list">
                      {customBlocks.map((block) => (
                        <div
                          key={block.id}
                          className={`course-choice custom-event-choice${
                            pendingCustomBlockId === block.id ? " selected" : ""
                          }`}
                          draggable
                          role="button"
                          tabIndex={0}
                          onDragStart={(event) => {
                            event.dataTransfer.effectAllowed = "copy";
                            event.dataTransfer.setData("text/plain", block.id);
                            setPendingCode(null);
                            setPendingCustomBlockId(null);
                            setDragging({
                              code: "",
                              kind: "custom",
                              blockId: block.id,
                            });
                          }}
                          onDragEnd={() => setDragging(null)}
                          onClick={() => {
                            setPendingCode(null);
                            setPendingCustomBlockId(block.id);
                            notify(
                              `${block.title}：配置先の曜日・時限をクリックしてください`,
                            );
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setPendingCode(null);
                              setPendingCustomBlockId(block.id);
                              notify(
                                `${block.title}：配置先の曜日・時限をクリックしてください`,
                              );
                            }
                          }}
                        >
                          <span
                            className="swatch"
                            style={{ background: block.color }}
                          />

                          <span className="custom-event-text">
                            <strong>{block.title}</strong>
                            <small>{block.memo || "メモなし"}</small>
                          </span>

                          <button
                            type="button"
                            className="custom-event-delete"
                            aria-label={`${block.title}の定義を削除`}
                            title="予定の定義を削除"
                            draggable={false}
                            onClick={(event) => {
                              event.stopPropagation();
                              removeCustomBlock(block.id);
                            }}
                            onDragStart={(event) => event.preventDefault()}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="hint">
                  ✦ ブロックは曜日・時限のマスにスナップします。
                  配置後もドラッグして移動できます。
                  昼休みには自作予定を配置できます。
                </div>
              </aside>
            </div>



            <h2 className="section-title">口コミを見ながら選ぶ</h2>
            <div className="course-catalog">
              {selectableCourses
                .map((course) =>
                  reviewCourses.find(
                    (review) => review.name === course.course_name,
                  ),
                )
                .filter((course) => course !== undefined)
                .slice(0, 3)
                .map((course) => (
                  <ReviewCard key={course.code} code={course.code} />
                ))}
            </div>
          </section>
          ) : page === "courses" ? (
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
                {visibleReviewCourses.length}科目 · {visibleReviewCount}件の口コミ
              </span>
            </div>

            <div className="course-catalog">
              {visibleReviewCourses.map((course) => (
                <ReviewCard
                  key={course.code}
                  code={course.code}
                />
              ))}
            </div>
            </section>
            ) : page === "calccalc" ? (
              <CreditSimulator onBackAction={() => setPage("timetable")} />
            ) : (
              <section id="courses">
                {/* 既存の口コミページの内容 */}
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

      <TimetableTutorial
        open={tutorialOpen}
        onOpenChange={setTutorialOpen}
        onStart={() => setPage("timetable")}
      />
    </div>
  );
}

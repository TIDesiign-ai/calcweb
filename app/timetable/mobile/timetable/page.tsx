  "use client";

  import { useCallback, useEffect, useMemo, useRef, useState } from "react";
  import { useRouter } from "next/navigation";

  import TimetableSettingsModal from "../../../../components/TimetableSettingsModal";
  import homeStyles from "../../../home.module.css";

  import {
    getSelectableCourses,
    type Semester,
  } from "../../../../data/lib/course-selector";
  import { courses as reviewCourses } from "../../../../data/lib/reviews";
  import { courses as catalogCourses } from "../../../../data/lib/courses";
  import styles from "./timetable.module.css";

  type ScheduleItem = {
    id: string;
    code: string;
    day: number;
    period: number;
  };

  type CourseOption = {
    id: string;
    code: string;
    name: string;
    color: string;
    textColor: string;
  };

  type DragState =
    | {
        kind: "new";
        code: string;
        name: string;
        color: string;
        textColor: string;
        x: number;
        y: number;
      }
    | {
        kind: "existing";
        id: string;
        code: string;
        name: string;
        color: string;
        textColor: string;
        x: number;
        y: number;
      };
  const SCHEDULE_KEY = "course-nav-schedule";
  const TRASH_WIDTH = 24;
  const SWIPE_THRESHOLD = 5;
  const DAYS = ["月", "火", "水", "木", "金"];
  const PERIODS = [
    { label: "1限", time: "9:10" },
    { label: "2限", time: "11:00" },
    { label: "3限", time: "13:40" },
    { label: "4限", time: "15:30" },
    { label: "5限", time: "17:20" },
];



  function makeId() {
    return `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;
  }

  function getCourseInfo(code: string) {
    const review = reviewCourses.find((item) => item.code === code);

    if (review) {
      return {
        name: review.name,
        color: review.color,
        textColor: review.textColor,
      };
    }

    const catalogId = code.startsWith("catalog:")
      ? code.slice("catalog:".length)
      : code;

    const catalog = catalogCourses.find((item) => item.id === catalogId);

    if (!catalog) return undefined;

    return {
      name: catalog.course_name,
      color: "#64748b",
      textColor: "#ffffff",
    };
  }

  function loadSchedule(): ScheduleItem[] {
    try {
      const saved = localStorage.getItem(SCHEDULE_KEY);
      if (!saved) return [];

      const parsed: unknown = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];

      return parsed.filter(
        (item): item is ScheduleItem =>
          item !== null &&
          typeof item === "object" &&
          typeof item.id === "string" &&
          typeof item.code === "string" &&
          Number.isInteger(item.day) &&
          item.day >= 0 &&
          item.day < 5 &&
          Number.isInteger(item.period) &&
          item.period >= 0 &&
          item.period < 5,
      );
    } catch {
      return [];
    }
  }

  export default function MobileTimetablePage() {
    const router = useRouter();
    const gridRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<DragState | null>(null);
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);
    const movedRef = useRef(false);

    const drawerRef = useRef<HTMLElement | null>(null);

    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [grade, setGrade] = useState("1");
    const [semester, setSemester] = useState<Semester>("前期");
    const [drag, setDrag] = useState<DragState | null>(null);
    const [message, setMessage] = useState("");
    const [trashActive, setTrashActive] = useState(false);
    const [gradeSettingsOpen, setGradeSettingsOpen] = useState(false);
    const [course, setCourse] = useState("SEコース");





    useEffect(() => {
      setSchedule(loadSchedule());

      const savedGrade = localStorage.getItem("selectedGrade");
      const savedSemester = localStorage.getItem("selectedSemester");
      const savedCourse = localStorage.getItem("selectedCourse");

      if (savedGrade && ["1", "2", "3", "4"].includes(savedGrade)) {
        setGrade(savedGrade);
      }

      if (savedSemester === "前期" || savedSemester === "後期") {
        setSemester(savedSemester);
      }
      const validCourses = [
          "SEコース",
          "IoTコース",
          "DSコース",
          "CSコース",
          "CGコース",
          "DEコース",
        ];

        if (savedCourse && validCourses.includes(savedCourse)) {
          setCourse(savedCourse);
        }


      setLoaded(true);

      const syncSchedule = (event: StorageEvent) => {
        if (event.key === SCHEDULE_KEY) {
          setSchedule(loadSchedule());
        }

        if (event.key === "selectedGrade" && event.newValue) {
          setGrade(event.newValue);
        }

        if (
          event.key === "selectedSemester" &&
          (event.newValue === "前期" || event.newValue === "後期")
        ) {
          setSemester(event.newValue);
        }
      };

      window.addEventListener("storage", syncSchedule);
      return () => window.removeEventListener("storage", syncSchedule);
    }, []);

    useEffect(() => {
      if (!loaded) return;

      localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
    }, [schedule, loaded]);

    useEffect(() => {
      if (!message) return;

      const timeout = window.setTimeout(() => setMessage(""), 1800);
      return () => window.clearTimeout(timeout);
    }, [message]);

    const availableCourses = useMemo(() => {
      return getSelectableCourses(Number(grade) as 1 | 2 | 3 | 4, semester)
        .map((course) => {
          const review = reviewCourses.find(
            (item) => item.name === course.course_name,
          );

          const code = review?.code ?? `catalog:${course.id}`;
          const info = getCourseInfo(code);

          return {
            id: course.id,
            code,
            name: course.course_name,
            color: info?.color ?? "#64748b",
            textColor: info?.textColor ?? "#ffffff",
          } satisfies CourseOption;
        })
        .filter(
          (course, index, all) =>
            all.findIndex((item) => item.code === course.code) === index,
        );
    }, [grade, semester]);

    const filteredCourses = useMemo(() => {
      const query = search.trim().toLocaleLowerCase();

      if (!query) return availableCourses;

      return availableCourses.filter((course) =>
        course.name.toLocaleLowerCase().includes(query),
      );
    }, [availableCourses, search]);

    const notify = useCallback((text: string) => {
      setMessage(text);
    }, []);

    const saveGradeSettings = ({
      grade: nextGrade,
      semester: nextSemester,
      course: nextCourse,
    }: {
      grade: string;
      semester: string;
      course: string;
    }) => {
      localStorage.setItem("selectedGrade", nextGrade);
      localStorage.setItem("selectedSemester", nextSemester);
      localStorage.setItem("selectedCourse", nextCourse);

      setGrade(nextGrade);
      setSemester(nextSemester as Semester);
      setCourse(nextCourse);

      setGradeSettingsOpen(false);
      setSearch("");

      notify(`${nextGrade}年・${nextSemester}に変更しました`);
    };

    const beginDrag = (
      item: Omit<Extract<DragState, { kind: "new" }>, "x" | "y">,
      x: number,
      y: number,
    ) => {
      const next: DragState = { ...item, x, y };
      dragRef.current = next;
      movedRef.current = false;
      setDrag(next);
    };

    const beginExistingDrag = (
      item: ScheduleItem,
      x: number,
      y: number,
    ) => {
      const info = getCourseInfo(item.code);
      if (!info) return;

      const next: DragState = {
        kind: "existing",
        id: item.id,
        code: item.code,
        name: info.name,
        color: info.color,
        textColor: info.textColor,
        x,
        y,
      };

      dragRef.current = next;
      movedRef.current = false;
      setDrag(next);
    };

    useEffect(() => {
      if (!drag) return;

      const onMove = (event: PointerEvent) => {
        const current = dragRef.current;
        if (!current) return;

        movedRef.current = true;

        const next = {
          ...current,
          x: event.clientX,
          y: event.clientY,
        };

        dragRef.current = next;
        setDrag(next);

        // 新しい科目をメニューの外へ出したら自動で閉じる
        if (next.kind === "new" && drawerOpen) {
          const drawerRect = drawerRef.current?.getBoundingClientRect();

          if (drawerRect && event.clientX < drawerRect.left) {
            setDrawerOpen(false);
          }
        }

        // 既存ブロックを削除エリアに持っていったら強調表示
        setTrashActive(
          next.kind === "existing" &&
            event.clientX >= window.innerWidth - TRASH_WIDTH,
        );
      };


      const onUp = (event: PointerEvent) => {
        const current = dragRef.current;
        if (!current) return;

        const x = event.clientX;
        const y = event.clientY;

        if (
          current.kind === "existing" &&
          x >= window.innerWidth - TRASH_WIDTH
        ) {
          setSchedule((items) =>
            items.filter((item) => item.id !== current.id),
          );
          notify(`${current.name} を削除しました`);
        } else {
          const grid = gridRef.current;
          const rect = grid?.getBoundingClientRect();

          if (rect && x >= rect.left && x <= rect.right &&
            y >= rect.top && y <= rect.bottom) {
            const headerHeight = 34;
            const relativeX = x - rect.left;
            const relativeY = y - rect.top;

            const columnWidth = rect.width / 6;
            const column = Math.floor(relativeX / columnWidth);
            const periodHeight = (rect.height - headerHeight) / 5;
            const period = Math.floor(
              (relativeY - headerHeight) / periodHeight,
            );
            const day = column - 1;

            if (
              day >= 0 &&
              day < 5 &&
              period >= 0 &&
              period < 5
            ) {
              setSchedule((items) => {
                const existing = items.find(
                  (item) =>
                    item.day === day &&
                    item.period === period &&
                    item.id !==
                      (current.kind === "existing" ? current.id : ""),
                );

                if (existing) {
                  notify("そのコマにはすでに科目があります");
                  return items;
                }

                if (current.kind === "existing") {
                  notify(`${current.name} を移動しました`);

                  return items.map((item) =>
                    item.id === current.id
                      ? { ...item, day, period }
                      : item,
                  );
                }

                notify(`${current.name} を配置しました`);

                return [
                  ...items,
                  {
                    id: makeId(),
                    code: current.code,
                    day,
                    period,
                  },
                ];
              });

              if (current.kind === "new") {
                setDrawerOpen(false);
                setSearch("");
              }
            }
          }
        }

        dragRef.current = null;
        setDrag(null);
        setTrashActive(false);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);

      return () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };
    }, [drag, drawerOpen, notify]);






    if (!loaded) return null;

    return (
      <main
        className={styles.app}
      >
        <header className={styles.header}>
          <button
            type="button"
            className={styles.back}
            onClick={() => {
              router.push("/timetable/mobile");
            }}
            aria-label="通常の時間割へ戻る"
          >
            ‹
          </button>

          <div className={styles.heading}>
            <strong>マイ時間割</strong>
            <span>{grade}年 · {semester}</span>
          </div>
          <button className="button buttonPrimary"

            onClick={() => setGradeSettingsOpen(true)}
          >
            学年・学期変更
          </button>

          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setDrawerOpen(true)}
          >
            科目 ＋
          </button>
        </header>
        <div className={styles.timetableLayout}>
          <div className={styles.grid} ref={gridRef}>
            <div className={styles.corner}>時限</div>

            {DAYS.map((day) => (
              <div className={styles.day} key={day}>
                {day}
              </div>
            ))}

            {PERIODS.map((period, periodIndex) => (
              <div className={styles.row} key={period.label}>
                <div className={styles.period}>
                  <strong>{period.label}</strong>
                  <small>{period.time}</small>
                </div>

                {DAYS.map((day, dayIndex) => {
                  const item = schedule.find(
                    (entry) =>
                      entry.day === dayIndex &&
                      entry.period === periodIndex,
                  );

                  const info = item ? getCourseInfo(item.code) : undefined;
                  const isDragging = item && drag?.kind === "existing" &&
                    drag.id === item.id;

                  return (
                    <div className={styles.slot} key={`${day}-${period.label}`}>
                      {item && info && (
                        <button
                          type="button"
                          className={`${styles.courseBlock} ${
                            isDragging ? styles.dragging : ""
                          }`}
                          style={{
                            background: info.color,
                            color: info.textColor,
                          }}
                          onPointerDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            beginExistingDrag(item, event.clientX, event.clientY);
                          }}
                          onClick={(event) => {
                            if (movedRef.current) {
                              event.preventDefault();
                              event.stopPropagation();
                            }
                          }}
                          aria-label={`${info.name}。ドラッグして移動、右端へドラッグして削除`}
                        >
                          {info.name}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          </div>

        <div className={styles.hint}>
          {drawerOpen
            ? "科目を時間割へドラッグして配置"
            : "右端から左へスワイプして科目を追加"}
        </div>

        <button
          type="button"
          className={`${styles.trashZone} ${
            trashActive ? styles.trashActive : ""
          } ${drag?.kind === "existing" ? styles.trashVisible : ""}`}
          aria-label="ここにドロップして科目を削除"
          onPointerUp={() => {
            const current = dragRef.current;

            if (current?.kind === "existing") {
              setSchedule((items) =>
                items.filter((item) => item.id !== current.id),
              );
              notify(`${current.name} を削除しました`);
              dragRef.current = null;
              setDrag(null);
              setTrashActive(false);
            }
          }}
        >
          <span>🗑</span>
          <small>ここへ移動して削除</small>
        </button>

        <div
          className={`${styles.drawerBackdrop} ${
            drawerOpen ? styles.backdropOpen : ""
          }`}
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />

        <aside
          ref={drawerRef}
          className={`${styles.drawer} ${
            drawerOpen ? styles.drawerOpen : ""
          }`}
          aria-label="科目メニュー"
          aria-hidden={!drawerOpen}

        >
          <div className={styles.drawerHeader}>
            <div>
              <strong>科目を選ぶ</strong>
              <span>{filteredCourses.length} 科目</span>
            </div>

            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="科目メニューを閉じる"
            >
              ×
            </button>
          </div>

          <label className={styles.searchBox}>
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="科目名で検索"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <div className={styles.courseList}>
            {filteredCourses.length === 0 ? (
              <p className={styles.empty}>該当する科目がありません。</p>
            ) : (
              filteredCourses.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  className={styles.courseOption}
                  style={{
                    borderLeftColor: course.color,
                  }}
                  onPointerDown={(event) => {
                    event.preventDefault();

                    beginDrag(
                      {
                        kind: "new",
                        code: course.code,
                        name: course.name,
                        color: course.color,
                        textColor: course.textColor,
                      },
                      event.clientX,
                      event.clientY,
                    );
                  }}
                >
                  <strong>{course.name}</strong>
                  <span>ドラッグして配置 ↙</span>
                </button>
              ))
            )}
          </div>

          <p className={styles.drawerTip}>
            科目を長押しして、置きたいコマまで動かしてください。
          </p>
        </aside>

        {drag && (
          <div
            className={styles.dragPreview}
            style={{
              left: drag.x,
              top: drag.y,
              background: drag.color,
              color: drag.textColor,
            }}
          >
            {drag.name}
          </div>
        )}

        {message && (
          <div className={styles.toast} role="status">
            {message}
          </div>
        )}
        <TimetableSettingsModal
          open={gradeSettingsOpen}
          onClose={() => setGradeSettingsOpen(false)}
          onSave={saveGradeSettings}
          styles={homeStyles}
          initialGrade={grade}
          initialSemester={semester}
          initialCourse={course}
          submitLabel="変更を保存"
        />
      </main>
    );
  }

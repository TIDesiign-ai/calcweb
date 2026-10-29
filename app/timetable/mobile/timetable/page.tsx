  "use client";

  import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
  import { useRouter } from "next/navigation";

  import TimetableSettingsModal from "../../../../components/TimetableSettingsModal";
  import homeStyles from "../../../home.module.css";
  const THEME_KEY = "course-nav-theme";

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
    tag: string;
  };

  type ScheduleEvent = {
    id: string;
    title: string;
    day: number;
    period: number;
    color: string;
    memo: string;
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
      }
    | {
        kind: "event";
        id: string;
        name: string;
        color: string;
        textColor: string;
        x: number;
        y: number;
      };
  const SCHEDULE_KEY = "course-nav-schedule";
  const EVENTS_KEY = "course-nav-events";
  const TRASH_WIDTH = 24;
  const SWIPE_THRESHOLD = 5;
  const DAYS = ["月", "火", "水", "木", "金"];
  const PERIODS = [
    { label: "1限", time: "9:10 ~ 10:50" },
    { label: "2限", time: "11:00 ~ 12:40" },
    { label: "3限", time: "13:40 ~ 15:20" },
    { label: "4限", time: "15:30 ~ 17:10" },
    { label: "5限", time: "17:20 ~ 19:00" },
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

  function loadEvents(): ScheduleEvent[] {
    try {
      const saved = localStorage.getItem(EVENTS_KEY);
      if (!saved) return [];

      const parsed: unknown = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];

      return parsed.filter(
        (item): item is ScheduleEvent =>
          item !== null &&
          typeof item === "object" &&
          typeof item.id === "string" &&
          typeof item.title === "string" &&
          Number.isInteger(item.day) &&
          item.day >= 0 &&
          item.day < 5 &&
          Number.isInteger(item.period) &&
          item.period >= 0 &&
          item.period < 5 &&
          typeof item.color === "string" &&
          typeof item.memo === "string",
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
    const [events, setEvents] = useState<ScheduleEvent[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [eventModalOpen, setEventModalOpen] = useState(false);
    const [eventTitle, setEventTitle] = useState("");
    const [eventDay, setEventDay] = useState("0");
    const [eventPeriod, setEventPeriod] = useState("0");
    const [eventColor, setEventColor] = useState("#ff4d8d");
    const [eventMemo, setEventMemo] = useState("");
    const [search, setSearch] = useState("")
    const [grade, setGrade] = useState("1");
    const [semester, setSemester] = useState<Semester>("前期");
    const [drag, setDrag] = useState<DragState | null>(null);
    const [message, setMessage] = useState("");
    const [trashActive, setTrashActive] = useState(false);
    const [gradeSettingsOpen, setGradeSettingsOpen] = useState(false);
    const [theme, setTheme] = useState<"light" | "dark">("light");

    useEffect(() => {
      const syncTheme = () => {
        const currentTheme = document.documentElement.dataset.theme;

        if (currentTheme === "light" || currentTheme === "dark") {
          setTheme(currentTheme);
          return;
        }

        const savedTheme = localStorage.getItem(THEME_KEY);

        if (savedTheme === "light" || savedTheme === "dark") {
          setTheme(savedTheme);
        }
      };

      syncTheme();

      // メイン画面側で html の data-theme が変更されたら同期
      const observer = new MutationObserver(syncTheme);

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });

      // localStorage の変更も監視（別タブなど）
      window.addEventListener("storage", syncTheme);

      return () => {
        observer.disconnect();
        window.removeEventListener("storage", syncTheme);
      };
    }, []);
    const [course, setCourse] = useState("SEコース");
    const [selectedTag, setSelectedTag] = useState("すべて");




    useEffect(() => {
      setSchedule(loadSchedule());
      setEvents(loadEvents());

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

        if (event.key === EVENTS_KEY) {
          setEvents(loadEvents());
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
      if (!loaded) return;

      localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    }, [events, loaded]);

    useEffect(() => {
      if (!message) return;

      const timeout = window.setTimeout(() => setMessage(""), 1800);
      return () => window.clearTimeout(timeout);
    }, [message]);


    const availableCourses = useMemo(() => {
      return getSelectableCourses(
        Number(grade) as 1 | 2 | 3 | 4,
        semester
      )
        .map((item) => {
          const review = reviewCourses.find(
            (review) => review.name === item.course_name
          );

          const code = review?.code ?? `catalog:${item.id}`;
          const info = getCourseInfo(code);

          return {
            id: item.id,
            code,
            name: item.course_name,
            color: info?.color ?? "#64748b",
            textColor: info?.textColor ?? "#ffffff",
            tag: item.course_category?.trim() || "未分類",
          } satisfies CourseOption;
        })
        .filter(
          (course, index, all) =>
            all.findIndex((item) => item.code === course.code) === index
        );
    }, [grade, semester]);

    const availableTags = useMemo(() => {
      return [
        "すべて",
        ...Array.from(
          new Set(availableCourses.map((course) => course.tag))
        ),
      ];
    }, [availableCourses]);

    const filteredCourses = useMemo(() => {
      if (selectedTag === "すべて") {
        return availableCourses;
      }

      return availableCourses.filter(
        (course) => course.tag === selectedTag
      );
    }, [availableCourses, selectedTag]);

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

    const createEvent = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const title = eventTitle.trim();
      if (!title) {
        notify("予定名を入力してください");
        return;
      }

      const nextEvent: ScheduleEvent = {
        id: makeId(),
        title,
        day: Number(eventDay),
        period: Number(eventPeriod),
        color: eventColor,
        memo: eventMemo.trim(),
      };

      setEvents((items) => [...items, nextEvent]);
      setEventTitle("");
      setEventMemo("");
      setEventModalOpen(false);
      notify(`${title} を予定に追加しました`);
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

    const beginEventDrag = (
      item: ScheduleEvent,
      x: number,
      y: number,
    ) => {
      const next: DragState = {
        kind: "event",
        id: item.id,
        name: item.title,
        color: item.color,
        textColor: "#ffffff",
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

        // 授業または予定を削除エリアに持っていったら強調表示
        setTrashActive(
          (next.kind === "existing" || next.kind === "event") &&
            event.clientX >= window.innerWidth - TRASH_WIDTH,
        );
      };

      const onUp = (event: PointerEvent) => {
        const current = dragRef.current;
        if (!current) return;

        const x = event.clientX;
        const y = event.clientY;
        const canDelete = current.kind === "existing" || current.kind === "event";

        if (canDelete && x >= window.innerWidth - TRASH_WIDTH) {
          if (current.kind === "event") {
            setEvents((items) => items.filter((item) => item.id !== current.id));
          } else {
            setSchedule((items) => items.filter((item) => item.id !== current.id));
          }
          notify(`${current.name} を削除しました`);
        } else {
          const grid = gridRef.current;
          const rect = grid?.getBoundingClientRect();

          if (
            rect &&
            x >= rect.left && x <= rect.right &&
            y >= rect.top && y <= rect.bottom
          ) {
            const headerHeight = 34;
            const relativeX = x - rect.left;
            const relativeY = y - rect.top;
            const columnWidth = rect.width / 6;
            const column = Math.floor(relativeX / columnWidth);
            const periodHeight = (rect.height - headerHeight) / 5;
            const period = Math.floor((relativeY - headerHeight) / periodHeight);
            const day = column - 1;

            if (day >= 0 && day < 5 && period >= 0 && period < 5) {
              if (current.kind === "event") {
                setEvents((items) =>
                  items.map((item) =>
                    item.id === current.id ? { ...item, day, period } : item,
                  ),
                );
                if (movedRef.current) {
                  notify(`${current.name} を移動しました`);
                }
              } else {
                setSchedule((items) => {
                  const existing = items.find(
                    (item) =>
                      item.day === day &&
                      item.period === period &&
                      item.id !== (current.kind === "existing" ? current.id : ""),
                  );

                  if (existing) {
                    notify("そのコマにはすでに科目があります");
                    return items;
                  }

                  if (current.kind === "existing") {
                    notify(`${current.name} を移動しました`);
                    return items.map((item) =>
                      item.id === current.id ? { ...item, day, period } : item,
                    );
                  }

                  notify(`${current.name} を配置しました`);
                  return [...items, { id: makeId(), code: current.code, day, period }];
                });

                if (current.kind === "new") {
                  setDrawerOpen(false);
                  setSearch("");
                }
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
        data-theme={theme}
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

        <button
          type="button"
          className={styles.eventFab}
          onClick={() => setEventModalOpen(true)}
          aria-label="予定を作成する"
        >
          <span aria-hidden="true">＋</span>
          予定作成
        </button>

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
                  const eventItems = events.filter(
                    (entry) =>
                      entry.day === dayIndex &&
                      entry.period === periodIndex,
                  );
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
                      {eventItems.map((eventItem) => (
                        <button
                          key={eventItem.id}
                          type="button"
                          className={`${styles.eventBlock} ${
                            drag?.kind === "event" && drag.id === eventItem.id
                              ? styles.dragging
                              : ""
                          }`}
                          style={{ background: eventItem.color, touchAction: "none" }}
                          title={eventItem.memo || eventItem.title}
                          onPointerDown={(pointerEvent) => {
                            pointerEvent.preventDefault();
                            pointerEvent.stopPropagation();
                            beginEventDrag(eventItem, pointerEvent.clientX, pointerEvent.clientY);
                          }}
                          onClick={(clickEvent) => {
                            if (movedRef.current) {
                              clickEvent.preventDefault();
                              clickEvent.stopPropagation();
                              return;
                            }
                            if (window.confirm(`「${eventItem.title}」を削除しますか？`)) {
                              setEvents((items) =>
                                items.filter((entry) => entry.id !== eventItem.id),
                              );
                              notify(`${eventItem.title} を削除しました`);
                            }
                          }}
                          aria-label={`${eventItem.title}。ドラッグして移動、右端へドラッグして削除。クリックして削除`}
                        >
                          <span className={styles.eventLabel}>予定</span>
                          <strong>{eventItem.title}</strong>
                        </button>
                      ))}
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
          } ${(drag?.kind === "existing" || drag?.kind === "event") ? styles.trashVisible : ""}`}
          aria-label="ここにドロップして授業・予定を削除"
          onPointerUp={() => {
            const current = dragRef.current;

            if (current?.kind === "existing" || current?.kind === "event") {
              if (current.kind === "event") {
                setEvents((items) => items.filter((item) => item.id !== current.id));
              } else {
                setSchedule((items) => items.filter((item) => item.id !== current.id));
              }
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

          <div className={styles.tagFilters}>
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={
                  selectedTag === tag
                    ? styles.tagActive
                    : styles.tagButton
                }
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

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
        {eventModalOpen && (
          <div
            className={styles.eventBackdrop}
            onClick={() => setEventModalOpen(false)}
          >
            <section
              className={styles.eventModal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="event-modal-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.eventModalHeader}>
                <h2 id="event-modal-title">予定を作成</h2>
                <button
                  type="button"
                  onClick={() => setEventModalOpen(false)}
                  aria-label="予定作成画面を閉じる"
                >
                  ×
                </button>
              </div>

              <form className={styles.eventForm} onSubmit={createEvent}>
                <label>
                  予定名
                  <input
                    autoFocus
                    value={eventTitle}
                    onChange={(event) => setEventTitle(event.target.value)}
                    placeholder="例：課題の提出"
                    maxLength={60}
                    required
                  />
                </label>

                <div className={styles.eventFormRow}>
                  <label>
                    曜日
                    <select
                      value={eventDay}
                      onChange={(event) => setEventDay(event.target.value)}
                    >
                      {DAYS.map((day, index) => (
                        <option key={day} value={index}>{day}曜日</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    時限
                    <select
                      value={eventPeriod}
                      onChange={(event) => setEventPeriod(event.target.value)}
                    >
                      {PERIODS.map((period, index) => (
                        <option key={period.label} value={index}>
                          {period.label}（{period.time}〜）
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label>
                  色
                  <select
                    value={eventColor}
                    onChange={(event) => setEventColor(event.target.value)}
                  >
                    <option value="#ff4d8d">ピンク</option>
                    <option value="#6478ff">ブルー</option>
                    <option value="#16a085">グリーン</option>
                    <option value="#e6a23c">オレンジ</option>
                    <option value="#8b5cf6">パープル</option>
                  </select>
                </label>

                <label>
                  メモ（任意）
                  <textarea
                    value={eventMemo}
                    onChange={(event) => setEventMemo(event.target.value)}
                    placeholder="持ち物や予定の詳細"
                    rows={3}
                    maxLength={300}
                  />
                </label>

                <button className={styles.eventSubmit} type="submit">
                  予定を登録する
                </button>
              </form>
            </section>
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

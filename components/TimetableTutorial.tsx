"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: () => void;
};

const steps = [
  {
    target: "timetable",
    title: "自分だけの時間割を作ろう！",
    description:
      "ここが時間割のメイン画面です。科目や自分の予定を曜日・時限ごとに整理できます。",
  },
  {
    target: "course-choice",
    title: "科目を選んで配置しよう",
    description:
      "右側の科目ブロックを選び、時間割の配置先をクリックするか、ドラッグ＆ドロップで配置できます。",
  },
  {
    target: "grade-selector",
    title: "学年・学期を切り替えよう",
    description:
      "学年や学期を切り替えて、履修する科目を確認しましょう。",
  },
  {
    target: "course-block",
    title: "配置した科目を調整しよう",
    description:
      "配置した科目はドラッグして移動できます。科目ブロックを右クリックすると削除できます。",
  },
  {
    target: "reviews",
    title: "口コミもチェックしよう",
    description:
      "科目の評価や先輩の口コミを見ながら、自分に合った履修計画を考えましょう。",
  },
] as const;

type TargetRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export default function TimetableTutorial({
  open,
  onOpenChange,
  onStart,
}: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const started = useRef(false);

  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      setStepIndex(0);
    }

    wasOpen.current = open;
  }, [open]);

  // 初回アクセス時だけ自動表示
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (localStorage.getItem("timetable-tutorial-completed") !== "true") {
      onStart();
      setStepIndex(0);
      onOpenChange(true);
    }
  }, [onOpenChange, onStart]);

  // 現在のステップの対象を強調表示
  useEffect(() => {
    if (!open) {
      setTargetRect(null);
      return;
    }



    const step = steps[stepIndex];
    const selector = `[data-tour="${step.target}"]`;
    let frame = 0;

    const measure = () => {
      const target =
        document.querySelector(selector) ??
        (step.target === "course-block"
          ? document.querySelector('[data-tour="timetable"]')
          : null);

      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      if (!target) {
        setTargetRect(null);
        return;
      }

      const rect = target.getBoundingClientRect();

      setTargetRect({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      });
    };

    const target = document.querySelector(selector);

    target?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });

    frame = window.requestAnimationFrame(measure);

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, stepIndex]);

  const finish = () => {
    localStorage.setItem("timetable-tutorial-completed", "true");
    onOpenChange(false);
  };

  if (!open) return null;

  const step = steps[stepIndex];
  const padding = 8;

  const hole = targetRect
    ? {
        x: Math.max(0, targetRect.left - padding),
        y: Math.max(0, targetRect.top - padding),
        width: Math.min(
          viewport.width,
          targetRect.width + padding * 2,
        ),
        height: Math.min(
          viewport.height,
          targetRect.height + padding * 2,
        ),
      }
    : null;

  return (
    <div className="tutorial-layer">
      <svg
        className="tutorial-spotlight"
        width="100%"
        height="100%"
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
        aria-hidden="true"
      >
        <defs>
          <mask id="tutorial-spotlight-mask">
            <rect
              width={viewport.width}
              height={viewport.height}
              fill="white"
            />
            {hole && (
              <rect
                x={hole.x}
                y={hole.y}
                width={hole.width}
                height={hole.height}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>

        <rect
          width={viewport.width}
          height={viewport.height}
          fill="rgba(12, 12, 18, 0.72)"
          mask="url(#tutorial-spotlight-mask)"
        />

        {hole && (
          <rect
            x={hole.x}
            y={hole.y}
            width={hole.width}
            height={hole.height}
            rx="12"
            fill="none"
            stroke="#ff4d8d"
            strokeWidth="3"
          />
        )}
      </svg>

      <section
        className="tutorial-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
      >
        <div className="tutorial-card-top">
          <span className="tutorial-label">履修ナビ GUIDE</span>
          <span className="tutorial-counter">
            {stepIndex + 1} / {steps.length}
          </span>
        </div>

        <div className="tutorial-progress" aria-hidden="true">
          {steps.map((item, index) => (
            <span
              key={item.target}
              className={
                index <= stepIndex
                  ? "tutorial-progress-item active"
                  : "tutorial-progress-item"
              }
            />
          ))}
        </div>

        <h2 id="tutorial-title">{step.title}</h2>
        <p>{step.description}</p>

        <div className="tutorial-actions">
          <button
            type="button"
            className="tutorial-skip"
            onClick={finish}
          >
            チュートリアルを終了
          </button>

          <div className="tutorial-navigation">
            {stepIndex > 0 && (
              <button
                type="button"
                className="tutorial-back"
                onClick={() => setStepIndex((index) => index - 1)}
              >
                戻る
              </button>
            )}

            {stepIndex < steps.length - 1 ? (
              <button
                type="button"
                className="tutorial-next"
                onClick={() => setStepIndex((index) => index + 1)}
              >
                次へ <span aria-hidden="true">→</span>
              </button>
            ) : (
              <button
                type="button"
                className="tutorial-next"
                onClick={finish}
              >
                はじめよう！ <span aria-hidden="true">✓</span>
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

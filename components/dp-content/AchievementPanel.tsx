"use client";

import { useEffect, useState } from "react";
import {
  achievements,
  getUnlockedAchievementIds,
} from "../../data/lib/dp-content/achievements"
import styles from "./AchievementPanel.module.css";

type Props = {
  onClose: () => void;
};

export default function AchievementPanel({ onClose }: Props) {
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");

  useEffect(() => {
    setUnlockedIds(getUnlockedAchievementIds());
  }, []);

  const unlockedCount = achievements.filter((achievement) =>
    unlockedIds.includes(achievement.id),
  ).length;

  const progress =
    achievements.length === 0
      ? 0
      : Math.round((unlockedCount / achievements.length) * 100);

  const visibleAchievements = achievements.filter((achievement) => {
    if (filter === "unlocked") return unlockedIds.includes(achievement.id);
    if (filter === "locked") return !unlockedIds.includes(achievement.id);
    return true;
  });

  return (
    <div className={styles.backdrop}>
      <section
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="achievement-title"
      >
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>YOUR COLLECTION</p>
            <h2 id="achievement-title">🏆 実績コレクション</h2>
            <p className={styles.subtitle}>
              履修ナビでのあなたの軌跡。
            </p>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="実績画面を閉じる"
          >
            ✕
          </button>
        </header>

        <div className={styles.progressSection}>
          <div className={styles.progressLabels}>
            <span>解除率</span>
            <strong>
              {unlockedCount} / {achievements.length}
            </strong>
          </div>

          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={styles.progressBar}
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className={styles.progressCaption}>
            {progress === 100
              ? "全実績解除！ もう履修ナビマスターだ。"
              : `実績の ${progress}% を解除済み`}
          </p>
        </div>

        <nav className={styles.filters} aria-label="実績の絞り込み">
          <button
            type="button"
            className={filter === "all" ? styles.activeFilter : ""}
            onClick={() => setFilter("all")}
          >
            すべて
          </button>
          <button
            type="button"
            className={filter === "unlocked" ? styles.activeFilter : ""}
            onClick={() => setFilter("unlocked")}
          >
            解除済み
          </button>
          <button
            type="button"
            className={filter === "locked" ? styles.activeFilter : ""}
            onClick={() => setFilter("locked")}
          >
            未解除
          </button>
        </nav>

        <div className={styles.grid}>
          {visibleAchievements.map((achievement) => {
            const unlocked = unlockedIds.includes(achievement.id);

            return (
              <article
                key={achievement.id}
                className={`${styles.card} ${
                  unlocked ? styles.unlocked : styles.locked
                }`}
              >
                <div className={styles.icon}>
                  {unlocked ? achievement.icon : "🔒"}
                </div>

                <div className={styles.cardContent}>
                  <div className={styles.cardHeading}>
                    <h3>{achievement.name}</h3>
                    <span
                      className={`${styles.rarity} ${styles[achievement.rarity]}`}
                    >
                      {achievement.rarity.toUpperCase()}
                    </span>
                  </div>

                  <p>{unlocked ? achievement.description : "？？？"}</p>

                  <span
                    className={
                      unlocked
                        ? styles.unlockedLabel
                        : styles.lockedLabel
                    }
                  >
                    {unlocked ? "✓ ACHIEVED" : "UNKNOWN404"}
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        {visibleAchievements.length === 0 && (
          <p className={styles.empty}>
            該当する実績はまだありません。
          </p>
        )}
      </section>
    </div>
  );
}

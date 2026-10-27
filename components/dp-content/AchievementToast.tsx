
"use client";

import { useEffect } from "react";
import type { Achievement } from "../../data/lib/dp-content/achievements";
import styles from "./AchievementToast.module.css";

type Props = {
  achievements: Achievement[];
  onClose: () => void;
};

export default function AchievementToast({
  achievements,
  onClose,
}: Props) {
  useEffect(() => {
    if (achievements.length === 0) return;

    const timer = window.setTimeout(onClose, 4500);
    return () => window.clearTimeout(timer);
  }, [achievements, onClose]);

  if (achievements.length === 0) return null;

  return (
    <div className={styles.container} role="status" aria-live="polite">
      {achievements.map((achievement) => (
        <div key={achievement.id} className={styles.toast}>
          <div className={styles.icon}>{achievement.icon}</div>
          <div className={styles.content}>
            <div className={styles.eyebrow}>🏆 ACHIEVEMENT UNLOCKED</div>
            <div className={styles.name}>{achievement.name}</div>
            <div className={styles.description}>
              {achievement.description}
            </div>
          </div>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="通知を閉じる"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

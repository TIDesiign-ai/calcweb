import achievementData from "./achievements.json";

export type AchievementTrigger =
  | "attempt_over_limit"
  | "register_under_recommended"
  | "first_course_added"
  | "full_credits"
  | "fifth_period"
  | "full_day_off";

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  trigger: AchievementTrigger;
};

const STORAGE_KEY = "course-nav-achievements";

export const achievements: Achievement[] =
  achievementData as Achievement[];

/** 保存済みの実績 ID 一覧を取得 */
export function getUnlockedAchievementIds(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    // JSON に存在する実績 ID だけを有効とする
    const validIds = new Set(achievements.map((item) => item.id));

    return [...new Set(
      parsed.filter(
        (id): id is string =>
          typeof id === "string" && validIds.has(id),
      ),
    )];
  } catch {
    return [];
  }
}

/** 実績を解除。新規解除なら true */
export function unlockAchievement(id: string): boolean {
  if (typeof window === "undefined") return false;

  // 定義されていない ID は解除しない
  if (!achievements.some((item) => item.id === id)) {
    return false;
  }

  const unlockedIds = getUnlockedAchievementIds();

  // 取得済みなら何もしない
  if (unlockedIds.includes(id)) {
    return false;
  }

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...unlockedIds, id]),
    );

    return true;
  } catch {
    // 保存に失敗した場合は、新規解除として通知しない
    return false;
  }
}

/** 指定したイベントに対応する実績を解除する */
export function unlockAchievementsByTrigger(
  trigger: AchievementTrigger,
): Achievement[] {
  return achievements.filter(
    (achievement) =>
      achievement.trigger === trigger &&
      unlockAchievement(achievement.id),
  );
}

"use client";

// ↓ 実際の TimetableApp の配置場所に合わせて import パスを調整
import TimetableApp from "../../../components/TimetableApp";

export default function MobileTimetablePage() {
  return <TimetableApp hideTimetable />;
}

export type CourseGradeOverride = {
  grades: number[];
  semesters: ("前期" | "後期" | "前期 第一ターム" | "前期 第二ターム" | "後期 第三ターム" | "後期 第四ターム")[];
};

export const courseGradeOverrides: Record<
  string,
  CourseGradeOverride
  > = {
  //
  // example:
  // 現代社会学:1・2年生が前期のみ履修可能 現代社会学の科目IDは5
  "5": {
    grades: [1, 2],　//学年。　1,2年を指定
    semesters: ["前期"],//"前期" | "後期"
  },//"前期 第一ターム" | "前期 第二ターム"
// "後期 第三ターム" | "後期 第四ターム" から指定
  //
  "6": {
    grades: [1, 2],
    semesters: ["後期"],
  },
  "999": {
    grades: [1, 2],
    semesters: ["前期"],
  },
};

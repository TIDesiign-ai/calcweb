import rawCourses from "../generated/courses.json";

const courseColors: Record<
  string,
  { color: string; textColor: string }
> = {
  "プログラミング応用": {
    color: "#d9f4e9",
    textColor: "#21654c",
  },
  "デジタルマーケティング演習": {
    color: "#e4e9ff",
    textColor: "#34477d",
  },
  "ゲーム情報学": {
    color: "#e5e7eb",
    textColor: "#374151",
  },
  "Linux演習": {
    color: "#fef3c7",
    textColor: "#92400e",
  },
  "人工知能演習": {
    color: "#f3e8ff",
    textColor: "#6b21a8",
  },
  "クラウド応用演習": {
    color: "#dbeafe",
    textColor: "#1e40af",
  },
  "人的資源と組織論": {
    color: "#fce7f3",
    textColor: "#9d174d",
  },
};

export const courseConfig: Record<
  string,
  {
    code: string;
    color: string;
    textColor: string;
  }
> = Object.fromEntries(
  rawCourses.map((course) => {
    const name = course.course_name;
    const colors = courseColors[name] ?? {
      color: "#e5e7eb",
      textColor: "#374151",
    };

    return [
      name,
      {
        code: name,
        ...colors,
      },
    ];
  }),
);

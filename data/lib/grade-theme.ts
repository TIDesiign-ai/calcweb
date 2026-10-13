
export type Grade = 1 | 2 | 3 | 4;

export const gradeThemes: Record<
  Grade,
  {
    name: string;
    color: string;
    background: string;
    border: string;
  }
> = {
  1: {
    name: "green",
    color: "#16a34a",
    background: "#f0fdf4",
    border: "#86efac",
  },
  2: {
    name: "blue",
    color: "#2563eb",
    background: "#eff6ff",
    border: "#93c5fd",
  },
  3: {
    name: "cyan",
    color: "#0891b2",
    background: "#ecfeff",
    border: "#67e8f9",
  },
  4: {
    name: "purple",
    color: "#9333ea",
    background: "#faf5ff",
    border: "#d8b4fe",
  },
};

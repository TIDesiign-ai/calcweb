import rawReviews from "./reviews.json";
import { courseConfig } from "./course-config";

export const courses = Object.entries(rawReviews).map(
  ([name, data]) => {
    const config = courseConfig[name];

    return {
      name,
      code: config?.code ?? name,
      color: config?.color ?? "#e5e7eb",
      textColor: config?.textColor ?? "#374151",
      rating: data.rating,
      reviews: data.reviews,
    };
  },
);

export function getCourseByCode(code: string) {
  return courses.find((course) => course.code === code);
}

export function getCourseByName(name: string) {
  return courses.find((course) => course.name === name);
}

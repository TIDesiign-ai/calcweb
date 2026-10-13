import rawReviews from "./reviews.json";

export const courses = Object.entries(rawReviews).map(
  ([name, data]) => ({
    code: encodeURIComponent(name),
    name,
    rating: data.rating,
    reviews: data.reviews,
  }),
);

export function getCourseByCode(code: string) {
  return courses.find(
    (course) => course.code === code,
  );
}

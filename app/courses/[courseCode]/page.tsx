import Link from "next/link";
import { notFound } from "next/navigation";
import {
  courses,
  getCourseByCode,
  getCourseByName,
} from "../../../data/lib/reviews";

export function generateStaticParams() {
  return courses.flatMap((course) => [
    { courseCode: course.code },
    { courseCode: course.name },
  ]);
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseCode: string }>;
}) {
  const { courseCode } = await params;

  const decodedCourseCode = decodeURIComponent(courseCode);

  const course =
    getCourseByCode(decodedCourseCode) ??
    getCourseByName(decodedCourseCode);

  if (!course) notFound();

  return (
    <main className="main detail-main">
      <Link className="detail-back" href="/#courses">
        ← 履修ナビに戻る
      </Link>

      <section className="panel detail-panel">
        <div className="eyebrow">COURSE REVIEW</div>
        <h1>{course.name}</h1>

        <div className="review-summary">
          <div className="rating">
            {course.rating.toFixed(1)}
            <span className="rating-scale"> / 5.0</span>
          </div>
          <div>
            <div
              className="stars"
              aria-label={`評価 ${course.rating} / 5`}
            >
              ★★★★★
            </div>
            <div className="small-muted">
              {course.reviews.length}件の口コミ
            </div>
          </div>
        </div>

        <h2 className="section-title">学生の口コミ</h2>

        {course.reviews.map((review, index) => (
          <article
            className="review-item"
            key={`${course.code}-${index}`}
          >
            <div className="author">{review.author}</div>
            <p>{review.comment}</p>
          </article>
        ))}

        <Link className="action secondary link-action" href="/#timetable">
          時間割ツールに戻る
        </Link>

        <p className="small-muted detail-note">
          ※ 一部の口コミは動作確認用のテストデータです。
        </p>
      </section>
    </main>
  );
}

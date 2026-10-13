  import rawCourses from "../generated/courses.json"
  export type Course = {
    id: string;
    course_name: string;
    course_category: string;
    grade: number;
    semester: string;
    credits: number;
    class_type: string;
    overview: string;
    purpose: string;
    evaluation: string;
    pre_learning: string | null;
    post_learning: string | null;
    enrollment_info: string;
    notes: string;
    office_hours: string;
    source_file: string | null;
    source_page: number | null;
    created_at: string;
    updated_at: string;
    day: string | null;
    period: string | null;
    time: string | null;
  };

  export const courses: Course[] = rawCourses;

  export function getCoursesByGrade(grade: number): Course[] {
    return courses.filter((course) => course.grade === grade);
  }

  export function getCourseById(id: string): Course | undefined {
    return courses.find((course) => course.id === id);
  }

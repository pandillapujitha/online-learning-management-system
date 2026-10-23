import { Link } from "react-router-dom";

export default function CourseCard({ course }) {
  return (
    <article className="card">
      <div className="tags">
        <span className="tag">{course.category}</span>
        <span className="tag plain">{course.level}</span>
      </div>
      <h3>{course.title}</h3>
      <p>{course.description}</p>
      <p className="meta">By {course.instructor} - {course.lessonCount} lessons - {course.minutes} min - {course.students} enrolled</p>
      {course.progress !== undefined && (
        <div className="progress" title={course.progress + "% complete"}>
          <div style={{ width: course.progress + "%" }} />
        </div>
      )}
      <Link className="btn" to={"/course/" + course.id}>{course.progress !== undefined ? "Continue" : "View course"}</Link>
    </article>
  );
}

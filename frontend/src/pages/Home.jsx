import { useEffect, useState } from "react";
import { api } from "../api.js";
import CourseCard from "../components/CourseCard.jsx";

const CATEGORIES = ["", "Cloud", "Web", "Data"];

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams({ search, category }).toString();
    api("/courses?" + q)
      .then(setCourses)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search, category]);

  return (
    <>
      <section className="hero">
        <h1>Learn at your own pace, track every lesson.</h1>
        <p>Enroll in a course, finish lessons, then take the quiz to lock in your score.</p>
      </section>

      <section className="filters">
        <input placeholder="Search courses" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search courses" />
        <div className="chips">
          {CATEGORIES.map((c) => (
            <button key={c} className={"chip" + (category === c ? " on" : "")} onClick={() => setCategory(c)}>
              {c || "All"}
            </button>
          ))}
        </div>
      </section>

      {error && <p className="error">{error}</p>}
      {loading ? <p className="empty">Loading courses...</p> : courses.length === 0 ? (
        <p className="empty">No courses match your search. Try a different word or choose All.</p>
      ) : (
        <div className="grid">{courses.map((c) => <CourseCard key={c.id} course={c} />)}</div>
      )}
    </>
  );
}

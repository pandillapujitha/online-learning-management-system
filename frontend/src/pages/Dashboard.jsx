import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import CourseCard from "../components/CourseCard.jsx";

export default function Dashboard() {
  const { token, user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", description: "", category: "Web", level: "Beginner" });
  const isInstructor = user.role === "instructor";

  const load = () => {
    setLoading(true);
    api(isInstructor ? "/instructor/courses" : "/me/enrollments", { token })
      .then(setCourses).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(load, []); // eslint-disable-line

  async function create(e) {
    e.preventDefault();
    setError("");
    try {
      await api("/courses", { method: "POST", token, body: form });
      setForm({ title: "", description: "", category: "Web", level: "Beginner" });
      load();
    } catch (err) { setError(err.message); }
  }

  const avg = courses.length ? Math.round(courses.reduce((s, c) => s + (c.progress || 0), 0) / courses.length) : 0;
  const students = courses.reduce((s, c) => s + c.students, 0);

  return (
    <>
      <h1>{isInstructor ? "Your courses" : "Your learning"}</h1>
      <p className="lead">
        {isInstructor
          ? `${courses.length} courses, ${students} enrollments in total.`
          : `${courses.length} enrolled courses, ${avg}% average progress.`}
      </p>
      {error && <p className="error">{error}</p>}

      {isInstructor && (
        <section className="panel">
          <h2>Create a course</h2>
          <form onSubmit={create}>
            <label>Title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
            <label>Description<textarea required rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <label>Category
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option>Cloud</option><option>Web</option><option>Data</option><option>General</option>
              </select>
            </label>
            <label>Level
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
              </select>
            </label>
            <button className="btn">Create course</button>
          </form>
        </section>
      )}

      {loading ? <p className="empty">Loading...</p> : courses.length === 0 ? (
        <p className="empty">{isInstructor ? "You have not created a course yet. Use the form above." : "You are not enrolled in anything yet. Open the Courses page and pick one."}</p>
      ) : (
        <div className="grid">{courses.map((c) => <CourseCard key={c.id} course={c} />)}</div>
      )}
    </>
  );
}

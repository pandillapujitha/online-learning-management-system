import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

function Quiz({ courseId, token, onScore }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/courses/" + courseId + "/quiz", { token }).then(setQuestions).catch((e) => setError(e.message));
  }, [courseId, token]);

  async function submit() {
    setError("");
    try {
      const r = await api("/courses/" + courseId + "/quiz/submit", { method: "POST", token, body: { answers } });
      setResult(r);
      onScore();
    } catch (e) {
      setError(e.message);
    }
  }

  if (error) return <p className="error">{error}</p>;
  if (questions.length === 0) return <p className="empty">This course has no quiz questions yet.</p>;

  const correctFor = (qid) => result && result.review.find((r) => r.id === qid).correctIndex;

  return (
    <div className="quiz">
      {questions.map((q, i) => (
        <fieldset key={q.id}>
          <legend>{i + 1}. {q.question}</legend>
          {q.options.map((o, idx) => {
            let cls = "";
            if (result) cls = idx === correctFor(q.id) ? "right" : answers[q.id] === idx ? "wrong" : "";
            return (
              <label key={idx} className={"opt " + cls}>
                <input type="radio" name={q.id} disabled={!!result} checked={answers[q.id] === idx}
                  onChange={() => setAnswers({ ...answers, [q.id]: idx })} />
                {o}
              </label>
            );
          })}
        </fieldset>
      ))}
      {result ? (
        <div className="result">
          You got {result.correct} of {result.total} ({result.percent}%). Best score: {result.best}%.
          <button className="link-btn" onClick={() => { setResult(null); setAnswers({}); }}>Try again</button>
        </div>
      ) : (
        <button className="btn" onClick={submit} disabled={Object.keys(answers).length < questions.length}>Submit answers</button>
      )}
    </div>
  );
}

function InstructorTools({ course, token, reload }) {
  const [lesson, setLesson] = useState({ title: "", duration: 10, content: "" });
  const [q, setQ] = useState({ question: "", options: "", answer: 1 });
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  async function addLesson(e) {
    e.preventDefault();
    try {
      await api("/courses/" + course.id + "/lessons", { method: "POST", token, body: lesson });
      setLesson({ title: "", duration: 10, content: "" });
      setMsg("Lesson added.");
      reload();
    } catch (err) { setMsg(err.message); }
  }

  async function addQuestion(e) {
    e.preventDefault();
    const options = q.options.split("\n").map((s) => s.trim()).filter(Boolean);
    try {
      await api("/courses/" + course.id + "/quiz", { method: "POST", token, body: { question: q.question, options, answer: Number(q.answer) - 1 } });
      setQ({ question: "", options: "", answer: 1 });
      setMsg("Question added.");
      reload();
    } catch (err) { setMsg(err.message); }
  }

  async function remove() {
    if (!window.confirm("Delete this course and all enrollments?")) return;
    await api("/courses/" + course.id, { method: "DELETE", token });
    navigate("/dashboard");
  }

  return (
    <section className="panel">
      <h2>Instructor tools</h2>
      {msg && <p className="note">{msg}</p>}
      <form onSubmit={addLesson}>
        <h3>Add a lesson</h3>
        <label>Title<input required value={lesson.title} onChange={(e) => setLesson({ ...lesson, title: e.target.value })} /></label>
        <label>Minutes<input type="number" min="1" value={lesson.duration} onChange={(e) => setLesson({ ...lesson, duration: e.target.value })} /></label>
        <label>Content<textarea required rows="4" value={lesson.content} onChange={(e) => setLesson({ ...lesson, content: e.target.value })} /></label>
        <button className="btn">Add lesson</button>
      </form>
      <form onSubmit={addQuestion}>
        <h3>Add a quiz question</h3>
        <label>Question<input required value={q.question} onChange={(e) => setQ({ ...q, question: e.target.value })} /></label>
        <label>Options (one per line)<textarea required rows="4" value={q.options} onChange={(e) => setQ({ ...q, options: e.target.value })} /></label>
        <label>Correct option number<input type="number" min="1" value={q.answer} onChange={(e) => setQ({ ...q, answer: e.target.value })} /></label>
        <button className="btn">Add question</button>
      </form>
      <button className="btn danger" onClick={remove}>Delete course</button>
    </section>
  );
}

export default function Course() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(null);

  const load = useCallback(() => {
    api("/courses/" + id, { token }).then(setCourse).catch((e) => setError(e.message));
  }, [id, token]);

  useEffect(load, [load]);

  async function enroll() {
    if (!token) return navigate("/login");
    try {
      await api("/courses/" + id + "/enroll", { method: "POST", token });
      load();
    } catch (e) { setError(e.message); }
  }

  async function complete(lessonId) {
    try {
      await api("/courses/" + id + "/lessons/" + lessonId + "/complete", { method: "POST", token });
      load();
    } catch (e) { setError(e.message); }
  }

  if (error && !course) return <p className="error">{error} <Link to="/">Back to courses</Link></p>;
  if (!course) return <p className="empty">Loading course...</p>;

  const pct = course.lessons.length ? Math.round((course.completed.length / course.lessons.length) * 100) : 0;
  const canRead = course.enrolled || course.isOwner;

  return (
    <article className="course">
      <Link to="/" className="back">All courses</Link>
      <div className="tags"><span className="tag">{course.category}</span><span className="tag plain">{course.level}</span></div>
      <h1>{course.title}</h1>
      <p className="lead">{course.description}</p>
      <p className="meta">By {course.instructor} - {course.lessonCount} lessons - {course.minutes} min - {course.students} enrolled</p>
      {error && <p className="error">{error}</p>}

      {course.enrolled ? (
        <div className="progress big" title={pct + "% complete"}><div style={{ width: pct + "%" }} /></div>
      ) : !course.isOwner && (user?.role !== "instructor") && (
        <button className="btn" onClick={enroll}>{token ? "Enroll for free" : "Log in to enroll"}</button>
      )}

      <section className="panel">
        <h2>Lessons</h2>
        {course.lessons.length === 0 && <p className="empty">No lessons yet.</p>}
        <ol className="lessons">
          {course.lessons.map((l) => {
            const done = course.completed.includes(l.id);
            return (
              <li key={l.id} className={done ? "done" : ""}>
                <button className="lesson-head" onClick={() => canRead && setOpen(open === l.id ? null : l.id)} aria-expanded={open === l.id}>
                  <span>{l.title}</span>
                  <span className="meta">{l.duration} min{done ? " - completed" : ""}{!canRead ? " - enroll to read" : ""}</span>
                </button>
                {open === l.id && canRead && (
                  <div className="lesson-body">
                    <p>{l.content}</p>
                    {course.enrolled && !done && <button className="btn small" onClick={() => complete(l.id)}>Mark as complete</button>}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {course.enrolled && (
        <section className="panel">
          <h2>Quiz {course.quizScore !== null && <small>Best score: {course.quizScore}%</small>}</h2>
          <Quiz courseId={course.id} token={token} onScore={load} />
        </section>
      )}

      {course.isOwner && <InstructorTools course={course} token={token} reload={load} />}
    </article>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function Auth() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const fill = (email, password) => setForm({ ...form, email, password });

  return (
    <div className="auth">
      <h2>{mode === "login" ? "Log in" : "Create your account"}</h2>
      <form onSubmit={submit}>
        {mode === "register" && (
          <label>Full name<input required value={form.name} onChange={set("name")} /></label>
        )}
        <label>Email<input type="email" required value={form.email} onChange={set("email")} /></label>
        <label>Password<input type="password" required minLength={6} value={form.password} onChange={set("password")} /></label>
        {mode === "register" && (
          <label>I am a
            <select value={form.role} onChange={set("role")}>
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
            </select>
          </label>
        )}
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={busy}>{busy ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}</button>
      </form>
      <p className="switch">
        {mode === "login" ? "New here?" : "Already registered?"}{" "}
        <button className="link-btn" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
          {mode === "login" ? "Create an account" : "Log in"}
        </button>
      </p>
      {mode === "login" && (
        <div className="demo">
          <strong>Demo accounts</strong>
          <button className="link-btn" type="button" onClick={() => fill("student@lms.com", "student123")}>Use student login</button>
          <button className="link-btn" type="button" onClick={() => fill("instructor@lms.com", "instructor123")}>Use instructor login</button>
        </div>
      )}
    </div>
  );
}

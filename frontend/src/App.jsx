import { Link, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import Home from "./pages/Home.jsx";
import Auth from "./pages/Auth.jsx";
import Course from "./pages/Course.jsx";
import Dashboard from "./pages/Dashboard.jsx";

function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="nav">
      <Link to="/" className="brand">Lumen<span>LMS</span></Link>
      <nav>
        <NavLink to="/" end>Courses</NavLink>
        {user && <NavLink to="/dashboard">{user.role === "instructor" ? "My teaching" : "My learning"}</NavLink>}
        {user ? (
          <button className="link-btn" onClick={logout}>Log out ({user.name.split(" ")[0]})</button>
        ) : (
          <NavLink to="/login">Log in</NavLink>
        )}
      </nav>
    </header>
  );
}

function Protected({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/course/:id" element={<Course />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="*" element={<p className="empty">That page does not exist. <Link to="/">Browse courses</Link></p>} />
        </Routes>
      </main>
      <footer className="foot">Online Learning Management System - Cloud Computing project</footer>
    </>
  );
}

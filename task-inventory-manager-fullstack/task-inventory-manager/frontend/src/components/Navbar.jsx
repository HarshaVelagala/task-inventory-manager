import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RoleBadge from "./RoleBadge";
import "../styles/navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <span className="navbar-mark">M</span>
        <div>
          <div className="navbar-title">Manifest</div>
          <div className="navbar-subtitle">Task &amp; Inventory Manager</div>
        </div>
      </div>

      <nav className="navbar-links">
        <NavLink to="/dashboard/tasks" className={({ isActive }) => (isActive ? "active" : "")}>
          Tasks
        </NavLink>
        <NavLink to="/dashboard/inventory" className={({ isActive }) => (isActive ? "active" : "")}>
          Inventory
        </NavLink>
        {user?.role === "admin" && (
          <NavLink to="/dashboard/users" className={({ isActive }) => (isActive ? "active" : "")}>
            Users
          </NavLink>
        )}
      </nav>

      <div className="navbar-user">
        <div className="navbar-user-info">
          <div className="navbar-user-name">{user?.name}</div>
          <RoleBadge role={user?.role} />
        </div>
        <button className="btn btn-ghost" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </header>
  );
}

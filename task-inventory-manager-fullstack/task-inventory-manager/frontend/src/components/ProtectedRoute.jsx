import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { user, initializing } = useAuth();

  if (initializing) {
    return <div className="page-loading">Loading your workspace…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard/tasks" replace />;
  }

  return children;
}

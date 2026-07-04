import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/dashboard.css";

export default function DashboardLayout() {
  return (
    <div className="dashboard-shell">
      <Navbar />
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}

import { useEffect, useState } from "react";
import { userApi } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import RoleBadge from "../components/RoleBadge";
import "../styles/users.css";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const { data } = await userApi.list();
      setUsers(data);
    } catch {
      setError("Couldn't load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleRoleChange(user, role) {
    await userApi.updateRole(user.id, role);
    loadUsers();
  }

  async function handleDelete(user) {
    if (!confirm(`Remove ${user.name}'s account? This can't be undone.`)) return;
    await userApi.remove(user.id);
    loadUsers();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Manifest / Admin</div>
          <h1>Team access</h1>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading team…</div>
      ) : (
        <div className="card users-table-wrap">
          <table className="inv-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td className="mono">{u.email}</td>
                  <td>
                    <RoleBadge role={u.role} />
                  </td>
                  <td>
                    <div className="users-actions">
                      <select
                        value={u.role}
                        disabled={u.id === currentUser.id}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                      >
                        <option value="user">User</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        className="btn btn-danger"
                        disabled={u.id === currentUser.id}
                        onClick={() => handleDelete(u)}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

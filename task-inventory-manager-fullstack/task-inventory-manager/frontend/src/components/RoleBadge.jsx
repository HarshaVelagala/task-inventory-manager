export default function RoleBadge({ role }) {
  return <span className={`stamp stamp-${role}`}>{role}</span>;
}

export default function StatusBadge({ status, type = 'status' }) {
  const statusMap = {
    open: '● Open',
    in_progress: '◐ In Progress',
    resolved: '✓ Resolved',
    closed: '○ Closed',
    low: 'Low',
    medium: 'Medium',
    high: '! High',
    critical: '!! Critical'
  };
  return (
    <span className={`badge badge-${status}`}>
      {statusMap[status] || status}
    </span>
  );
}

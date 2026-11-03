import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

const CONFIG = {
  confirmed: { label: 'Confirmed', cls: 'badge-confirmed', Icon: CheckCircle },
  missed:    { label: 'Missed',    cls: 'badge-missed',     Icon: XCircle },
  upcoming:  { label: 'Upcoming',  cls: 'badge-upcoming',   Icon: Clock },
  active:    { label: 'Active',    cls: 'badge-active',     Icon: AlertCircle },
};

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status?.toLowerCase()] || CONFIG.upcoming;
  const { label, cls, Icon } = cfg;
  return (
    <span className={`badge ${cls}`}>
      <Icon size={11} />
      {label}
    </span>
  );
}

import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Fab() {
  const navigate = useNavigate();
  return (
    <button className="fab" onClick={() => navigate('/add')} aria-label="Log an update">
      <Plus width={24} height={24} />
    </button>
  );
}

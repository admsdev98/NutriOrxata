import { useSearchParams } from 'react-router-dom';
import PlanificadorTrabajo from './PlanificadorTrabajo';

export default function PlanificadorTrabajoPage() {
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  return <PlanificadorTrabajo initialDate={dateParam} />;
}

import { RegisterView } from '../components/RegisterView';
import { WithEvent } from '../components/WithEvent';

export function RegisterPage() {
  return <WithEvent>{(event) => <RegisterView key={event.id} event={event} />}</WithEvent>;
}

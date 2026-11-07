import { notifications } from '@mantine/notifications';
import { errorMessage } from '@/api/apiError';

/** Toast helpers used after every create / update action. */
export const notify = {
  success(message: string, title = 'Done'): void {
    notifications.show({ title, message, color: 'green' });
  },
  /** Partial failure with a custom title (e.g. saved, but the photos were not uploaded). */
  warning(error: unknown, title: string): void {
    notifications.show({ title, message: errorMessage(error), color: 'orange', autoClose: 9000 });
  },
  /** Takes a single argument so it can be passed directly as a React Query `onError` callback. */
  error(error: unknown): void {
    notifications.show({ title: 'Something went wrong', message: errorMessage(error), color: 'red', autoClose: 7000 });
  },
};

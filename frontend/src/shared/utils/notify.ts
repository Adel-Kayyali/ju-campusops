import { notifications } from '@mantine/notifications';
import { errorMessage, toApiError } from '@/api/apiError';

/** A title that matches the kind of error (the message itself comes from the API). */
function errorTitle(error: unknown): string {
  const { status } = toApiError(error);
  if (status === 400 || status === 422) return 'Please check your input';
  if (status === 409) return 'Not possible right now';
  if (status === 403) return 'Not allowed';
  if (status === 429) return 'Too many attempts';
  return 'Something went wrong';
}

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
    notifications.show({ title: errorTitle(error), message: errorMessage(error), color: 'red', autoClose: 7000 });
  },
};

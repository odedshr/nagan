export type NotificationType = 'info' | 'error' | 'warning' | 'success';

export type NotifyPayload = {
  type?: NotificationType;
  message: unknown;
};

export type Notifier = {
  notify: (payload: NotifyPayload) => void;
};

export type CreateLastEventNotifierOptions = {
  logInDev?: boolean;
};

export function normalizeNotificationMessage(message: unknown): string {
  if (message instanceof Error) {
    return message.message || String(message);
  }

  if (typeof message === 'string') {
    return message;
  }

  try {
    return JSON.stringify(message);
  } catch {
    return String(message);
  }
}

export function createLastEventNotifier(
  setLastEvent: (event: CustomEvent) => void,
  { logInDev = false }: CreateLastEventNotifierOptions = {}
): Notifier {
  return {
    notify: ({ type = 'info', message }: NotifyPayload) => {
      const normalizedMessage = normalizeNotificationMessage(message);

      setLastEvent(
        new CustomEvent('notification', {
          detail: { type, message: normalizedMessage },
        })
      );

      if (logInDev && import.meta.env.DEV) {
        switch (type) {
          case 'error':
            console.error(normalizedMessage);
            break;
          case 'warning':
            console.warn(normalizedMessage);
            break;
          default:
            console.log(normalizedMessage);
            break;
        }
      }
    },
  };
}

export function getNotify(notifier?: Notifier): (payload: NotifyPayload) => void {
  if (notifier) {
    return notifier.notify;
  }

  return ({ type = 'info', message }: NotifyPayload) => {
    const normalizedMessage = normalizeNotificationMessage(message);

    if (type === 'error') {
      console.error(normalizedMessage);
      return;
    }
    if (type === 'warning') {
      console.warn(normalizedMessage);
      return;
    }
    console.log(normalizedMessage);
  };
}

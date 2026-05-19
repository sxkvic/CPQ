type NotifyType = 'success' | 'error' | 'warning' | 'info';

let notifyHandler: ((type: NotifyType, content: string) => void) | null = null;

export function setGlobalNotify(handler: (type: NotifyType, content: string) => void) {
  notifyHandler = handler;
}

export function notify(type: NotifyType, content: string) {
  notifyHandler?.(type, content);
}

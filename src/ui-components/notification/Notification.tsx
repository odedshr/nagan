/// <reference path="../../jsx.d.ts" />

import jsx from '../../jsx.js';

interface NotificationProps {
  message: string;
  type?: 'info' | 'error' | 'warning' | 'success';
}

export default function Notification(props: NotificationProps): HTMLLIElement {
  const { message, type = 'info' } = props;

  return (<li class={`notification ${type}`}>{message}</li>) as HTMLLIElement;
}

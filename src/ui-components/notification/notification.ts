import { State } from '../../types.js';
import Notification from './notification.ui.js';

export default function initNotifications(state:State, container:HTMLUListElement) {
    state.addListener('lastEvent', async (event?:CustomEvent) => {
        if (event) {
            switch (event.type) {
                case 'notification':
                    const { message, type } = event.detail;
                    const notificationElement = Notification({ message, type });
                      setTimeout(() => {
                        notificationElement.remove();
                    }, 5000); // Remove after 5 seconds
                    container.appendChild(notificationElement);
                    break;
            }
        }
    });
}

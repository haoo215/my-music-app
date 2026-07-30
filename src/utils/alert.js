import { createApp } from 'vue';
import GlobalAlert from '@/components/GlobalAlert.vue';

let alertInstance = null;

export function myAlert(message, duration = 3000) {
  if (!alertInstance) {
    const div = document.createElement('div');
    document.body.appendChild(div);
    alertInstance = createApp(GlobalAlert).mount(div);
  }
  alertInstance.show(message, duration);
}

window.myAlert = myAlert;
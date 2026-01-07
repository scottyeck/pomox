import notifier from 'node-notifier';

export function sendNotification(title: string, message: string): void {
  notifier.notify({
    title,
    message,
    sound: 'Glass',
  });
}

export function notifyStart(duration: number): void {
  sendNotification('Pomox', `Pomodoro started (${duration} minutes)`);
}

export function notifyEnd(): void {
  sendNotification('Pomox', 'Pomodoro complete!');
}

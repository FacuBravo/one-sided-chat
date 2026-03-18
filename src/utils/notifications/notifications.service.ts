import { Expo } from 'expo-server-sdk';

const expo = new Expo();

export class NotificationService {
    async sendPush(tokens: string[], message: string, data?: any) {
        const messages = tokens.map((token) => ({
            to: token,
            sound: 'default',
            title: 'Nuevo mensaje',
            body: message,
            data,
            channelId: 'messages',
        }));

        const chunks = expo.chunkPushNotifications(messages);

        for (const chunk of chunks) {
            try {
                await expo.sendPushNotificationsAsync(chunk);
            } catch (error) {
                console.error(error);
            }
        }
    }
}

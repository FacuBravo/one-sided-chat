import { Expo } from 'expo-server-sdk';
import { MessagePush } from './interfaces/message-push.interface';
import { notificationsChannels } from './consts/notifications';

const expo = new Expo();

export class NotificationService {
    async sendMessagePush({ tokens, titles, body, data }: MessagePush) {
        const messages = tokens.map((token, index) => ({
            to: token,
            sound: 'default',
            title: titles[index],
            body,
            data: data as any,
            channelId: notificationsChannels.messages,
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

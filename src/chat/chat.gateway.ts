import {
    WebSocketGateway,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketServer,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { MessageFromClientDto } from './dto/client-message.dto';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() wss: Server;

    constructor(
        private readonly chatService: ChatService,
        private readonly jwtService: JwtService,
    ) {}

    async handleConnection(client: Socket) {
        const token = client.handshake.headers.authorization as string;

        try {
            const payload: JwtPayload = this.jwtService.verify(token);
            await this.chatService.registerClient(client, payload.id);
        } catch (error) {
            return client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        this.chatService.removeClient(client.id);
    }

    @SubscribeMessage('message-from-client')
    async handleMessage(client: Socket, payload: MessageFromClientDto) {
        const toUsers = await this.chatService.getUsersFromPhones(
            payload.phones,
        );

        toUsers.forEach((user) => {
            for (const socketId of Object.keys(
                this.chatService.connectedClients,
            )) {
                const toClient = this.chatService.connectedClients[socketId];

                if (toClient.user.id === user.id) {
                    toClient.socket.emit('message-from-server', {
                        message: payload.message,
                        from: this.chatService.getUserFullName(client.id),
                    });
                }
            }
        });
    }
}

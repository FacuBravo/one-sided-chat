import {
    WebSocketGateway,
    OnGatewayConnection,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway()
export class SocketGateway implements OnGatewayConnection {
    @WebSocketServer() wss: Server;

    constructor(private readonly jwtService: JwtService) {}

    async handleConnection(client: Socket) {
        try {
            const rawToken = client.handshake.auth?.token;

            const token = rawToken?.startsWith('Bearer ')
                ? rawToken.split(' ')[1]
                : rawToken;

            if (!token) {
                return client.disconnect();
            }

            const payload: JwtPayload = this.jwtService.verify(token);

            client.data.user = payload;

            client.join(`user:${payload.id}`);
        } catch (error) {
            client.disconnect();
        }
    }
}

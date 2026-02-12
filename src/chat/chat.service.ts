import { Injectable } from '@nestjs/common';
import { User } from 'src/auth/entities/user.entity';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';

interface ConnectedClient {
    [id: string]: { socket: Socket; user: User };
}

@Injectable()
export class ChatService {
    connectedClients: ConnectedClient = {};

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async registerClient(client: Socket, userId: string) {
        const user = await this.userRepository.findOneBy({ id: userId });

        if (!user) {
            throw new Error('User not found');
        }

        this.checkExistsUser(user);

        this.connectedClients[client.id] = { socket: client, user };
    }

    removeClient(clientId: string) {
        delete this.connectedClients[clientId];
    }

    getUserFullName(socketId: string) {
        return this.connectedClients[socketId].user.fullName;
    }

    getUsersFromPhones(phones: string[]) {
        return this.userRepository.findBy({ phone_e164: In(phones) });
    }

    private checkExistsUser(user: User) {
        for (const socketId of Object.keys(this.connectedClients)) {
            const client = this.connectedClients[socketId];

            if (client.user.id === user.id) {
                client.socket.disconnect();
                this.removeClient(socketId);
                return;
            }
        }
    }
}

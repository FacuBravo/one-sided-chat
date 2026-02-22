import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { Invitation } from './entities/invitation.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    controllers: [GroupsController],
    providers: [GroupsService],
    imports: [TypeOrmModule.forFeature([Group, Invitation]), AuthModule],
    exports: [GroupsService],
})
export class GroupsModule {}

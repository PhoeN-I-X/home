import { Module } from '@nestjs/common';
import { ChatService } from './chats.service';
import { ChatController } from './chats.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatsModule {}

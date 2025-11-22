import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import * as FormData from 'form-data'
import { Readable } from 'form-data';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getChats(userId: number, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  
  const [chats, totalCount] = await Promise.all([
    this.prisma.chat.findMany({
      where: {
        users: {
          some: { userId },
        },
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, 
        },
        users: {
          include: { 
            user: { 
              select: { 
                id: true, 
                username: true 
              } 
            } 
          },
          omit: {
            userId: true,
            chatId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    this.prisma.chat.count({
      where: {
        users: {
          some: { userId },
        },
      },
    })
  ]);

  const filteredChats = chats.map(chat => ({
    ...chat,
    users: chat.users.filter(u => u.user.id !== userId),
  }));

  return {
    chats: filteredChats,
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    hasNext: page < Math.ceil(totalCount / limit),
    hasPrev: page > 1,
  };
}
  async getChat(chatId: number, userId: number) {
    const chat = await this.prisma.chat.findFirst({
      where: {
        id: chatId,
        users: {
          some: { userId },
        },
      },
      include: {
        messages: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
        },
        users: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
          omit: {
            userId: true,
            chatId: true,
          },
        },
      },
    });
    if (!chat) {
      throw new NotFoundException('Чат не найден');
    }
      const filteredChat = {
      ...chat,
      users: chat.users.filter(u => u.user.id !== userId),
    };

    return filteredChat;
  }

  async sendMessage(
    chatId: number,
    authorId: number,
    text: string,
    file?: Express.Multer.File,
  ) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId, users: { some: { userId: authorId } } },
    });
    if (!chat) {
      throw new NotFoundException('Чат не найден');
    }
    let attachmentName: string | null = null;

    const formData = new FormData();
    formData.append('text', text);
    if (file) {
        const safeName = normalizeFilename(file.originalname);

        formData.append('file', file.buffer, safeName);
        attachmentName = safeName;
      }
    const res = await axios.post(
      `http://chat_storage:5000/chat/${chatId}`,
      formData,
      {
        headers: formData.getHeaders(),
      },
    );

    const author = await this.prisma.user.findUnique({
      where: { id: authorId },
    });
    if (!author) {
      throw new NotFoundException('Автор не найден');
    }
    return this.prisma.message.create({
      data: {
        chatId,
        userId: authorId,
        text,
        attachment: attachmentName,
      },
    });
  }

  async createChat(currentUserId: number, peerUsername: string) {
    const peerUser = await this.prisma.user.findUnique({
      where: { username: peerUsername },
    });

    if (!peerUser) {
      throw new NotFoundException('Пользователь с таким именем не найден');
    }

    const existingChat = await this.prisma.chat.findFirst({
      where: {
        users: {
          every: {
            OR: [{ userId: currentUserId }, { userId: peerUser.id }],
          },
        },
      },
    });

    if (existingChat) {
      return existingChat;
    }
    const chat = await this.prisma.chat.create({
      data: {
        users: {
          create: [{ userId: currentUserId }, { userId: peerUser.id }],
        },
      },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          omit: {
            userId: true,
            chatId: true,
          },
        },
      },
    });

    return chat;
  }
  async isUserInChat(chatId: number, userId: number): Promise<boolean> {
    const chat = await this.prisma.chat.findFirst({
      where: {
        id: chatId,
        users: {
          some: { userId },
        },
      },
      select: { id: true },
    });
    return !!chat;
  }
  async fetchAttachmentFromStorage(chatId: number, filename: string): Promise<Readable | null> {
    const url = `http://chat_storage:5000/chat/${chatId}/attachment/${filename}`;

    try {
      const response = await axios.get(url, { responseType: 'stream' });
      return response.data as Readable;
    } catch (err) {
      return null;
    }
  }
}
function normalizeFilename(filename: string): string {
  const translitMap: Record<string, string> = {
    А: 'A', а: 'a', Б: 'B', б: 'b', В: 'V', в: 'v', Г: 'G', г: 'g',
    Д: 'D', д: 'd', Е: 'E', е: 'e', Ё: 'E', ё: 'e', Ж: 'Zh', ж: 'zh',
    З: 'Z', з: 'z', И: 'I', и: 'i', Й: 'Y', й: 'y', К: 'K', к: 'k',
    Л: 'L', л: 'l', М: 'M', м: 'm', Н: 'N', н: 'n', О: 'O', о: 'o',
    П: 'P', п: 'p', Р: 'R', р: 'r', С: 'S', с: 's', Т: 'T', т: 't',
    У: 'U', у: 'u', Ф: 'F', ф: 'f', Х: 'Kh', х: 'kh', Ц: 'Ts', ц: 'ts',
    Ч: 'Ch', ч: 'ch', Ш: 'Sh', ш: 'sh', Щ: 'Sch', щ: 'sch',
    Ы: 'Y', ы: 'y', Э: 'E', э: 'e', Ю: 'Yu', ю: 'yu', Я: 'Ya', я: 'ya',
  };

  const dotIndex = filename.lastIndexOf('.');
  const name = dotIndex !== -1 ? filename.substring(0, dotIndex) : filename;
  const ext = dotIndex !== -1 ? filename.substring(dotIndex) : '';

  const transliterated = name
    .split('')
    .map(ch => translitMap[ch] ?? ch)
    .join('');

  const safe = transliterated
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\-]/g, '');

  return safe + ext;
}
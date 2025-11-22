import { Controller, Get, Post, Body, Param, UseGuards, Req, Res, UploadedFile, UseInterceptors, ForbiddenException, NotFoundException, Query, BadRequestException } from "@nestjs/common";
import { ChatService } from "./chats.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { Express } from 'express'; 
import { FileInterceptor } from "@nestjs/platform-express";
import { Response, Request } from 'express';
import { extname } from "path";

@Controller("chats")
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) { }

  @Get()
async getUserChats(
  @Req() req: any,
  @Query('page') page: string = '1'
) {
  const userId = req.user.id;
  
  const pageNum = parseInt(page) || 1;
  if (isNaN(pageNum) || pageNum < 1) {
    throw new BadRequestException('Некорректный номер страницы');
  }
  const limitNum = 10;
  
  const actualLimit = Math.min(limitNum, 50);
  
  const result = await this.chat.getChats(userId, pageNum, actualLimit);
  
  return { 
    chats: result.chats, 
    user: req.user.username,
    totalCount: result.totalCount,
    currentPage: result.currentPage,
    totalPages: result.totalPages,
    hasNext: result.hasNext,
    hasPrev: result.hasPrev
  };
}
  @Get(":id")
  async getChat(@Param("id") id: string, @Req() req: any) {
    const chat = await this.chat.getChat(Number(id), req.user.id);
    return { chat:chat, user: req.user };
  }
  @Post(':id')
  @UseInterceptors(FileInterceptor('file'))
  async sendMessage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { text: string },
    @Req() req: any,
  ) {
    const authorId = req.user.id;
    const chat = await this.chat.sendMessage(Number(id), authorId, body.text, file);
    return { chat:chat, user: req.user}
  }


  @Post()
  async createChat(@Req() req: any, @Body('username') username: string) {
    const userId = req.user.id;
    if(req.user.username==username) throw new ForbiddenException('Нельзя создать чат с самим собой');
    const chat = await this.chat.createChat(userId, username);
    return { chat:chat, user: req.user };
  }
  //  GET ATTACHMENT FROM STORAGE SERVER
  @Get(':chatId/attachment/:filename')
  async getAttachment(
    @Param('chatId') chatId: string,
    @Param('filename') filename: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const user = req.user as { id: number; username: string };
    const userId = user.id;

    const isMember = await this.chat.isUserInChat(Number(chatId), userId);  // VERY SECURE (DON'T EVEN TRY TO CRACK JWT)
    if (!isMember) throw new ForbiddenException('Это не ваш чат');

    const safeFilename = normalizeFilename(filename);

    const fileStream = await this.chat.fetchAttachmentFromStorage(+chatId, safeFilename);
    if (!fileStream) {
      throw new NotFoundException('Такого файла не существует');
    }

    const ext = extname(safeFilename).toLowerCase();
    let contentType: string;

    switch (ext) {
      case '.jpg':
      case '.jpeg':
      case '.jpe':
      case '.jfif':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.heic':
      case '.heif':
        contentType = 'image/heic';
        break;
      case '.bmp':
        contentType = 'image/bmp';
        break;
      case '.tif':
      case '.tiff':
        contentType = 'image/tiff';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
      case '.ico':
        contentType = 'image/x-icon';
        break;
      case '.avif':
        contentType = 'image/avif';
        break;

      default:
        contentType = 'application/octet-stream';
    }


    res.setHeader('Content-Type', contentType);
    fileStream.pipe(res);
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
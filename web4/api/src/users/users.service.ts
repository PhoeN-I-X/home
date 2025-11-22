import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

    async getProfile(search?: string) {
    const where:Prisma.UserWhereInput = search
        ? { username: { contains: search, mode: 'insensitive' as Prisma.QueryMode } }
        : {};

    return this.prisma.user.findMany({
        where,
        select: { id: true, username: true },
        take: 10, 
    });
    }
}

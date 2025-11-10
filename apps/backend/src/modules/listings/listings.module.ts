// apps/backend/src/modules/listings/listings.module.ts
import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { PrismaService } from '../../../prisma/prisma.service';
import { FileService } from '../../common/services/file.service';

@Module({
  controllers: [ListingsController],
  providers: [PrismaService, FileService],
})
export class ListingsModule {}
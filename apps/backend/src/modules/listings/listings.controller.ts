// apps/backend/src/modules/listings/listings.controller.ts
import {
  Controller,
  Post,
  UseGuards,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { FileService } from '../../common/services/file.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { ListingUploadDto } from './dto/listing-upload.dto';

interface AuthenticatedRequest extends Express.Request {
  user: { id: string; email: string; role: string };
}

@ApiTags('Listings')
@Controller('listings')
export class ListingsController {
  constructor(
    private prisma: PrismaService,
    private fileService: FileService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  @Post('upload-image')
  @ApiConsumes('multipart/form-data')
  async uploadListingImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ListingUploadDto,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    // 1. Validate file
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Only image files are allowed');
    }

    const userId = req.user.id;

    // 2. Validate listing exists and belongs to user
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      select: { id: true, userId: true, images: true, type: true },
    });

    if (!listing) {
      throw new BadRequestException('Listing not found');
    }

    if (listing.userId !== userId) {
      throw new BadRequestException('You do not own this listing');
    }

    // 3. Validate listing type matches
    if (listing.type !== dto.type) {
      throw new BadRequestException('Listing type mismatch');
    }

    // 4. Enforce max 10 images
    if (listing.images.length >= 10) {
      throw new BadRequestException('Maximum 10 images allowed per listing');
    }

    // 5. Upload to Tebi
    const prefix = `public/listings/${dto.type}/${dto.listingId}`;
    const publicUrl = await this.fileService.uploadPublic(
      file.buffer,
      file.originalname,
      prefix,
    );

    // 6. Update listing.images
    const updatedImages = [...listing.images, publicUrl];
    const updatedListing = await this.prisma.listing.update({
      where: { id: dto.listingId },
       data: { images: updatedImages },
      select: { id: true, title: true, images: true, type: true },
    });

    return res.status(HttpStatus.OK).json({ listing: updatedListing });
  }
}
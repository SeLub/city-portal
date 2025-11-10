// src/modules/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  Get,
  UseGuards,
  Req,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import type { Response, Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from '../../common/services/file.service';
import { PrismaService } from '../../../prisma/prisma.service'; 
import { ApiConsumes, ApiBody, ApiTags } from '@nestjs/swagger';
import { AvatarUploadDto } from './dto/avatar-upload.dto';

// Define a typed request for authenticated routes
interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: string;
    email: string;
    role: string;
    name?: string;
    avatarUrl?: string;
  };
}

@ApiTags('Auth') 
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private fileService: FileService,
    private prisma: PrismaService, // ✅ Was incorrectly typed as AuthService
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res() res: Response) {
    try {
      const user = await this.authService.register(dto.email, dto.password, dto.name);
      return res.status(HttpStatus.CREATED).json(user);
    } catch (e: any) {
      if (e.code === 'P2002') {
        return res.status(HttpStatus.CONFLICT).json({ error: 'Email already exists' });
      }
      return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Registration failed' });
    }
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ error: 'Invalid credentials' });
    }

    const { accessToken } = await this.authService.login(user);

    res.cookie('auth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(HttpStatus.OK).json({ user });
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('auth_token');
    return { success: true };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@Req() req: AuthenticatedRequest) {
    return req.user; // ✅ Now safely typed
  }

@UseGuards(AuthGuard('jwt'))
@UseInterceptors(FileInterceptor('file'))
@Post('upload/avatar')
@ApiConsumes('multipart/form-data')
@ApiBody({
  description: 'Upload avatar image',
  type: AvatarUploadDto,
})
async uploadAvatar(
  @UploadedFile() file: Express.Multer.File,
  @Req() req: AuthenticatedRequest,
  @Res() res: Response,
) {
  if (!file) {
    throw new BadRequestException('File is required');
  }

  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedMimes.includes(file.mimetype)) {
    throw new BadRequestException('Only image files are allowed');
  }

  const userId = req.user.id;
  const prefix = `public/avatars/${userId}`;

  try {
    // 1. Fetch current user to check for existing avatar
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    // 2. Upload new avatar
    const publicUrl = await this.fileService.uploadPublic(
      file.buffer,
      file.originalname,
      prefix,
    );

    // 3. If old avatar exists and matches Tebi format, delete it
    if (currentUser?.avatarUrl) {
      try {
        // Parse URL: https://s3.tebi.io/bucket/key → extract 'key'
        const url = new URL(currentUser.avatarUrl);
        if (url.hostname === 's3.tebi.io') {
          const pathSegments = url.pathname.split('/').filter(Boolean);
          // Expected: [bucketName, ...keyParts]
          if (pathSegments.length >= 2 && pathSegments[0] === this.fileService['bucket']) {
            const key = pathSegments.slice(1).join('/'); // e.g., "public/avatars/.../xyz.jpg"
            await this.fileService.deleteFile(key);
          }
        }
      } catch (e) {
        console.warn('Failed to parse or delete old avatar URL:', currentUser.avatarUrl, e);
        // Do not fail the request — new avatar is more important
      }
    }

    // 4. Update user with new avatar URL
  const updatedUser = await this.prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: publicUrl },  // ✅ this is correct
    select: { id: true, email: true, name: true, avatarUrl: true, role: true },
  });

    return res.status(HttpStatus.OK).json({ user: updatedUser });
  } catch (error) {
    console.error('Avatar upload error:', error);
    throw new BadRequestException('Failed to upload avatar');
  }
}
}
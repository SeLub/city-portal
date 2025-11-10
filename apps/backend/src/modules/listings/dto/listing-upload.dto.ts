// apps/backend/src/modules/listings/dto/listing-upload.dto.ts
import { IsEnum, IsString, IsNotEmpty } from 'class-validator';

export class ListingUploadDto {
  @IsEnum(['goods', 'jobs', 'autos', 'real_estate'], {
    message: 'Invalid listing type',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  listingId: string;
}
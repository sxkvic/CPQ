import { IsString } from 'class-validator';

export class FileBase64Dto {
  @IsString()
  fileBase64!: string;
}

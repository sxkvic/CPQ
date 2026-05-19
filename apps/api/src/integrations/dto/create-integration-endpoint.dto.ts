import { IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateIntegrationEndpointDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsString()
  targetSystem!: string;

  @IsString()
  eventType!: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  url?: string;

  @IsOptional()
  @IsString()
  authType?: string;
}

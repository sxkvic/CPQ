import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateIntegrationEventDto {
  @IsOptional()
  @IsString()
  endpointId?: string;

  @IsString()
  resourceType!: string;

  @IsString()
  resourceId!: string;

  @IsString()
  eventType!: string;

  @IsObject()
  payloadJson!: Record<string, unknown>;
}

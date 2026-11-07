import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class SlaPolicyResponseDto {
  priority: string;
  responseHours: number;
  resolutionHours: number;
  description: string | null;
}

export class UpdateSlaPolicyDto {
  @IsInt()
  @Min(1)
  @Max(720)
  responseHours: number;

  @IsInt()
  @Min(1)
  @Max(2160)
  resolutionHours: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}

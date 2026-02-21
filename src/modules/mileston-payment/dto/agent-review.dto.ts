import { IsUUID, IsBoolean, IsOptional, IsString } from 'class-validator';

export class AgentReviewDto {
  @IsUUID()
  agentId: string;

  @IsBoolean()
  isRead: boolean;

  @IsOptional()
  @IsBoolean()
  approved?: boolean; // Agent can approve or reject

  @IsOptional()
  @IsString()
  notes?: string;
}
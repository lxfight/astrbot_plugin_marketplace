import { IsString, IsUrl, Matches } from 'class-validator';

export class SubmitPluginDto {
  @IsString()
  @IsUrl()
  @Matches(/^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/, {
    message: 'Repository URL must be a valid GitHub repository URL',
  })
  repoUrl: string;
}

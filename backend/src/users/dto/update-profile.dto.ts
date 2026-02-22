import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, MaxLength, IsArray } from 'class-validator';

export class UpdateProfileDto {
    @ApiPropertyOptional({ description: 'Unique username for the user', example: 'johndoe123' })
    @IsOptional()
    @IsString()
    @MaxLength(30)
    username?: string;

    @ApiPropertyOptional({ description: 'First name of the user', example: 'John' })

    @IsOptional()
    @IsString()
    @MaxLength(50)
    firstName?: string;

    @ApiPropertyOptional({ description: 'Last name of the user', example: 'Doe' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    lastName?: string;

    @ApiPropertyOptional({ description: 'User biography', example: 'Loves hiking and coding' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    bio?: string;

    @ApiPropertyOptional({ description: 'User gender', example: 'male' })
    @IsOptional()
    @IsString()
    gender?: string;

    @ApiPropertyOptional({ description: 'What the user is interested in', example: 'female' })
    @IsOptional()
    @IsString()
    interestedIn?: string;

    @ApiPropertyOptional({ description: 'Date of birth', example: '1990-01-01' })
    @IsOptional()
    @IsDateString()
    dateOfBirth?: string; // ISO string

    @ApiPropertyOptional({ description: 'User location', example: 'New York, USA' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    location?: string;

    @ApiPropertyOptional({ description: 'User nationality', example: 'Japanese' })
    @IsOptional()
    @IsString()
    nationality?: string;

    @ApiPropertyOptional({ description: 'Languages spoken', example: ['English', 'Japanese'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    languages?: string[];

    @ApiPropertyOptional({ description: 'Travel bucket list', example: ['Paris', 'Tokyo'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    travelBucketList?: string[];

    @ApiPropertyOptional({ description: 'Cultural interests', example: ['Anime', 'Food'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    culturalInterests?: string[];
}



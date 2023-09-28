import { IsString } from 'class-validator';

export class LoginDto {
    @IsString()
    public pass: string;
}
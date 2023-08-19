import { IsPositive } from 'class-validator';

export class GetArticleDto {
    @IsPositive({ always: true, message:'id must be positive'})
    public id: number;
}
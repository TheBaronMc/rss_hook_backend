import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

export class GetArticleDto {
    @IsInt()
    @Type(() => Number)
    @IsPositive({ always: true, message:'id must be positive'})
    public id: number;
}
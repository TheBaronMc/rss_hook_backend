import { Module } from '@nestjs/common';
import { ArticleController } from '../controllers';
import { ArticleService, PrismaService } from '../services';

@Module({
  imports: [],
  controllers: [ArticleController],
  providers: [ArticleService, PrismaService],
})
export class ArticlesModule {}
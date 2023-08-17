import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Flux } from '@prisma/client';

@Injectable()
export class FluxService {
    constructor(private prisma: PrismaService) {}

    async getAllFlux(): Promise<Flux[]> {
        return this.prisma.flux.findMany();
    }

    async getFlux(id: number): Promise<Flux> {
        return this.prisma.flux.findFirst({
            where: { id }
        });
    }

    async createFlux(url: string): Promise<Flux> {
        return this.prisma.flux.create({
            data: { url }
        });
    }

    async deleteFlux(id: number): Promise<Flux> {
        return this.prisma.flux.delete({
            where: { id }
        });
    }

    async updateFlux(id: number, url: string): Promise<Flux> {
        return this.prisma.flux.update({
            data: { url },
            where: { id }
        });
    }
}
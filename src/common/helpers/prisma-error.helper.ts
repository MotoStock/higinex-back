import {
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

type PrismaErrorHandlerOptions = {
  logger?: Logger;
  context?: string;
  defaultMessage?: string;
};

export function handlePrismaError(
  error: unknown,
  options: PrismaErrorHandlerOptions = {},
): never {
  const {
    logger,
    context = 'unknown',
    defaultMessage = 'Internal server error',
  } = options;

  if (error instanceof HttpException) throw error;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        const fields = Array.isArray(error.meta?.target)
          ? error.meta.target
          : [];
        throw new ConflictException({
          message: 'Unique constraint violation',
          fields,
        });
      }

      case 'P2025': {
        throw new NotFoundException('Record not found');
      }

      case 'P2003': {
        throw new BadRequestException('Foreign key constraint failed');
      }

      default: {
        logger?.error(
          `[${context}] Prisma known error (${error.code})`,
          error as any,
        );
        throw new InternalServerErrorException('Database error');
      }
    }
  }

  // Prisma: errores de validación (query mal formada, etc.)
  if (error instanceof Prisma.PrismaClientValidationError) {
    logger?.warn?.(`[${context}] Prisma validation error`, error as any);
    throw new BadRequestException('Invalid database query');
  }

  // Prisma: errores de inicialización / conexión
  if (error instanceof Prisma.PrismaClientInitializationError) {
    logger?.error?.(`[${context}] Prisma initialization error`, error as any);
    throw new InternalServerErrorException('Database initialization error');
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    logger?.error?.(`[${context}] Prisma panic error`, error as any);
    throw new InternalServerErrorException('Database panic error');
  }

  // Otros errores no relacionados con Prisma
  logger?.error?.(`[${context}] Non-Prisma error`, error as any);
  throw new InternalServerErrorException(defaultMessage);
}

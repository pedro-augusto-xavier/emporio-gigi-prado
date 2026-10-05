export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (code: string, message: string) => new AppError(400, code, message);
export const unauthorized = (message = 'Não autenticado') => new AppError(401, 'UNAUTHORIZED', message);
export const forbidden = (message = 'Sem permissão') => new AppError(403, 'FORBIDDEN', message);
export const notFound = (message = 'Não encontrado') => new AppError(404, 'NOT_FOUND', message);
export const conflict = (code: string, message: string) => new AppError(409, code, message);

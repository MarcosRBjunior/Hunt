export type ErrorDetails = Record<string, unknown>;

export type AppErrorOptions = {
  code?: string;
  details?: ErrorDetails;
};

/**
 * Erro de domínio lançado pelos serviços. O status HTTP é fixo por subclasse;
 * o `code` padrão pode ser trocado por um mais específico (ex.: `ALREADY_VOTED`).
 */
export abstract class AppError extends Error {
  abstract readonly status: number;
  readonly code: string;
  readonly details: ErrorDetails;

  protected constructor(
    defaultCode: string,
    message: string,
    options: AppErrorOptions = {},
  ) {
    super(message);
    this.name = new.target.name;
    this.code = options.code ?? defaultCode;
    this.details = options.details ?? {};
  }
}

export class ValidationError extends AppError {
  readonly status = 400;

  constructor(message = "Dados inválidos.", options?: AppErrorOptions) {
    super("VALIDATION_ERROR", message, options);
  }
}

export class UnauthenticatedError extends AppError {
  readonly status = 401;

  constructor(message = "Autenticação necessária.", options?: AppErrorOptions) {
    super("UNAUTHENTICATED", message, options);
  }
}

export class ForbiddenError extends AppError {
  readonly status = 403;

  constructor(message = "Acesso negado.", options?: AppErrorOptions) {
    super("FORBIDDEN", message, options);
  }
}

export class NotFoundError extends AppError {
  readonly status = 404;

  constructor(message = "Recurso não encontrado.", options?: AppErrorOptions) {
    super("NOT_FOUND", message, options);
  }
}

export class ConflictError extends AppError {
  readonly status = 409;

  constructor(
    message = "Conflito com o estado atual.",
    options?: AppErrorOptions,
  ) {
    super("CONFLICT", message, options);
  }
}

export class BusinessRuleError extends AppError {
  readonly status = 422;

  constructor(
    message = "Operação não permitida pelas regras de negócio.",
    options?: AppErrorOptions,
  ) {
    super("BUSINESS_RULE_VIOLATION", message, options);
  }
}

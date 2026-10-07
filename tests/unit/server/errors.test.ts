import { describe, expect, it } from "vitest";

import {
  AppError,
  BusinessRuleError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthenticatedError,
  ValidationError,
} from "@/server/errors";

describe("AppError e subclasses", () => {
  it.each([
    [ValidationError, 400, "VALIDATION_ERROR"],
    [UnauthenticatedError, 401, "UNAUTHENTICATED"],
    [ForbiddenError, 403, "FORBIDDEN"],
    [NotFoundError, 404, "NOT_FOUND"],
    [ConflictError, 409, "CONFLICT"],
    [BusinessRuleError, 422, "BUSINESS_RULE_VIOLATION"],
  ])("%o usa status %i e código padrão %s", (ErrorClass, status, code) => {
    const error = new ErrorClass();

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(status);
    expect(error.code).toBe(code);
    expect(error.name).toBe(ErrorClass.name);
    expect(error.message).not.toBe("");
    expect(error.details).toEqual({});
  });

  it("aceita mensagem, código específico e detalhes", () => {
    const error = new ConflictError("Você já votou neste produto.", {
      code: "ALREADY_VOTED",
      details: { productId: "abc" },
    });

    expect(error.status).toBe(409);
    expect(error.code).toBe("ALREADY_VOTED");
    expect(error.message).toBe("Você já votou neste produto.");
    expect(error.details).toEqual({ productId: "abc" });
  });
});

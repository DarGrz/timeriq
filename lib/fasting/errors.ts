import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class FastingHttpError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'FastingHttpError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function jsonResponse(data: unknown, status = 200, headersInit?: HeadersInit): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json',
      ...headersInit,
    },
  });
}

export function handleFastingError(error: unknown): NextResponse {
  if (error instanceof FastingHttpError) {
    return jsonResponse(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details !== undefined ? { details: error.details } : {}),
        },
      },
      error.statusCode
    );
  }

  if (error instanceof ZodError) {
    const issues = error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));
    return jsonResponse(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request payload failed schema validation',
          details: issues,
        },
      },
      422
    );
  }

  if (error instanceof SyntaxError) {
    return jsonResponse(
      {
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid JSON payload in request body',
        },
      },
      400
    );
  }

  // Handle PostgREST / Supabase error objects
  const pgError = error as { code?: string; message?: string; details?: string; hint?: string };
  if (pgError && typeof pgError === 'object' && typeof pgError.code === 'string') {
    switch (pgError.code) {
      case '23505': {
        const isOneActiveSession =
          pgError.message?.includes('fasting_one_active_session_per_user') ||
          pgError.details?.includes('fasting_one_active_session_per_user');
        return jsonResponse(
          {
            error: {
              code: isOneActiveSession ? 'ACTIVE_SESSION_CONFLICT' : 'CONFLICT',
              message: isOneActiveSession
                ? 'An active fasting session already exists for this account'
                : 'A conflicting record already exists',
            },
          },
          409
        );
      }
      case '23514': {
        return jsonResponse(
          {
            error: {
              code: 'CHECK_VIOLATION',
              message: 'Database check constraint violated or identity is immutable',
            },
          },
          422
        );
      }
      case '23503': {
        return jsonResponse(
          {
            error: {
              code: 'FOREIGN_KEY_VIOLATION',
              message: 'Referenced entity does not exist or was deleted',
            },
          },
          422
        );
      }
      case 'PGRST116': {
        return jsonResponse(
          {
            error: {
              code: 'NOT_FOUND',
              message: 'Resource not found',
            },
          },
          404
        );
      }
      default:
        break;
    }
  }

  // Fallback 500 error - never leak sensitive server or DB trace to client
  return jsonResponse(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected internal server error occurred',
      },
    },
    500
  );
}

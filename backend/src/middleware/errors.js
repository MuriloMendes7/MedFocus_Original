import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { HttpError, badRequest } from '../utils/http.js';

/** Valida req.body / req.query com um schema zod e substitui pelo valor parseado. */
export const validate =
  (schema, source = 'body') =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      return next(
        badRequest(
          'Dados inválidos.',
          result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        ),
      );
    }
    if (source === 'query') {
      req.validatedQuery = result.data;
    } else {
      req[source] = result.data;
    }
    next();
  };

export const notFoundHandler = (req, res) => {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Dados inválidos.', details: err.issues });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Arquivo/conteúdo muito grande.' });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido.' });
  }

  console.error(err);
  res.status(500).json({
    error: 'Erro interno do servidor.',
    // Nunca vazar detalhes internos em produção.
    ...(env.isProduction ? {} : { message: err?.message }),
  });
};

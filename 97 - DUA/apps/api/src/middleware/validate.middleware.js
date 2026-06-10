export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: true,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        fields: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      });
    }
    req.body = result.data;
    return next();
  };
}

export class AppError extends Error {
  constructor(message, status = 500, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function catchAsync(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

export function sanitizeUser(user, options = {}) {
  if (!user) return user;
  const { password, banReason, ...safe } = user;
  if (options.includeBanDetails) {
    return { ...safe, banReason: user.banReason };
  }
  return safe;
}

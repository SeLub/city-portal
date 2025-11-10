// apps/backend/src/common/middleware/logger.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    
    // Log request
    console.log(`\x1b[36m→ ${req.method} ${req.originalUrl}\x1b[0m`);

    // Log response
    res.on('finish', () => {
      const duration = Date.now() - start;
      const color = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m'; // red for errors, green for success
      console.log(`${color}← ${res.statusCode} ${req.method} ${req.originalUrl} [${duration}ms]\x1b[0m`);
    });

    next();
  }
}
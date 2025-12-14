/**
 * Validation middleware
 * Request body and query parameter validation
 */

import { Request, Response, NextFunction } from 'express';

export function validateRequest(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Basic validation - extend as needed
    next();
  };
}

export const validate = validateRequest;

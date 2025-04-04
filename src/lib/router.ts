import express, { Request, Response, Router, NextFunction } from 'express';
import { EnduranceSchema } from './schema.js';
import { EnduranceAuthMiddleware } from './auth.js';

type SecurityOptions = {
  permissions?: string[];
  checkOwnership?: boolean;
  requireAuth?: boolean;
}

type RequestHandler = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

interface EnduranceRequest<T = any> extends Request {
  user?: T;
}

abstract class EnduranceRouter<T = any> {
  protected router: Router;
  protected authMiddleware?: EnduranceAuthMiddleware;

  constructor(authMiddleware?: EnduranceAuthMiddleware) {
    this.router = express.Router();
    this.authMiddleware = authMiddleware;
    this.setupRoutes();
  }

  protected abstract setupRoutes(): void;

  protected buildSecurityMiddleware(options: SecurityOptions = {}): Array<RequestHandler> {
    const {
      requireAuth = true,
      checkOwnership = false,
      permissions = []
    } = options;

    const middlewares: Array<RequestHandler> = [];

    if (!this.authMiddleware) {
      return middlewares;
    }

    if (requireAuth) {
      middlewares.push(this.authMiddleware.auth.isAuthenticated);
    }

    if (permissions.length > 0) {
      middlewares.push((req: Request, res: Response, next: NextFunction) => {
        return this.authMiddleware!.accessControl.checkUserPermissions(permissions, req, res, next);
      });
    }

    if (checkOwnership) {
      middlewares.push(this.authMiddleware.accessControl.restrictToOwner);
    }

    return middlewares;
  }

  public get(
    path: string,
    securityOptions: SecurityOptions = {},
    ...handlers: Array<(req: EnduranceRequest<T>, res: Response, next: NextFunction) => Promise<void>>
  ) {
    const middlewares = this.buildSecurityMiddleware(securityOptions);
    const wrappedHandlers = handlers.map(handler => async (req: Request, res: Response, next: NextFunction) => {
      try {
        await handler(req as EnduranceRequest<T>, res, next);
      } catch (error) {
        next(error);
      }
    });
    this.router.get(path, ...middlewares, ...wrappedHandlers);
  }

  public post(
    path: string,
    securityOptions: SecurityOptions = {},
    ...handlers: Array<(req: EnduranceRequest<T>, res: Response, next: NextFunction) => Promise<void>>
  ) {
    const middlewares = this.buildSecurityMiddleware(securityOptions);
    const wrappedHandlers = handlers.map(handler => async (req: Request, res: Response, next: NextFunction) => {
      try {
        await handler(req as EnduranceRequest<T>, res, next);
      } catch (error) {
        next(error);
      }
    });
    this.router.post(path, ...middlewares, ...wrappedHandlers);
  }

  public put(
    path: string,
    securityOptions: SecurityOptions = {},
    ...handlers: Array<(req: EnduranceRequest<T>, res: Response, next: NextFunction) => Promise<void>>
  ) {
    const middlewares = this.buildSecurityMiddleware(securityOptions);
    const wrappedHandlers = handlers.map(handler => async (req: Request, res: Response, next: NextFunction) => {
      try {
        await handler(req as EnduranceRequest<T>, res, next);
      } catch (error) {
        next(error);
      }
    });
    this.router.put(path, ...middlewares, ...wrappedHandlers);
  }

  public delete(
    path: string,
    securityOptions: SecurityOptions = {},
    ...handlers: Array<(req: EnduranceRequest<T>, res: Response, next: NextFunction) => Promise<void>>
  ) {
    const middlewares = this.buildSecurityMiddleware(securityOptions);
    const wrappedHandlers = handlers.map(handler => async (req: Request, res: Response, next: NextFunction) => {
      try {
        await handler(req as EnduranceRequest<T>, res, next);
      } catch (error) {
        next(error);
      }
    });
    this.router.delete(path, ...middlewares, ...wrappedHandlers);
  }

  public patch(
    path: string,
    securityOptions: SecurityOptions = {},
    ...handlers: Array<(req: EnduranceRequest<T>, res: Response, next: NextFunction) => Promise<void>>
  ) {
    const middlewares = this.buildSecurityMiddleware(securityOptions);
    const wrappedHandlers = handlers.map(handler => async (req: Request, res: Response, next: NextFunction) => {
      try {
        await handler(req as EnduranceRequest<T>, res, next);
      } catch (error) {
        next(error);
      }
    });
    this.router.patch(path, ...middlewares, ...wrappedHandlers);
  }

  protected autoWireSecure(
    modelClass: typeof EnduranceSchema,
    modelName: string,
    securityOptions: SecurityOptions = {}
  ) {
    if (!this.authMiddleware) {
      throw new Error('authMiddleware is required for autoWireSecure');
    }

    // GET /
    this.get('/', securityOptions, async (req: Request, res: Response) => {
      try {
        const Model = modelClass.getModel();
        const items = await Model.find();
        res.json(items);
      } catch (err) {
        if (this.authMiddleware) {
          this.authMiddleware.auth.handleAuthError(err, req, res, () => { });
        } else {
          res.status(500).json({ message: 'Internal server error' });
        }
      }
    });

    // GET /:id
    this.get('/:id', securityOptions, async (req: Request, res: Response) => {
      try {
        const Model = modelClass.getModel();
        const item = await Model.findById(req.params.id);
        if (!item) {
          res.status(404).json({ message: `${modelName} not found` });
          return;
        }
        res.json(item);
      } catch (err) {
        if (this.authMiddleware) {
          this.authMiddleware.auth.handleAuthError(err, req, res, () => { });
        } else {
          res.status(500).json({ message: 'Internal server error' });
        }
      }
    });

    // POST /
    this.post('/', securityOptions, async (req: Request, res: Response) => {
      try {
        const Model = modelClass.getModel();
        const item = new Model(req.body);
        const savedItem = await item.save();
        res.status(201).json(savedItem);
      } catch (err) {
        if (this.authMiddleware) {
          this.authMiddleware.auth.handleAuthError(err, req, res, () => { });
        } else {
          res.status(500).json({ message: 'Internal server error' });
        }
      }
    });

    // PATCH /:id
    this.patch('/:id', securityOptions, async (req: Request, res: Response) => {
      try {
        const Model = modelClass.getModel();
        const item = await Model.findById(req.params.id);
        if (!item) {
          res.status(404).json({ message: `${modelName} not found` });
          return;
        }
        Object.assign(item, req.body);
        const updatedItem = await item.save();
        res.json(updatedItem);
      } catch (err) {
        if (this.authMiddleware) {
          this.authMiddleware.auth.handleAuthError(err, req, res, () => { });
        } else {
          res.status(500).json({ message: 'Internal server error' });
        }
      }
    });

    // DELETE /:id
    this.delete('/:id', securityOptions, async (req: Request, res: Response) => {
      try {
        const Model = modelClass.getModel();
        const item = await Model.findById(req.params.id);
        if (!item) {
          res.status(404).json({ message: `${modelName} not found` });
          return;
        }
        await item.deleteOne();
        res.json({ message: `${modelName} deleted successfully` });
      } catch (err) {
        if (this.authMiddleware) {
          this.authMiddleware.auth.handleAuthError(err, req, res, () => { });
        } else {
          res.status(500).json({ message: 'Internal server error' });
        }
      }
    });
  }

  public getRouter(): Router {
    return this.router;
  }
}

export {
  EnduranceRouter,
  EnduranceRequest,
  Response,
  NextFunction,
  type SecurityOptions
};

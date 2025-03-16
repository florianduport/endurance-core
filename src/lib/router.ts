import express, { Request, Response, Router, NextFunction } from 'express';
import { enduranceDatabase } from './database.js';
import { EnduranceSchema } from './schema.js';

type AccessControl = {
  checkUserPermissions?: (req: Request, res: Response, next: NextFunction) => void;
  restrictToOwner?: (req: Request, res: Response, next: NextFunction) => void;
};

class EnduranceRouter {
  private router: Router;

  constructor(options?: { requireDb?: boolean }) {
    this.router = express.Router();
    if (options && options.requireDb) {
      enduranceDatabase.checkRequiredEnvVars();
    }
  }

  public get(path: string, ...handlers: Array<(req: Request, res: Response, next: NextFunction) => void>) {
    this.router.get(path, ...handlers);
  }

  public post(path: string, ...handlers: Array<(req: Request, res: Response, next: NextFunction) => void>) {
    this.router.post(path, ...handlers);
  }

  public put(path: string, ...handlers: Array<(req: Request, res: Response, next: NextFunction) => void>) {
    this.router.put(path, ...handlers);
  }

  public delete(path: string, ...handlers: Array<(req: Request, res: Response, next: NextFunction) => void>) {
    this.router.delete(path, ...handlers);
  }

  public patch(path: string, ...handlers: Array<(req: Request, res: Response, next: NextFunction) => void>) {
    this.router.patch(path, ...handlers);
  }

  public use(handler: (req: Request, res: Response, next: NextFunction) => void) {
    this.router.use(handler);
  }

  public autoWire(modelClass: typeof EnduranceSchema, modelName: string, accessControl: AccessControl = {}) {
    const {
      checkUserPermissions = (req: Request, res: Response, next: NextFunction) => next(),
      restrictToOwner = (req: Request, res: Response, next: NextFunction) => next()
    } = accessControl;

    const getItem = async (req: Request, res: Response, next: NextFunction) => {
      try {
        const model = modelClass.getModel();
        const item = await model.findById(req.params.id);
        if (!item) {
          res.status(404).json({ message: `${modelName} not found` });
          return;
        }
        res.locals.item = item;
        next();
      } catch (err: unknown) {
        if (err instanceof Error) {
          res.status(500).json({ message: err.message });
        } else {
          res.status(500).json({ message: 'Unknown error' });
        }
      }
    };

    this.router.get('/', checkUserPermissions, async (req: Request, res: Response) => {
      try {
        const model = modelClass.getModel();
        const items = await model.find();
        res.json(items);
      } catch (err: unknown) {
        if (err instanceof Error) {
          res.status(500).json({ message: err.message });
        } else {
          res.status(500).json({ message: 'Unknown error' });
        }
      }
    });

    this.router.get('/:id', checkUserPermissions, restrictToOwner, getItem, (req: Request, res: Response) => {
      res.json(res.locals.item);
    });

    this.router.post('/', checkUserPermissions, async (req: Request, res: Response) => {
      const Model = modelClass.getModel();
      const item = new Model(req.body);
      try {
        const newItem = await item.save();
        res.status(201).json(newItem);
      } catch (err: unknown) {
        if (err instanceof Error) {
          res.status(400).json({ message: err.message });
        } else {
          res.status(400).json({ message: 'Unknown error' });
        }
      }
    });

    this.router.patch('/:id', checkUserPermissions, restrictToOwner, getItem, async (req: Request, res: Response) => {
      Object.assign(res.locals.item, req.body);
      try {
        const updatedItem = await res.locals.item.save();
        res.json(updatedItem);
      } catch (err: unknown) {
        if (err instanceof Error) {
          res.status(400).json({ message: err.message });
        } else {
          res.status(400).json({ message: 'Unknown error' });
        }
      }
    });

    this.router.delete('/:id', checkUserPermissions, restrictToOwner, getItem, async (req: Request, res: Response) => {
      try {
        await res.locals.item.remove();
        res.json({ message: `${modelName} deleted` });
      } catch (err: unknown) {
        if (err instanceof Error) {
          res.status(500).json({ message: err.message });
        } else {
          res.status(500).json({ message: 'Unknown error' });
        }
      }
    });
  }

  public getRouter(): Router {
    return this.router;
  }
}

const createRouter = (options?: { requireDb?: boolean }) => {
  return new EnduranceRouter(options);
};

export { createRouter as default, Request, Response };

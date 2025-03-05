import express, { Request, Response, Router, NextFunction } from 'express';
import { checkRequiredEnvVars } from './database.js';

const autoWire = function (this: Router, Model: any, modelName: string, accessControl: any = {}) {
  checkRequiredEnvVars();

  const { checkUserPermissions = (req: Request, res: Response, next: NextFunction) => next(), restrictToOwner = (req: Request, res: Response, next: NextFunction) => next() } = accessControl;

  const getItem = async function (req: Request, res: Response, next: NextFunction) {
    let item;
    try {
      item = await Model.findById(req.params.id);
      if (item == null) {
        res.status(404).json({ message: `${modelName} not found` });
        return;
      }
    } catch (err: any) {
      res.status(500).json({ message: err.message });
      return;
    }
    res.locals.item = item;
    next();
  };

  this.get('/', checkUserPermissions, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await Model.find();
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  this.get('/:id', checkUserPermissions, restrictToOwner, getItem, (req: Request, res: Response, next: NextFunction) => {
    res.json(res.locals.item);
  });

  this.post('/', checkUserPermissions, async (req: Request, res: Response, next: NextFunction) => {
    const item = new Model(req.body);
    try {
      const newItem = await item.save();
      res.status(201).json(newItem);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  this.patch('/:id', checkUserPermissions, restrictToOwner, getItem, async (req: Request, res: Response, next: NextFunction) => {
    Object.assign(res.locals.item, req.body);
    try {
      const updatedItem = await res.locals.item.save();
      res.json(updatedItem);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  this.delete('/:id', checkUserPermissions, restrictToOwner, getItem, async (req: Request, res: Response, next: NextFunction) => {
    try {
      await res.locals.item.remove();
      res.json({ message: `${modelName} deleted` });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
};

const router = (options: any) => {
  const expressRouter = express.Router();
  if (options && options.requireDb) {
    checkRequiredEnvVars();
    (expressRouter as any).autoWire = autoWire;
  }
  return expressRouter;
};

export { router as default, Request, Response };

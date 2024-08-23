const express = require('express');
const { checkRequiredEnvVars } = require('./database');


const autoWire = function(model, modelName, accessControl = {}) {
  checkRequiredEnvVars();

  const { checkUserPermissions = (req, res, next) => next(), restrictToOwner = (req, res, next) => next() } = accessControl;

  this.get('/', checkUserPermissions, async (req, res) => {
    try {
      const items = await model.find();
      res.json(items);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  this.get('/:id', checkUserPermissions, restrictToOwner, getItem, (req, res) => {
    res.json(res.item);
  });

  this.post('/', checkUserPermissions, async (req, res) => {
    const item = new model(req.body);
    try {
      const newItem = await item.save();
      res.status(201).json(newItem);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  this.patch('/:id', checkUserPermissions, restrictToOwner, getItem, async (req, res) => {
    Object.assign(res.item, req.body);
    try {
      const updatedItem = await res.item.save();
      res.json(updatedItem);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  this.delete('/:id', checkUserPermissions, restrictToOwner, getItem, async (req, res) => {
    try {
      await res.item.remove();
      res.json({ message: `${modelName} deleted` });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  async function getItem(req, res, next) {
    let item;
    try {
      item = await model.findById(req.params.id);
      if (item == null) {
        return res.status(404).json({ message: `${modelName} not found` });
      }
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
    res.item = item;
    next();
  }
};

const router = (options) => {
  const expressRouter = express.Router();
  if (options && options.requireDb) {
    checkRequiredEnvVars();
    expressRouter.autoWire = autoWire; 
  }
  return expressRouter; 
};


module.exports = router;

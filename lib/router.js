const express = require('express');

const Router = () => {
  return express.Router();
};

Router.autoWire = (router, model, modelName) => {
  // GET all
  router.get('/', async (req, res) => {
    try {
      const items = await model.find();
      res.json(items);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // GET one by ID
  router.get('/:id', getItem, (req, res) => {
    res.json(res.item);
  });

  // POST create
  router.post('/', async (req, res) => {
    const item = new model(req.body);
    try {
      const newItem = await item.save();
      res.status(201).json(newItem);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  // PATCH update
  router.patch('/:id', getItem, async (req, res) => {
    Object.assign(res.item, req.body);
    try {
      const updatedItem = await res.item.save();
      res.json(updatedItem);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  // DELETE
  router.delete('/:id', getItem, async (req, res) => {
    try {
      await res.item.remove();
      res.json({ message: `${modelName} deleted` });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // Middleware to get item by ID
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

module.exports = Router;

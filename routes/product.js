/**
 * routes/product.js — Product CRUD + Seeding (INT222 Unit IV)
 */
const express = require('express');
const { Product } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { category, page = 1, limit = 6 } = req.query;
    const filter = { available: true };
    if (category && category !== 'all') filter.category = category;
    const total = await Product.countDocuments(filter);
    const data  = await Product.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(parseInt(limit));
    res.json({ data, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total/limit) } });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json({ data: p });
  } catch (err) { next(err); }
});

router.post('/', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const p = await new Product(req.body).save();
    res.status(201).json({ data: p });
  } catch (err) { next(err); }
});

router.put('/:id', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json({ data: p });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

// Seed products
router.post('/seed/all', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    await Product.deleteMany({});
    const products = [
      // Online UPS
      { title:'Eaton Online UPS', category:'ups', price:'Price on Request', brand:'Eaton', specs:['Type: Online UPS', 'Double Conversion'] },
      { title:'Emmerson Online UPS', category:'ups', price:'Price on Request', brand:'Emmerson', specs:['Type: Online UPS', 'Double Conversion'] },
      { title:'BPE Online UPS', category:'ups', price:'Price on Request', brand:'BPE', specs:['Type: Online UPS', 'Double Conversion'] },
      { title:'APC Online UPS', category:'ups', price:'Price on Request', brand:'APC', specs:['Type: Online UPS', 'Double Conversion'] },
      
      // Offline UPS
      { title:'Microtek Offline UPS', category:'ups', price:'Price on Request', brand:'Microtek', specs:['Type: Offline / Line Interactive'] },
      { title:'Exide Offline UPS', category:'ups', price:'Price on Request', brand:'Exide', specs:['Type: Offline / Line Interactive'] },
      { title:'Okaya Offline UPS', category:'ups', price:'Price on Request', brand:'Okaya', specs:['Type: Offline / Line Interactive'] },
      { title:'Mtech Offline UPS', category:'ups', price:'Price on Request', brand:'Mtech', specs:['Type: Offline / Line Interactive'] },
      
      // Solar Category
      { title:'Online Solar UPS (Ongrid)', category:'solar', price:'Price on Request', specs:['Type: Grid-Tied'] },
      { title:'Offline Solar UPS', category:'solar', price:'Price on Request', specs:['Type: Off-Grid'] },
      { title:'Solar Water Pumps', category:'solar', price:'Price on Request', specs:['Type: Agriculture/Borewell'] },
      
      // Batteries
      { title:'Field Maintenance Free Battery (SMF)', category:'battery', price:'Price on Request', specs:['Type: SMF / VRLA', 'Maintenance Free'] },
      { title:'Tubular Battery', category:'battery', price:'Price on Request', specs:['Type: Tall Tubular', 'Deep Cycle'] },
      
      // Stabilizer
      { title:'Standard Servo Stabilizer', category:'stabilizer', price:'Price on Request', specs:['Type: Servo Controlled'] },
      { title:'Intelli J Stabilizer', category:'stabilizer', price:'Price on Request', brand:'Intelli J', specs:['Type: Digital/Static'] },
      { title:'Krykard Stabilizer', category:'stabilizer', price:'Price on Request', brand:'Krykard', specs:['Type: Digital/Static'] },
      
      // Lift Inverter
      { title:'Microtek Lift Inverter', category:'inverter', price:'Price on Request', brand:'Microtek', specs:['Type: 3-Phase Lift Inverter', 'ARD Function'] },
      { title:'Okaya Lift Inverter', category:'inverter', price:'Price on Request', brand:'Okaya', specs:['Type: 3-Phase Lift Inverter', 'ARD Function'] }
    ];
    await Product.insertMany(products);
    res.json({ message: `Seeded ${products.length} products successfully` });
  } catch (err) { next(err); }
});

module.exports = router;

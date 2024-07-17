const express = require('express');
const router = express.Router();
const transaksiController = require('../controllers/transaksiController');

router.post('/transaksi', transaksiController.addTransaksi);
router.get('/transaksi', transaksiController.getAllTransaksi);
router.get('/transaksi/search', transaksiController.searchTransaksi);
router.get('/transaksi/monthly-spend-earn', transaksiController.getMonthlySpendEarn);
router.get('/transaksi/by-date', transaksiController.getTransaksiByDate);
router.get('/transaksi/summarize-months', transaksiController.getSummarizeMonths);
router.put('/transaksi/:id', transaksiController.updateTransaksi);
router.delete('/transaksi/:id', transaksiController.deleteTransaksi);

module.exports = router;

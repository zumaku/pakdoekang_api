const mongoose = require('mongoose');

const transaksiSchema = new mongoose.Schema({
  aktifitas: String,
  jumlah: Number,
  isPengeluaran: Boolean,
  tanggal: Date,
  kategori: [String],
  catatan: String
});

const Transaksi = mongoose.model('transaksi', transaksiSchema);

module.exports = Transaksi;

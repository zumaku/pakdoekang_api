const Transaksi = require("../models/Transaksi");
const mongoose = require("mongoose");
const { startOfDay, endOfDay, format, startOfMonth } = require("date-fns");

// Add Transaksi
exports.addTransaksi = async (req, res) => {
    console.log(req.body);
    const { aktifitas, jumlah, isPengeluaran, tanggal, kategori, catatan } = req.body;
    
    if (!aktifitas || !jumlah || isPengeluaran === undefined || !tanggal || !kategori) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Received data:', req.body);

    // Assuming you have a model named Transaksi
    const newTransaksi = new Transaksi({
        aktifitas,
        jumlah,
        isPengeluaran,
        tanggal: new Date(tanggal), // Convert string to Date object
        kategori,
        catatan
    });

    newTransaksi.save()
        .then(() => res.status(201).json({ message: 'Transaksi added successfully' }))
        .catch(error => res.status(500).json({ error: 'Failed to add transaksi', details: error }));
};

// Get all Transaksi
exports.getAllTransaksi = async (req, res) => {
    try {
        const transaksiList = await Transaksi.find();
        res.status(200).json(transaksiList);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch transaksi" });
    }
};

// Search Transaksi
exports.searchTransaksi = async (req, res) => {
    const { searchKeyword } = req.query;
    try {
        const transaksiList = await Transaksi.find({
            aktifitas: { $regex: searchKeyword, $options: "i" },
        });
        res.status(200).json(transaksiList);
    } catch (error) {
        res.status(500).json({ error: "Failed to search transaksi" });
    }
};

// Get Monthly Spend/Earn
exports.getMonthlySpendEarn = async (req, res) => {
    try {
        const threeMonthsAgo = subMonths(new Date(), 5);
        const transaksiList = await Transaksi.find({
            tanggal: { $gte: threeMonthsAgo },
        });
        const monthlyData = {};

        transaksiList.forEach((transaksi) => {
            const month = new Date(transaksi.tanggal).getMonth() + 1;

            if (!monthlyData[month]) {
                monthlyData[month] = { spend: 0, earn: 0 };
            }

            if (transaksi.isPengeluaran) {
                monthlyData[month].spend += transaksi.jumlah;
            } else {
                monthlyData[month].earn += transaksi.jumlah;
            }
        });

        const result = Object.keys(monthlyData)
            .map((month) => ({
                month,
                spend: monthlyData[month].spend,
                earn: monthlyData[month].earn,
            }))
            .sort((a, b) => a.month - b.month)
            .slice(-6);

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch monthly spend/earn" });
    }
};

// Get Transaksi by Date
exports.getTransaksiByDate = async (req, res) => {
    const { date } = req.query; // Expecting 'YYYY-MM-DD'
    try {
        console.log(`Received date: ${date}`);

        // Validate the date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({ error: "Invalid date format. Use 'YYYY-MM-DD'." });
        }

        // Convert the date string to a Date object at the start of the day
        const startDate = new Date(`${date}T00:00:00Z`);
        if (isNaN(startDate)) {
            return res.status(400).json({ error: "Invalid date format. Use 'YYYY-MM-DD'." });
        }

        // Get the timestamp for the start date
        const startTimestamp = startDate.getTime();

        // Set the end date to the start of the next day and get its timestamp
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        const endTimestamp = endDate.getTime();

        console.log(`Start Timestamp: ${startTimestamp}`);
        console.log(`End Timestamp: ${endTimestamp}`);

        // Query for transactions on the specified date
        const transaksiList = await Transaksi.find({
            tanggal: {
                $gte: startTimestamp,
                $lt: endTimestamp
            }
            // tanggal: startTimestamp
            // jumlah: 20000
        }).sort({ tanggal: -1 });

        console.log(`Fetched transaksi list: ${transaksiList}`);

        res.status(200).json(transaksiList);
    } catch (error) {
        console.error(`Error fetching transaksi by date: ${error}`);
        res.status(500).json({ error: "Failed to fetch transaksi by date" });
    }
};


// Get Summarize Months
exports.getSummarizeMonths = async (req, res) => {
    try {
        const transaksiList = await Transaksi.find();
        const monthlySummary = {};

        transaksiList.forEach((transaksi) => {
            try {
                const monthKey = `${transaksi.tanggal.getFullYear()}-${(
                    transaksi.tanggal.getMonth() + 1
                )
                    .toString()
                    .padStart(2, "0")}`;

                if (!monthlySummary[monthKey]) {
                    monthlySummary[monthKey] = {
                        datetime: startOfMonth(transaksi.tanggal),
                        totalPengeluaran: 0,
                        totalPemasukan: 0,
                        categoryCount: {},
                    };
                }

                if (transaksi.isPengeluaran) {
                    monthlySummary[monthKey].totalPengeluaran += transaksi.jumlah;
                } else {
                    monthlySummary[monthKey].totalPemasukan += transaksi.jumlah;
                }

                transaksi.kategori.forEach((category) => {
                    if (!monthlySummary[monthKey].categoryCount[category]) {
                        monthlySummary[monthKey].categoryCount[category] = 0;
                    }
                    monthlySummary[monthKey].categoryCount[category] += 1;
                });
            } catch (err) {
                console.error(`Error processing transaction with ID ${transaksi._id}:`, err);
            }
        });

        const summaries = Object.keys(monthlySummary)
            .map((key) => {
                const sortedCategories = Object.entries(
                    monthlySummary[key].categoryCount
                ).sort((a, b) => b[1] - a[1]);
                const topCategories = sortedCategories
                    .slice(0, 3)
                    .map((entry) => entry[0]);

                return {
                    datetime: monthlySummary[key].datetime,
                    totalPengeluaran: monthlySummary[key].totalPengeluaran,
                    totalPemasukan: monthlySummary[key].totalPemasukan,
                    topCategories,
                };
            })
            .sort((a, b) => b.datetime - a.datetime);

        res.status(200).json(summaries);
    } catch (error) {
        console.error("Error summarizing months:", error);
        res.status(500).json({ error: "Failed to summarize months" });
    }
};

// Update Transaksi
exports.updateTransaksi = async (req, res) => {
    const { id } = req.params;
    const { aktifitas, jumlah, isPengeluaran, tanggal, kategori, catatan } =
        req.body;
    try {
        const transaksi = await Transaksi.findByIdAndUpdate(
            id,
            {
                aktifitas,
                jumlah,
                isPengeluaran,
                tanggal,
                kategori,
                catatan,
            },
            { new: true }
        );
        res.status(200).json(transaksi);
    } catch (error) {
        res.status(500).json({ error: "Failed to update transaksi" });
    }
};

// Delete Transaksi
exports.deleteTransaksi = async (req, res) => {
    const { id } = req.params;
    try {
        await Transaksi.findByIdAndDelete(id);
        res.status(200).json({ message: "Transaksi deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete transaksi" });
    }
};

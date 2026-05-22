import Transaction from "../models/transaction.js";

const getTransactions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Transaction.countDocuments();
    const transactions = await Transaction.find()
      .populate("userId ticketId")
      .skip(skip)
      .limit(limit);

    res.json({
      data: transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const generateFinancialReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const transactions = await Transaction.find({
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
    });

    const revenue = transactions
      .filter((t) => t.type === "purchase")
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.type === "refund")
      .reduce((sum, t) => sum + t.amount, 0);
    const netProfit = revenue - expenses;

    res.json({ startDate, endDate, revenue, expenses, netProfit });
  } catch (error) {
    next(error);
  }
};

export { getTransactions, generateFinancialReport };

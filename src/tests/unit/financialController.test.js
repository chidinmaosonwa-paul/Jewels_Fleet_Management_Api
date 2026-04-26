/**
 * Financial controller unit tests.
 * Mocks the Transaction model — no live DB required.
 */
import { jest } from '@jest/globals';

//Mocks
const mockFind = jest.fn();

jest.unstable_mockModule('../../app/models/transaction.js', () => ({
  default: { find: mockFind },
}));

const { getTransactions, generateFinancialReport } =
  await import('../../app/controllers/financialController.js');

//Helpers
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = jest.fn();

const makeTx = (type, amount) => ({ type, amount });

beforeEach(() => { jest.clearAllMocks(); });

//getTransactions
describe('getTransactions', () => {
  it('returns all transactions populated with userId and ticketId', async () => {
    const txList = [makeTx('purchase', 5000), makeTx('refund', 5000)];
    mockFind.mockReturnValue({ populate: jest.fn().mockResolvedValue(txList) });

    const res = mockRes();
    await getTransactions({}, res, mockNext);

    expect(mockFind).toHaveBeenCalledWith();
    expect(res.json).toHaveBeenCalledWith(txList);
  });

  it('calls next(error) when Transaction.find throws', async () => {
    const err = new Error('DB error');
    mockFind.mockReturnValue({ populate: jest.fn().mockRejectedValue(err) });
    await getTransactions({}, mockRes(), mockNext);
    expect(mockNext).toHaveBeenCalledWith(err);
  });
});

//generateFinancialReport
describe('generateFinancialReport', () => {
  it('calculates revenue, expenses, and net profit correctly', async () => {
    mockFind.mockResolvedValue([
      makeTx('purchase', 10000),
      makeTx('purchase', 5000),
      makeTx('refund',   3000),
    ]);

    const req = { query: { startDate: '2024-03-01', endDate: '2024-03-31' } };
    const res = mockRes();
    await generateFinancialReport(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      revenue:   15000,   // 10000 + 5000
      expenses:   3000,
      netProfit: 12000,   // 15000 - 3000
    }));
  });

  it('returns zero values when no transactions exist', async () => {
    mockFind.mockResolvedValue([]);
    const req = { query: { startDate: '2025-01-01', endDate: '2025-01-31' } };
    const res = mockRes();
    await generateFinancialReport(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      revenue:   0,
      expenses:  0,
      netProfit: 0,
    }));
  });

  it('returns zero net profit when revenue equals expenses', async () => {
    mockFind.mockResolvedValue([
      makeTx('purchase', 8000),
      makeTx('refund',   8000),
    ]);
    const req = { query: { startDate: '2024-06-01', endDate: '2024-06-30' } };
    const res = mockRes();
    await generateFinancialReport(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ netProfit: 0 }));
  });

  it('passes the date range as a MongoDB query filter', async () => {
    mockFind.mockResolvedValue([]);
    const req = { query: { startDate: '2024-01-01', endDate: '2024-01-31' } };
    await generateFinancialReport(req, mockRes(), mockNext);

    expect(mockFind).toHaveBeenCalledWith(expect.objectContaining({
      createdAt: expect.objectContaining({ $gte: expect.any(Date), $lte: expect.any(Date) }),
    }));
  });

  it('calls next(error) when Transaction.find throws', async () => {
    const err = new Error('DB error');
    mockFind.mockRejectedValue(err);
    await generateFinancialReport({ query: { startDate: '2024-01-01', endDate: '2024-01-31' } }, mockRes(), mockNext);
    expect(mockNext).toHaveBeenCalledWith(err);
  });
});
/**
 * Ticket controller unit tests.
 * Mocks Ticket, Journey, Vehicle, Transaction, and paymentService — no live DB required.
 */
import { jest } from '@jest/globals';

//Mocks
const mockTicketCreate         = jest.fn();
const mockTicketFind           = jest.fn();
const mockTicketFindById       = jest.fn();
const mockJourneyFindById      = jest.fn();
const mockJourneyFindByIdUpdate= jest.fn();
const mockVehicleFindById      = jest.fn();
const mockTransactionCreate    = jest.fn();
const mockProcessPayment       = jest.fn();

jest.unstable_mockModule('../../app/models/ticket.js', () => ({
  default: {
    create:      mockTicketCreate,
    find:        mockTicketFind,
    findById:    mockTicketFindById,
  },
}));

jest.unstable_mockModule('../../app/models/journey.js', () => ({
  default: {
    findById:          mockJourneyFindById,
    findByIdAndUpdate: mockJourneyFindByIdUpdate,
  },
}));

jest.unstable_mockModule('../../app/models/vehicle.js', () => ({
  default: { findById: mockVehicleFindById },
}));

jest.unstable_mockModule('../../app/models/transaction.js', () => ({
  default: { create: mockTransactionCreate },
}));

jest.unstable_mockModule('../../app/services/paymentService.js', () => ({
  processPayment: mockProcessPayment,
}));

const { bookTicket, cancelTicket, getTickets } =
  await import('../../app/controllers/ticketController.js');

//Helpers
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = jest.fn();

const DESTINATION = { _id: 'dest-1', baseFare: 5000 };
const VEHICLE     = { _id: 'veh-1', capacity: 10 };
const makeJourney = (overrides = {}) => ({
  _id: 'journey-1',
  vehicleId: 'veh-1',
  destinationId: DESTINATION,
  availableSeats: 10,
  status: 'scheduled',
  ...overrides,
});
const makeTicket = (overrides = {}) => ({
  _id: 'ticket-1',
  userId: 'user-1',
  journeyId: 'journey-1',
  seatNumber: 1,
  price: 5000,
  status: 'booked',
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

beforeEach(() => { jest.clearAllMocks(); });

//bookTicket
describe('bookTicket', () => {
  it('assigns seat 1 on the first booking (10 seats available)', async () => {
    mockJourneyFindById.mockReturnValue({ populate: jest.fn().mockResolvedValue(makeJourney()) });
    mockVehicleFindById.mockResolvedValue(VEHICLE);
    mockProcessPayment.mockResolvedValue({ success: true });
    mockTicketCreate.mockResolvedValue(makeTicket());
    mockJourneyFindByIdUpdate.mockResolvedValue({});
    mockTransactionCreate.mockResolvedValue({});

    const req = { body: { journeyId: 'journey-1' }, user: { userId: 'user-1' } };
    const res = mockRes();
    await bookTicket(req, res, mockNext);

    // capacity(10) - availableSeats(10) + 1 = 1
    expect(mockTicketCreate).toHaveBeenCalledWith(expect.objectContaining({ seatNumber: 1, price: 5000 }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('assigns seat 3 when 2 seats already taken', async () => {
    mockJourneyFindById.mockReturnValue({ populate: jest.fn().mockResolvedValue(makeJourney({ availableSeats: 8 })) });
    mockVehicleFindById.mockResolvedValue(VEHICLE);
    mockProcessPayment.mockResolvedValue({ success: true });
    mockTicketCreate.mockResolvedValue(makeTicket({ seatNumber: 3 }));
    mockJourneyFindByIdUpdate.mockResolvedValue({});
    mockTransactionCreate.mockResolvedValue({});

    const req = { body: { journeyId: 'journey-1' }, user: { userId: 'user-2' } };
    const res = mockRes();
    await bookTicket(req, res, mockNext);

    // capacity(10) - availableSeats(8) + 1 = 3
    expect(mockTicketCreate).toHaveBeenCalledWith(expect.objectContaining({ seatNumber: 3 }));
  });

  it('responds 400 when journey is not scheduled', async () => {
    mockJourneyFindById.mockReturnValue({ populate: jest.fn().mockResolvedValue(makeJourney({ status: 'completed' })) });
    const res = mockRes();
    await bookTicket({ body: { journeyId: 'j1' }, user: { userId: 'u1' } }, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Journey is not available for booking' });
  });

  it('responds 400 when no available seats', async () => {
    mockJourneyFindById.mockReturnValue({ populate: jest.fn().mockResolvedValue(makeJourney({ availableSeats: 0 })) });
    const res = mockRes();
    await bookTicket({ body: { journeyId: 'j1' }, user: { userId: 'u1' } }, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'No available seats' });
  });

  it('responds 400 when payment fails', async () => {
    mockJourneyFindById.mockReturnValue({ populate: jest.fn().mockResolvedValue(makeJourney()) });
    mockVehicleFindById.mockResolvedValue(VEHICLE);
    mockProcessPayment.mockResolvedValue({ success: false });
    const res = mockRes();
    await bookTicket({ body: { journeyId: 'j1' }, user: { userId: 'u1' } }, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Payment failed' });
  });

  it('creates a purchase transaction on successful booking', async () => {
    mockJourneyFindById.mockReturnValue({ populate: jest.fn().mockResolvedValue(makeJourney()) });
    mockVehicleFindById.mockResolvedValue(VEHICLE);
    mockProcessPayment.mockResolvedValue({ success: true });
    mockTicketCreate.mockResolvedValue(makeTicket());
    mockJourneyFindByIdUpdate.mockResolvedValue({});
    mockTransactionCreate.mockResolvedValue({});

    await bookTicket({ body: { journeyId: 'j1' }, user: { userId: 'u1' } }, mockRes(), mockNext);
    expect(mockTransactionCreate).toHaveBeenCalledWith(expect.objectContaining({ type: 'purchase', amount: 5000 }));
  });
});

//cancelTicket
describe('cancelTicket', () => {
  it('ticket owner can cancel their own ticket', async () => {
    const ticket = makeTicket();
    mockTicketFindById.mockResolvedValue(ticket);
    mockJourneyFindByIdUpdate.mockResolvedValue({});
    mockTransactionCreate.mockResolvedValue({});

    const res = mockRes();
    await cancelTicket({ params: { id: 'ticket-1' }, user: { userId: 'user-1', role: 'user' } }, res, mockNext);
    expect(ticket.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ message: 'Ticket cancelled successfully' });
  });

  it('creates a refund transaction on cancellation', async () => {
    const ticket = makeTicket();
    mockTicketFindById.mockResolvedValue(ticket);
    mockJourneyFindByIdUpdate.mockResolvedValue({});
    mockTransactionCreate.mockResolvedValue({});

    await cancelTicket({ params: { id: 'ticket-1' }, user: { userId: 'user-1', role: 'user' } }, mockRes(), mockNext);
    expect(mockTransactionCreate).toHaveBeenCalledWith(expect.objectContaining({ type: 'refund', amount: 5000 }));
  });

  it('responds 400 when ticket is already cancelled', async () => {
    mockTicketFindById.mockResolvedValue(makeTicket({ status: 'cancelled' }));
    const res = mockRes();
    await cancelTicket({ params: { id: 'ticket-1' }, user: { userId: 'user-1', role: 'user' } }, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Ticket already cancelled' });
  });

  it('responds 403 when a different user tries to cancel', async () => {
    mockTicketFindById.mockResolvedValue(makeTicket({ userId: 'user-1' }));
    const res = mockRes();
    await cancelTicket({ params: { id: 'ticket-1' }, user: { userId: 'user-2', role: 'user' } }, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('admin can cancel any ticket', async () => {
    const ticket = makeTicket({ userId: 'user-1' });
    mockTicketFindById.mockResolvedValue(ticket);
    mockJourneyFindByIdUpdate.mockResolvedValue({});
    mockTransactionCreate.mockResolvedValue({});

    const res = mockRes();
    await cancelTicket({ params: { id: 'ticket-1' }, user: { userId: 'admin-id', role: 'admin' } }, res, mockNext);
    expect(res.json).toHaveBeenCalledWith({ message: 'Ticket cancelled successfully' });
  });
});

//getTickets
describe('getTickets', () => {
  it('user sees only their own tickets', async () => {
    const ownTicket = makeTicket();
    mockTicketFind.mockReturnValue({ populate: jest.fn().mockResolvedValue([ownTicket]) });
    const res = mockRes();
    await getTickets({ user: { userId: 'user-1', role: 'user' } }, res, mockNext);
    expect(mockTicketFind).toHaveBeenCalledWith({ userId: 'user-1' });
  });

  it('admin sees all tickets (empty filter)', async () => {
    mockTicketFind.mockReturnValue({ populate: jest.fn().mockResolvedValue([makeTicket(), makeTicket()]) });
    const res = mockRes();
    await getTickets({ user: { userId: 'admin-id', role: 'admin' } }, res, mockNext);
    expect(mockTicketFind).toHaveBeenCalledWith({});
  });
});
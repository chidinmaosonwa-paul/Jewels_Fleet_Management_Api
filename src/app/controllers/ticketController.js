import Ticket from '../models/ticket.js';
import Journey from '../models/journey.js';
import Vehicle from '../models/vehicle.js';
import Transaction from '../models/transaction.js';
import { processPayment } from '../services/paymentService.js';

const bookTicket = async (req, res, next) => {
  try {
    const { journeyId } = req.body;
    const userId = req.user.userId;

    const journey = await Journey.findById(journeyId).populate('destinationId');
    if (!journey) {
      return res.status(404).json({ message: 'Journey not found' });
    }
    if (journey.status !== 'scheduled') {
      return res.status(400).json({ message: 'Journey is not available for booking' });
    }
    if (journey.availableSeats === 0) {
      return res.status(400).json({ message: 'No available seats' });
    }

    const vehicle = await Vehicle.findById(journey.vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const price = journey.destinationId.baseFare;
    const paymentResult = await processPayment(userId, price);
    if (!paymentResult.success) {
      return res.status(400).json({ message: 'Payment failed' });
    }

    //Seat number = total capacity minus remaining seats + 1
    const seatNumber = vehicle.capacity - journey.availableSeats + 1;

    const ticket = await Ticket.create({
      userId,
      journeyId,
      seatNumber,
      status: 'booked',
      price,
    });

    await Journey.findByIdAndUpdate(journeyId, { $inc: { availableSeats: -1 } });
    await Transaction.create({ userId, ticketId: ticket._id, amount: price, type: 'purchase' });

    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
};

const cancelTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    //Only the ticket owner or an admin can cancel
    if (ticket.userId.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this ticket' });
    }
    if (ticket.status === 'cancelled') {
      return res.status(400).json({ message: 'Ticket already cancelled' });
    }

    ticket.status = 'cancelled';
    await ticket.save();

    await Journey.findByIdAndUpdate(ticket.journeyId, { $inc: { availableSeats: 1 } });
    await Transaction.create({
      userId: ticket.userId,
      ticketId: ticket._id,
      amount: ticket.price,
      type: 'refund',
    });

    res.json({ message: 'Ticket cancelled successfully' });
  } catch (error) {
    next(error);
  }
};

//Admin: get all tickets. User: get only their own tickets.
const getTickets = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { userId: req.user.userId };
    const tickets = await Ticket.find(filter).populate('userId journeyId');
    res.json(tickets);
  } catch (error) {
    next(error);
  }
};

export { bookTicket, cancelTicket, getTickets };
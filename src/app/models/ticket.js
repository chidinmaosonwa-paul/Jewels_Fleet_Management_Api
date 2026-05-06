import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  journeyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Journey', required: true },
  seatNumber: { type: Number, required: true },
  status: { type: String, enum: ['booked', 'cancelled'], required: true },
  price: { type: Number, required: true },
  passengerDetails: {
    gender: { type: String, required: true },
    occupation: { type: String, required: true },
    nextOfKinName: { type: String, required: true },
    nextOfKinPhone: { type: String, required: true },
    nextOfKinRelationship: { type: String, required: true },
  },
}, { timestamps: true });

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;
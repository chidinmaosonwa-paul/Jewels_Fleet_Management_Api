import Journey from '../models/journey.js';
import Vehicle from '../models/vehicle.js';
import Ticket from '../models/ticket.js';

const createJourney = async (req, res, next) => {
  try {
    const { vehicleId, destinationId, departureTime } = req.body;
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    const journey = await Journey.create({
      vehicleId,
      destinationId,
      departureTime,
      availableSeats: vehicle.capacity,
      status: 'scheduled',
    });
    res.status(201).json(journey);
  } catch (error) {
    next(error);
  }
};

const getJourneys = async (req, res, next) => {
  try {
    const journeys = await Journey.find().populate('vehicleId destinationId');
    res.json(journeys);
  } catch (error) {
    next(error);
  }
};

const updateJourney = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { vehicleId, destinationId, departureTime } = req.body;

    const journey = await Journey.findById(id);
    if (!journey) {
      return res.status(404).json({ message: 'Journey not found' });
    }
    if (journey.status !== 'scheduled') {
      return res.status(400).json({ message: 'Only scheduled journeys can be updated' });
    }

    const updates = {};

    //If the vehicle is being swapped, recalculate availableSeats
    if (vehicleId && vehicleId !== journey.vehicleId.toString()) {
      const newVehicle = await Vehicle.findById(vehicleId);
      if (!newVehicle) {
        return res.status(404).json({ message: 'New vehicle not found' });
      }
      const currentVehicle = await Vehicle.findById(journey.vehicleId);
      const bookedSeats = currentVehicle.capacity - journey.availableSeats;

      if (newVehicle.capacity < bookedSeats) {
        return res.status(400).json({
          message: `New vehicle capacity (${newVehicle.capacity}) is too small — ${bookedSeats} seats already booked`,
        });
      }
      updates.vehicleId = vehicleId;
      updates.availableSeats = newVehicle.capacity - bookedSeats;
    }

    if (destinationId) updates.destinationId = destinationId;
    if (departureTime) updates.departureTime = departureTime;

    const updatedJourney = await Journey.findByIdAndUpdate(id, updates, { new: true })
      .populate('vehicleId destinationId');

    res.json(updatedJourney);
  } catch (error) {
    next(error);
  }
};

const updateJourneyStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedJourney = await Journey.findByIdAndUpdate(id, { status }, { new: true });
    if (!updatedJourney) {
      return res.status(404).json({ message: 'Journey not found' });
    }
    res.json(updatedJourney);
  } catch (error) {
    next(error);
  }
};

const deleteJourney = async (req, res, next) => {
  try {
    const { id } = req.params;
    const journey = await Journey.findById(id);
    if (!journey) {
      return res.status(404).json({ message: 'Journey not found' });
    }
    if (['in_progress', 'completed'].includes(journey.status)) {
      return res.status(400).json({
        message: `Cannot delete a journey with status '${journey.status}'`,
      });
    }

    //Block deletion if any active (non-cancelled) tickets exist
    const activeTickets = await Ticket.countDocuments({ journeyId: id, status: 'booked' });
    if (activeTickets > 0) {
      return res.status(400).json({
        message: `Cannot delete journey — ${activeTickets} active ticket(s) exist. Cancel them first.`,
      });
    }

    await Journey.findByIdAndDelete(id);
    res.json({ message: 'Journey deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export { createJourney, getJourneys, updateJourney, updateJourneyStatus, deleteJourney };
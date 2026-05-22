import Vehicle from '../models/vehicle.js';

const createVehicle = async (req, res, next) => {
  try {
    const { plateNumber, model, capacity, status, assignedDriverId } = req.body;
    const vehicle = await Vehicle.create({ plateNumber, model, capacity, status, assignedDriverId });
    res.status(201).json(vehicle);
  } catch (error) {
    next(error);
  }
};

const getVehicles = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Vehicle.countDocuments();
    const vehicles = await Vehicle.find().skip(skip).limit(limit);

    res.json({
      data: vehicles,
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

const updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedVehicle = await Vehicle.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedVehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json(updatedVehicle);
  } catch (error) {
    next(error);
  }
};

const deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedVehicle = await Vehicle.findByIdAndDelete(id);
    if (!deletedVehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export { createVehicle, getVehicles, updateVehicle, deleteVehicle };
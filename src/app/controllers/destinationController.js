import Destination from "../models/destination.js";

const createDestination = async (req, res, next) => {
  try {
    const { name, distance, baseFare } = req.body;
    const destination = await Destination.create({ name, distance, baseFare });
    res.status(201).json(destination);
  } catch (error) {
    next(error);
  }
};

const getDestinations = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Destination.countDocuments();
    const destinations = await Destination.find().skip(skip).limit(limit);

    res.json({
      data: destinations,
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

const updateDestination = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedDestination = await Destination.findByIdAndUpdate(
      id,
      req.body,
      { new: true },
    );
    if (!updatedDestination) {
      return res.status(404).json({ message: "Destination not found" });
    }
    res.json(updatedDestination);
  } catch (error) {
    next(error);
  }
};

const deleteDestination = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedDestination = await Destination.findByIdAndDelete(id);
    if (!deletedDestination) {
      return res.status(404).json({ message: "Destination not found" });
    }
    res.json({ message: "Destination deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export {
  createDestination,
  getDestinations,
  updateDestination,
  deleteDestination,
};

import Joi from 'joi';

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message);
      return res.status(400).json({ error: messages });
    }
    next();
  };
};

// Auth

const userSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(50).required(),
  role: Joi.string().valid('admin', 'driver', 'user').default('user'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Fleet

const vehicleSchema = Joi.object({
  plateNumber: Joi.string().required(),
  model: Joi.string().required(),
  capacity: Joi.number().integer().min(1).required(),
  status: Joi.string().valid('active', 'in_maintenance', 'retired').required(),
  assignedDriverId: Joi.string().allow(null, '').optional(),
});

//PUT only requires at least one field — all are optional but cannot be empty body
const vehicleUpdateSchema = Joi.object({
  plateNumber: Joi.string(),
  model: Joi.string(),
  capacity: Joi.number().integer().min(1),
  status: Joi.string().valid('active', 'in_maintenance', 'retired'),
  assignedDriverId: Joi.string().allow(null, '').optional(),
}).min(1);

//Destination

const destinationSchema = Joi.object({
  name: Joi.string().required(),
  distance: Joi.number().positive().required(),
  baseFare: Joi.number().positive().required(),
});

const destinationUpdateSchema = Joi.object({
  name: Joi.string(),
  distance: Joi.number().positive(),
  baseFare: Joi.number().positive(),
}).min(1);

// Journey

const journeySchema = Joi.object({
  vehicleId: Joi.string().required(),
  destinationId: Joi.string().required(),
  departureTime: Joi.date().iso().greater('now').required(),
});

const journeyStatusSchema = Joi.object({
  status: Joi.string()
    .valid('scheduled', 'in_progress', 'completed', 'cancelled')
    .required(),
});

//All fields optional for partial updates, but body cannot be empty
const journeyUpdateSchema = Joi.object({
  vehicleId: Joi.string(),
  destinationId: Joi.string(),
  departureTime: Joi.date().iso().greater('now'),
}).min(1);

// Ticket

const ticketBookSchema = Joi.object({
  journeyId: Joi.string().required(),
});

// Report

const reportSchema = Joi.object({
  journeyId: Joi.string().required(),
  driverId: Joi.string().optional(),         // admin only; drivers get it from their token
  passengerFeedback: Joi.array().items(Joi.string()).optional(),
  issuesReported: Joi.string().allow('').optional(),
  journeyDuration: Joi.number().positive().required(),
  fuelConsumption: Joi.number().positive().optional(),
});

export {
  validate,
  userSchema,
  loginSchema,
  vehicleSchema,
  vehicleUpdateSchema,
  destinationSchema,
  destinationUpdateSchema,
  journeySchema,
  journeyStatusSchema,
  journeyUpdateSchema,
  ticketBookSchema,
  reportSchema,
}
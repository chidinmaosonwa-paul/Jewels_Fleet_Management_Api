import Report from "../models/report.js";
import Ticket from "../models/ticket.js";
import Journey from "../models/journey.js";
import { generatePDF } from "../services/pdfService.js";

const createReport = async (req, res, next) => {
  try {
    const {
      journeyId,
      passengerFeedback,
      issuesReported,
      journeyDuration,
      fuelConsumption,
    } = req.body;

    //Drivers always submit under their own ID; admins may supply any driverId
    const driverId =
      req.user.role === "driver"
        ? req.user.userId
        : (req.body.driverId ?? req.user.userId);

    const report = await Report.create({
      journeyId,
      driverId,
      passengerFeedback,
      issuesReported,
      journeyDuration,
      fuelConsumption,
    });

    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
};

const getReports = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    //Drivers see only their own reports while admins see everything
    const filter =
      req.user.role === "driver" ? { driverId: req.user.userId } : {};
    const total = await Report.countDocuments(filter);
    const reports = await Report.find(filter)
      .populate({
        path: "journeyId",
        populate: { path: "destinationId" },
      })
      .populate("driverId")
      .skip(skip)
      .limit(limit);

    res.json({
      data: reports,
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

const generatePassengerManifest = async (req, res, next) => {
  try {
    const { journeyId } = req.params;

    const journey = await Journey.findById(journeyId)
      .populate("vehicleId")
      .populate("destinationId");

    if (!journey) {
      return res.status(404).json({ message: "Journey not found" });
    }

    const tickets = await Ticket.find({ journeyId, status: "booked" }).populate(
      "userId",
    );

    const pdfBuffer = await generatePDF(journey, tickets);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="manifest-${journeyId}.pdf"`,
    );
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

export { createReport, getReports, generatePassengerManifest };

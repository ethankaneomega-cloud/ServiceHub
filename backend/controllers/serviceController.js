const mongoose = require('mongoose');
const Service = require('../models/Service');
const Worker = require('../models/Worker');
const Booking = require('../models/Booking');

const DEFAULT_SERVICES = [
  {
    id: 'plumbing',
    name: 'Plumbing',
    description: 'Fix leaks, install pipes, repair fixtures, and more.',
    icon: '🔧',
    avgRate: 500,
  },
  {
    id: 'electrical',
    name: 'Electrical',
    description: 'Wiring, panel upgrades, outlet installation, and repairs.',
    icon: '⚡',
    avgRate: 600,
  },
  {
    id: 'cleaning',
    name: 'Cleaning',
    description: 'Deep cleaning, regular maintenance, post-renovation cleaning.',
    icon: '🧹',
    avgRate: 300,
  },
  {
    id: 'carpentry',
    name: 'Carpentry',
    description: 'Furniture repair, custom builds, cabinet installation.',
    icon: '🪚',
    avgRate: 450,
  },
  {
    id: 'painting',
    name: 'Painting',
    description: 'Interior and exterior painting, wall finishing.',
    icon: '🎨',
    avgRate: 400,
  },
  {
    id: 'hvac',
    name: 'HVAC',
    description: 'Air conditioning installation, maintenance and repair.',
    icon: '❄️',
    avgRate: 700,
  },
  {
    id: 'landscaping',
    name: 'Landscaping',
    description: 'Garden design, lawn care, tree trimming.',
    icon: '🌿',
    avgRate: 350,
  },
  {
    id: 'pest_control',
    name: 'Pest Control',
    description: 'Termite treatment, rodent control, general pest management.',
    icon: '🐛',
    avgRate: 500,
  },
  {
    id: 'appliance_repair',
    name: 'Appliance Repair',
    description: 'Fix washers, dryers, refrigerators, and other appliances.',
    icon: '🔌',
    avgRate: 400,
  },
  {
    id: 'general_repair',
    name: 'General Repair',
    description: 'Handyman services for various home repairs.',
    icon: '🏠',
    avgRate: 350,
  },
];

const slugifyServiceName = (name = '') =>
  name
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');

const serviceQueryFromParam = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) return { _id: id };
  return { id };
};

const seedDefaultServices = async () => {
  const count = await Service.countDocuments();
  if (count === 0) {
    await Service.insertMany(DEFAULT_SERVICES, { ordered: false });
  }
};

// @desc    Get all active service types
// @route   GET /api/services
// @access  Public
const getServices = async (req, res, next) => {
  try {
    await seedDefaultServices();
    const services = await Service.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, services });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all services for admin
// @route   GET /api/services/admin/all
// @access  Private (admin)
const getAllServices = async (req, res, next) => {
  try {
    await seedDefaultServices();
    const services = await Service.find().sort({ createdAt: -1 });
    res.json({ success: true, count: services.length, services });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a service
// @route   POST /api/services
// @access  Private (admin)
const createService = async (req, res, next) => {
  try {
    const { name, description, icon, avgRate, isActive = true } = req.body;
    const serviceId = slugifyServiceName(req.body.id || name);

    if (!serviceId) {
      return res.status(400).json({ success: false, message: 'Service name is required.' });
    }

    const service = await Service.create({
      id: serviceId,
      name,
      description,
      icon: icon || '🛠️',
      avgRate,
      isActive,
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully.',
      service,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Private (admin)
const updateService = async (req, res, next) => {
  try {
    const { name, description, icon, avgRate, isActive } = req.body;

    const update = {};
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (icon !== undefined) update.icon = icon || '🛠️';
    if (avgRate !== undefined) update.avgRate = avgRate;
    if (isActive !== undefined) update.isActive = isActive;

    const service = await Service.findOneAndUpdate(serviceQueryFromParam(req.params.id), update, {
      new: true,
      runValidators: true,
    });

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    res.json({ success: true, message: 'Service updated successfully.', service });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Private (admin)
const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findOne(serviceQueryFromParam(req.params.id));

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }

    const [workersUsingService, bookingsUsingService] = await Promise.all([
      Worker.countDocuments({ serviceType: service.id }),
      Booking.countDocuments({ serviceType: service.id }),
    ]);

    if (workersUsingService > 0 || bookingsUsingService > 0) {
      return res.status(400).json({
        success: false,
        message:
          'This service is already used by workers or bookings. Deactivate it instead of deleting it.',
      });
    }

    await service.deleteOne();

    res.json({ success: true, message: 'Service deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getServices,
  getAllServices,
  createService,
  updateService,
  deleteService,
  seedDefaultServices,
  DEFAULT_SERVICES,
};

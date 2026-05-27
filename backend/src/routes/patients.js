const express = require('express');
const { PrismaClient } = require('@prisma/client');
const {
  authenticate,
  authorizeAdminOnlyLegacy,
} = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/patients
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      search,
      gender,
      page = 1,
      limit = 5,
    } = req.query;

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);

    const where = {};

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          phoneNumber: {
            contains: search,
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (gender && gender !== 'All') {
      where.gender = {
        equals: gender,
        mode: 'insensitive',
      };
    }

    const [patients, totalPatients] =
      await Promise.all([
        prisma.patient.findMany({
          where,
          orderBy: {
            createdAt: 'desc',
          },
          skip: (pageNumber - 1) * pageSize,
          take: pageSize,
        }),
        prisma.patient.count({ where }),
      ]);

    return res.json({
      success: true,
      patients,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        totalPatients,
        totalPages: Math.ceil(
          totalPatients / pageSize
        ),
      },
    });
  } catch (error) {
    console.error(
      '[PATIENTS] Fetch error:',
      error
    );

    return res.status(500).json({
      error: 'Failed to fetch patients',
    });
  }
});

// GET /api/patients/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        appointments: true,
      },
    });

    if (!patient) {
      return res.status(404).json({
        error: 'Patient not found',
      });
    }

    return res.json(patient);
  } catch (error) {
    console.error(
      '[PATIENTS] Fetch by id error:',
      error
    );

    return res.status(500).json({
      error: 'Failed to fetch patient',
    });
  }
});

// POST /api/patients
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      age,
      gender,
      medicalHistory,
    } = req.body;

    if (
      !name ||
      !phoneNumber ||
      !age ||
      !gender
    ) {
      return res.status(400).json({
        error:
          'Name, phoneNumber, age and gender are required',
      });
    }

    if (!/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({
        error:
          'Phone number must contain exactly 10 digits',
      });
    }

    const patient = await prisma.patient.create({
      data: {
        name,
        email: email || null,
        phoneNumber,
        age: parseInt(age),
        gender,
        medicalHistory:
          medicalHistory || null,
      },
    });

    return res.status(201).json(patient);
  } catch (error) {
    console.error(
      '[PATIENTS] Registration error:',
      error
    );

    return res.status(500).json({
      error: 'Failed to register patient',
    });
  }
});

// DELETE /api/patients/:id
router.delete(
  '/:id',
  authenticate,
  authorizeAdminOnlyLegacy,
  async (req, res) => {
    try {
      const { id } = req.params;

      const patient =
        await prisma.patient.findUnique({
          where: { id },
        });

      if (!patient) {
        return res.status(404).json({
          error: 'Patient not found',
        });
      }

      await prisma.patient.delete({
        where: { id },
      });

      return res.json({
        message: `Successfully deleted patient ${patient.name}`,
      });
    } catch (error) {
      console.error(
        '[PATIENTS] Delete error:',
        error
      );

      return res.status(500).json({
        error: 'Failed to delete patient',
      });
    }
  }
);

module.exports = router;
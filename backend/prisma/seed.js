const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@haqms.com' },
    update: {},
    create: {
      email: 'admin@haqms.com',
      password,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  const receptionist = await prisma.user.upsert({
    where: { email: 'reception1@haqms.com' },
    update: {},
    create: {
      email: 'reception1@haqms.com',
      password,
      name: 'Receptionist User',
      role: 'RECEPTIONIST',
    },
  });

  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor1@haqms.com' },
    update: {},
    create: {
      email: 'doctor1@haqms.com',
      password,
      name: 'Doctor User',
      role: 'DOCTOR',
    },
  });

  const doctor = await prisma.doctor.create({
    data: {
      name: 'Dr. Strange',
      specialization: 'Cardiology',
      department: 'Cardiology',
      experience: 10,
      consultationFee: 500,
      userId: doctorUser.id,
    },
  });

  const patient1 = await prisma.patient.create({
    data: {
      name: 'Clark Kent',
      phoneNumber: '9999999991',
      age: 30,
      gender: 'Male',
      medicalHistory: null,
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      name: 'Bruce Wayne',
      phoneNumber: '9999999992',
      age: 35,
      gender: 'Male',
      medicalHistory: null,
    },
  });

  console.log('Seed completed');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
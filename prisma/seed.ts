import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting SaaS database seed...')

  // 1. CREATE MASTER ORGANIZATION
  const org = await prisma.organization.upsert({
    where: { email: 'admin@labseven.com' },
    update: {},
    create: {
      name: 'Lab Seven HQ',
      email: 'admin@labseven.com',
      plan: 'Unlimited',
    },
  })
  console.log('✅ Organization created:', org.name)

  // 2. CREATE MASTER ADMIN USER
  const hashedPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'System Admin',
      email: 'admin@labseven.com',
      organizationId: org.id, // Links user to the lab
    },
  })
  console.log('✅ Admin login created (User: admin, Pass: admin123)')

  // 3. CREATE DEFAULT LAB PROFILE
  const existingProfile = await prisma.labProfile.findFirst({
    where: { organizationId: org.id }
  });
  if (!existingProfile) {
    await prisma.labProfile.create({
      data: {
        name: 'Lab Seven HQ',
        address: '123 Health Avenue, Medical District',
        phone: '+1 234 567 890',
        organizationId: org.id,
      },
    })
    console.log('✅ Default Lab Profile created')
  }

  console.log('🧪 Seeding Master Laboratory Data...')

  // 4. DEPARTMENTS
  const deptHemo = await prisma.department.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'DEPT-001' } },
    update: {},
    create: { name: 'HEMATOLOGY', code: 'DEPT-001', isActive: true, organizationId: org.id },
  })

  // 5. SPECIMENS
  const specBlood = await prisma.specimen.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'SPC-001' } },
    update: {},
    create: { name: 'Whole Blood', code: 'SPC-001', type: 'Liquid', organizationId: org.id },
  })

  // 6. VACUTAINERS
  const vacEdta = await prisma.vacutainer.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'VAC-001' } },
    update: {},
    create: { name: 'EDTA (Purple)', code: 'VAC-001', color: '#9c27b0', organizationId: org.id },
  })

  // 7. METHODS
  const methodAuto = await prisma.method.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'MTH-001' } },
    update: {},
    create: { name: 'Automated Cell Counter', code: 'MTH-001', organizationId: org.id },
  })

  // 8. PARAMETERS
  const paramHb = await prisma.parameter.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'PAR-0001' } },
    update: {},
    create: {
      name: 'Hemoglobin',
      code: 'PAR-0001',
      unit: 'g/dL',
      department: 'HEMATOLOGY',
      inputType: 'Numerical',
      decimals: 1,
      gender: 'Both',
      organizationId: org.id,
      ranges: {
        create: [
          {
            gender: 'Male',
            minAge: 0, maxAge: 100,
            lowRange: 13.5, highRange: 17.5,
            normalValue: '13.5 - 17.5',
            organizationId: org.id
          }
        ]
      }
    }
  })

  // 9. TESTS
  await prisma.test.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'TST-0001' } },
    update: {},
    create: {
      name: 'Complete Blood Count (CBC)',
      code: 'TST-0001',
      displayName: 'COMPLETE BLOOD COUNT',
      price: 500,
      type: 'Test',
      organizationId: org.id,
      
      // FIX: Use the direct ID fields instead of connect!
      departmentId: deptHemo.id,
      specimenId: specBlood.id,
      vacutainerId: vacEdta.id,
      methodId: methodAuto.id,

      minHours: 2,
      maxHours: 4,

      reportTitle: 'HAEMATOLOGY REPORT',
      colCaption1: 'Test Name',
      colCaption2: 'Result',
      
      parameters: {
        create: [
          {
            parameterId: paramHb.id,
            order: 1,
            organizationId: org.id
          }
        ]
      }
    }
  })

  console.log('✅ Full SaaS Seed completed successfully!')
}
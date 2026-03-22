// BLOCK prisma/seed.ts OPEN
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // 1. DEPARTMENTS
  const deptHemo = await prisma.department.upsert({
    where: { code: 'DEPT-001' },
    update: {},
    create: { name: 'HEMATOLOGY', code: 'DEPT-001', isActive: true },
  })

  // 2. SPECIMENS
  const specBlood = await prisma.specimen.upsert({
    where: { code: 'SPC-001' },
    update: {},
    create: { name: 'Whole Blood', code: 'SPC-001', type: 'Liquid' },
  })

  // 3. VACUTAINERS
  const vacEdta = await prisma.vacutainer.upsert({
    where: { code: 'VAC-001' },
    update: {},
    create: { name: 'EDTA (Purple)', code: 'VAC-001', color: '#9c27b0' },
  })

  // 4. METHODS
  const methodAuto = await prisma.method.upsert({
    where: { code: 'MTH-001' },
    update: {},
    create: { name: 'Automated Cell Counter', code: 'MTH-001' },
  })

  // 5. PARAMETERS
  const paramHb = await prisma.parameter.upsert({
    where: { code: 'PAR-0001' },
    update: {},
    create: {
      name: 'Hemoglobin',
      code: 'PAR-0001',
      unit: 'g/dL',
      department: 'HEMATOLOGY',
      inputType: 'Numerical',
      decimals: 1,
      gender: 'Both',
      ranges: {
        create: [
          {
            gender: 'Male',
            minAge: 0, maxAge: 100,
            lowRange: 13.5, highRange: 17.5,
            normalValue: '13.5 - 17.5'
          }
        ]
      }
    }
  })

  // 6. TESTS
  console.log('Creating Tests...')
  
  await prisma.test.upsert({
    where: { code: 'TST-0001' },
    update: {},
    create: {
      name: 'Complete Blood Count (CBC)',
      code: 'TST-0001',
      displayName: 'COMPLETE BLOOD COUNT',
      price: 500,
      type: 'Test',
      
      department: { connect: { id: deptHemo.id } },
      specimen: { connect: { id: specBlood.id } },
      vacutainer: { connect: { id: vacEdta.id } },
      method: { connect: { id: methodAuto.id } },

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
            // REMOVED: isHeading (It defaults to false in DB, avoiding the TS error if types aren't synced)
          }
        ]
      }
    }
  })

  console.log('✅ Seed completed successfully.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
// BLOCK prisma/seed.ts CLOSE
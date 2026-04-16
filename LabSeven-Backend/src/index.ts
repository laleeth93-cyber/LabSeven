import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// 🛡️ Security Middleware
import { verifyApiKey } from './middleware/authMiddleware';

// 🚀 Route Modules
import patientListRoutes from './routes/patientListRoutes';
import resultEntryRoutes from './routes/resultEntryRoutes';
import billingRoutes from './routes/billingRoutes';
import testRoutes from './routes/testRoutes';
import parameterRoutes from './routes/parameterRoutes';
import packageRoutes from './routes/packageRoutes';
import departmentRoutes from './routes/departmentRoutes';
import masterRoutes from './routes/masterRoutes';
import patientRoutes from './routes/patientRoutes';
import doctorRoutes from './routes/doctorRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import authorizationRoutes from './routes/authorizationRoutes';
import labProfileRoutes from './routes/labProfileRoutes';
import settingsRoutes from './routes/settingsRoutes';       
import microbiologyRoutes from './routes/microbiologyRoutes'; 
import pdfRoutes from './routes/pdfRoutes';                         
import reportSettingsRoutes from './routes/reportSettingsRoutes';   
import tenantRoutes from './routes/tenantRoutes';           // 🚨 Tenant Features
import saasRoutes from './routes/saasRoutes';               // 🚨 SaaS Onboarding
import authRoutes from './routes/authRoutes';               // 🚨 Auth Engine
import testConfigRoutes from './routes/testConfigRoutes';   // 🚨 Test Config Engine
import superAdminUserRoutes from './routes/superAdminUserRoutes'; // 🚨 Super Admin Engine

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// ==========================================
// 1. GLOBAL MIDDLEWARE
// ==========================================
app.use(cors({ 
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], 
    credentials: true 
}));

// Increased limit to 50mb to allow massive HTML strings for PDF generation
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ==========================================
// 2. PUBLIC ROUTES (Unprotected)
// ==========================================
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Ok', message: 'LabSeven Backend is running lightning fast! ⚡' });
});

// ==========================================
// 3. SECURE API ROUTES
// ==========================================
// 🚨 Apply the Bouncer
app.use('/api', verifyApiKey);

// Attach the separated modules
app.use('/api/auth', authRoutes);                   // 🚨 Attached Auth
app.use('/api/test-config', testConfigRoutes);      // 🚨 Attached Test Config
app.use('/api/super-admin-users', superAdminUserRoutes); // 🚨 Attached Super Admins
app.use('/api/patient-list', patientListRoutes);
app.use('/api/results', resultEntryRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/parameters', parameterRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/masters', masterRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/authorizations', authorizationRoutes);
app.use('/api/lab-profile', labProfileRoutes); 
app.use('/api/settings', settingsRoutes);      
app.use('/api/microbiology', microbiologyRoutes); 
app.use('/api/pdf', pdfRoutes);                           
app.use('/api/report-settings', reportSettingsRoutes);    
app.use('/api/tenant', tenantRoutes); 
app.use('/api/saas', saasRoutes);     

// ==========================================
// 4. START THE SERVER
// ==========================================
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
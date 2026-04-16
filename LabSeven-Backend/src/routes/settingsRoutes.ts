import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'; 

const router = express.Router();
const prisma = new PrismaClient();

// POST: Change User Password
router.post('/change-password', async (req, res) => {
    try {
        const { userId, currentPass, newPass } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User account not found." });
        }

        // Verify current password
        const isCorrect = await bcrypt.compare(currentPass, user.password);
        if (!isCorrect) {
            return res.status(400).json({ success: false, message: "Incorrect current password." });
        }

        // Hash and save new password
        const hashedNewPassword = await bcrypt.hash(newPass, 10);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword }
        });

        res.json({ success: true, message: "Password updated successfully!" });
    } catch (error: any) {
        console.error("Password Change Error:", error);
        res.status(500).json({ success: false, message: "An error occurred while updating your password." });
    }
});

export default router;
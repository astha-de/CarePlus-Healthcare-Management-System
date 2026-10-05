const express = require("express");

const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");
const MedicalRecord = require("../models/MedicalRecord");

const router = express.Router();

router.get("/dashboard", async (req, res) => {
    try {
        // Check login
        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        // Find logged-in patient
        const patient = await Patient.findOne({
            user: req.session.user.id
        });

        if (!patient) {
            return res.status(404).send("Patient profile not found");
        }

        // Get appointments
        const appointments = await Appointment.find({
            patient: patient._id
        })
            .populate("doctor")
            .sort({ appointmentDate: 1 });

        // Upcoming appointments
        const upcomingAppointments = appointments.filter(
            appointment =>
                new Date(appointment.appointmentDate) >= new Date() &&
                appointment.status !== "Cancelled" &&
                appointment.status !== "Completed"
        );

        // Completed appointments
        const completedAppointments = appointments.filter(
            appointment => appointment.status === "Completed"
        );

        res.render("patient/dashboard", {
            patient,
            appointments,
            upcomingAppointments,
            completedAppointments
        });

    } catch (error) {
        console.error("Patient dashboard error:", error);
        res.status(500).send("Unable to load patient dashboard");
    }
});

// ================= PATIENT PROFILE =================

// Profile page
router.get("/profile", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        const patient = await Patient.findOne({
            user: req.session.user.id
        }).populate("user");

        if (!patient) {
            return res.status(404).send("Patient profile not found");
        }

        res.render("patient/profile", {
            patient,
            error: null,
            success: null
        });

    } catch (error) {
        console.error("Profile error:", error);
        res.status(500).send("Unable to load profile");
    }
});


// Update profile
router.post("/profile", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        const {
            phone,
            dateOfBirth,
            gender,
            address,
            bloodGroup,
            emergencyContact
        } = req.body;

        const patient = await Patient.findOne({
    user: req.session.user.id
});

console.log("Logged in User ID:", req.session.user.id);
console.log("Patient found:", patient);

if (!patient) {
    return res.status(404).send("Patient profile not found");
}

        patient.phone = phone;
        patient.dateOfBirth = dateOfBirth || null;
        patient.gender = gender || undefined;
        patient.address = address;
        patient.bloodGroup = bloodGroup;
        patient.emergencyContact = emergencyContact;

        await patient.save();

        res.render("patient/profile", {
            patient: await Patient.findById(patient._id).populate("user"),
            error: null,
            success: "Profile updated successfully!"
        });

    } catch (error) {
        console.error("Profile update error:", error);

        const patient = await Patient.findOne({
            user: req.session.user.id
        }).populate("user");

        res.render("patient/profile", {
            patient,
            error: "Unable to update profile.",
            success: null
        });
    }
});

router.get("/medical-records", async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== "patient") {
            return res.status(403).send("Access denied");
        }

        const patient = await Patient.findOne({
            user: req.session.user.id
        });

        if (!patient) {
            return res.status(404).send("Patient profile not found");
        }

        const medicalRecords = await MedicalRecord.find({
            patient: patient._id
        })
            .populate("doctor")
            .populate("appointment")
            .sort({ recordDate: -1 });

        res.render("patient/medical-records", {
            medicalRecords
        });

    } catch (error) {
        console.error("Medical records error:", error);
        res.status(500).send("Unable to load medical records.");
    }
});

module.exports = router;
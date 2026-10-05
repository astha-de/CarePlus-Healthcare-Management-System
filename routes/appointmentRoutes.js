const express = require("express");
const mongoose = require("mongoose");

const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");

const router = express.Router();


// =====================================================
// PATIENT - BOOK APPOINTMENT PAGE
// =====================================================

router.get("/book/:doctorId", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        if (req.session.user.role !== "patient") {
            return res.status(403).send("Access denied");
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.doctorId)) {
            return res.status(404).send("Doctor not found");
        }

        const doctor = await Doctor.findById(req.params.doctorId)
            .populate("department");

        if (!doctor) {
            return res.status(404).send("Doctor not found");
        }

        res.render("appointments/book", {
            doctor,
            error: null
        });

    } catch (error) {
        console.error("Book appointment page error:", error);
        res.status(500).send("Unable to load appointment page.");
    }
});


// =====================================================
// PATIENT - BOOK APPOINTMENT
// =====================================================

router.post("/book/:doctorId", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        if (req.session.user.role !== "patient") {
            return res.status(403).send("Access denied");
        }

        const {
            appointmentDate,
            appointmentTime,
            reason
        } = req.body;

        const patient = await Patient.findOne({
            user: req.session.user.id
        });

        if (!patient) {
            return res.status(404).send("Patient profile not found");
        }

        const doctor = await Doctor.findById(req.params.doctorId);

        if (!doctor) {
            return res.status(404).send("Doctor not found");
        }

        if (!appointmentDate || !appointmentTime || !reason) {
            return res.render("appointments/book", {
                doctor,
                error: "Please fill all required fields."
            });
        }

        // Check duplicate appointment slot
        const existingAppointment = await Appointment.findOne({
            doctor: doctor._id,
            appointmentDate: new Date(appointmentDate),
            appointmentTime: appointmentTime,
            status: {
                $in: ["Pending", "Confirmed"]
            }
        });

        if (existingAppointment) {
            return res.render("appointments/book", {
                doctor,
                error: "This appointment slot is already booked."
            });
        }

        const appointment = new Appointment({
            patient: patient._id,
            doctor: doctor._id,
            appointmentDate: new Date(appointmentDate),
            appointmentTime: appointmentTime,
            reason: reason.trim(),
            status: "Pending"
        });

        await appointment.save();

        res.redirect(`/appointments/confirmation/${appointment._id}`);

    } catch (error) {
        console.error("Book appointment error:", error);
        res.status(500).send("Unable to book appointment.");
    }
});


// =====================================================
// PATIENT - APPOINTMENT CONFIRMATION
// =====================================================

router.get("/confirmation/:id", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        const appointment = await Appointment.findById(req.params.id)
            .populate("doctor")
            .populate({
                path: "patient",
                populate: {
                    path: "user"
                }
            });

        if (!appointment) {
            return res.status(404).send("Appointment not found");
        }

        res.render("appointments/confirmation", {
            appointment
        });

    } catch (error) {
        console.error("Confirmation error:", error);
        res.status(500).send("Unable to load confirmation.");
    }
});


// =====================================================
// PATIENT - APPOINTMENT HISTORY
// =====================================================

router.get("/history", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        if (req.session.user.role !== "patient") {
            return res.status(403).send("Access denied");
        }

        const patient = await Patient.findOne({
            user: req.session.user.id
        });

        if (!patient) {
            return res.status(404).send("Patient profile not found");
        }

        const appointments = await Appointment.find({
            patient: patient._id
        })
            .populate({
                path: "doctor",
                populate: {
                    path: "department"
                }
            })
            .sort({
                appointmentDate: -1
            });

        res.render("appointments/history", {
            appointments
        });

    } catch (error) {
        console.error("Appointment history error:", error);
        res.status(500).send("Unable to load appointment history.");
    }
});


// =====================================================
// PATIENT - CANCEL APPOINTMENT
// =====================================================

router.post("/cancel/:id", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        if (req.session.user.role !== "patient") {
            return res.status(403).send("Access denied");
        }

        const patient = await Patient.findOne({
            user: req.session.user.id
        });

        if (!patient) {
            return res.status(404).send("Patient profile not found");
        }

        const appointment = await Appointment.findOne({
            _id: req.params.id,
            patient: patient._id
        });

        if (!appointment) {
            return res.status(404).send("Appointment not found");
        }

        if (
            appointment.status === "Completed" ||
            appointment.status === "Cancelled"
        ) {
            return res.status(400).send(
                "This appointment cannot be cancelled."
            );
        }

        appointment.status = "Cancelled";
        appointment.cancellationReason = "Cancelled by patient";

        await appointment.save();

        res.redirect("/appointments/history");

    } catch (error) {
        console.error("Cancel appointment error:", error);
        res.status(500).send("Unable to cancel appointment.");
    }
});


// =====================================================
// PATIENT - DELETE APPOINTMENT
// =====================================================

router.post("/delete/:id", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        if (req.session.user.role !== "patient") {
            return res.status(403).send("Access denied");
        }

        const patient = await Patient.findOne({
            user: req.session.user.id
        });

        if (!patient) {
            return res.status(404).send("Patient profile not found");
        }

        const appointment = await Appointment.findOne({
            _id: req.params.id,
            patient: patient._id
        });

        if (!appointment) {
            return res.status(404).send("Appointment not found");
        }

        await Appointment.findByIdAndDelete(req.params.id);

        res.redirect("/appointments/history");

    } catch (error) {
        console.error("Delete appointment error:", error);
        res.status(500).send("Unable to delete appointment.");
    }
});


// =====================================================
// PATIENT - RESCHEDULE PAGE
// =====================================================

router.get("/reschedule/:id", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        if (req.session.user.role !== "patient") {
            return res.status(403).send("Access denied");
        }

        const patient = await Patient.findOne({
            user: req.session.user.id
        });

        if (!patient) {
            return res.status(404).send("Patient profile not found");
        }

        const appointment = await Appointment.findOne({
            _id: req.params.id,
            patient: patient._id
        }).populate("doctor");

        if (!appointment) {
            return res.status(404).send("Appointment not found");
        }

        if (
            appointment.status === "Completed" ||
            appointment.status === "Cancelled"
        ) {
            return res.status(400).send(
                "This appointment cannot be rescheduled."
            );
        }

        res.render("appointments/reschedule", {
            appointment,
            error: null
        });

    } catch (error) {
        console.error("Reschedule page error:", error);
        res.status(500).send("Unable to load reschedule page.");
    }
});


// =====================================================
// PATIENT - RESCHEDULE APPOINTMENT
// =====================================================

router.post("/reschedule/:id", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        if (req.session.user.role !== "patient") {
            return res.status(403).send("Access denied");
        }

        const {
            appointmentDate,
            appointmentTime
        } = req.body;

        const patient = await Patient.findOne({
            user: req.session.user.id
        });

        if (!patient) {
            return res.status(404).send("Patient profile not found");
        }

        const appointment = await Appointment.findOne({
            _id: req.params.id,
            patient: patient._id
        }).populate("doctor");

        if (!appointment) {
            return res.status(404).send("Appointment not found");
        }

        if (
            appointment.status === "Completed" ||
            appointment.status === "Cancelled"
        ) {
            return res.status(400).send(
                "This appointment cannot be rescheduled."
            );
        }

        const existingAppointment = await Appointment.findOne({
            _id: { $ne: appointment._id },
            doctor: appointment.doctor._id,
            appointmentDate: new Date(appointmentDate),
            appointmentTime: appointmentTime,
            status: {
                $in: ["Pending", "Confirmed"]
            }
        });

        if (existingAppointment) {
            return res.render("appointments/reschedule", {
                appointment,
                error: "This appointment slot is already booked."
            });
        }

        appointment.appointmentDate = new Date(appointmentDate);
        appointment.appointmentTime = appointmentTime;
        appointment.status = "Pending";

        await appointment.save();

        res.redirect("/appointments/history");

    } catch (error) {
        console.error("Reschedule appointment error:", error);
        res.status(500).send("Unable to reschedule appointment.");
    }
});


// =====================================================
// DOCTOR - CONFIRM APPOINTMENT
// =====================================================

router.post("/confirm/:id", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        if (req.session.user.role !== "doctor") {
            return res.status(403).send("Access denied");
        }

        const doctor = await Doctor.findOne({
            user: req.session.user.id
        });

        if (!doctor) {
            return res.status(404).send("Doctor profile not found");
        }

        const appointment = await Appointment.findOne({
            _id: req.params.id,
            doctor: doctor._id
        });

        if (!appointment) {
            return res.status(404).send("Appointment not found");
        }

        if (appointment.status !== "Pending") {
            return res.status(400).send(
                "Only pending appointments can be confirmed."
            );
        }

        appointment.status = "Confirmed";

        await appointment.save();

        res.redirect("/doctor/dashboard");

    } catch (error) {
        console.error("Doctor confirm error:", error);
        res.status(500).send("Unable to confirm appointment.");
    }
});


// =====================================================
// DOCTOR - REJECT APPOINTMENT
// =====================================================

router.post("/reject/:id", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        if (req.session.user.role !== "doctor") {
            return res.status(403).send("Access denied");
        }

        const doctor = await Doctor.findOne({
            user: req.session.user.id
        });

        if (!doctor) {
            return res.status(404).send("Doctor profile not found");
        }

        const appointment = await Appointment.findOne({
            _id: req.params.id,
            doctor: doctor._id
        });

        if (!appointment) {
            return res.status(404).send("Appointment not found");
        }

        if (
            appointment.status === "Cancelled" ||
            appointment.status === "Completed"
        ) {
            return res.status(400).send(
                "This appointment cannot be rejected."
            );
        }

        appointment.status = "Cancelled";
        appointment.cancellationReason = "Rejected by doctor";

        await appointment.save();

        res.redirect("/doctor/dashboard");

    } catch (error) {
        console.error("Doctor reject error:", error);
        res.status(500).send("Unable to reject appointment.");
    }
});


// =====================================================
// DOCTOR - COMPLETE APPOINTMENT
// =====================================================

router.post("/complete/:id", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        if (req.session.user.role !== "doctor") {
            return res.status(403).send("Access denied");
        }

        const doctor = await Doctor.findOne({
            user: req.session.user.id
        });

        if (!doctor) {
            return res.status(404).send("Doctor profile not found");
        }

        const appointment = await Appointment.findOne({
            _id: req.params.id,
            doctor: doctor._id
        });

        if (!appointment) {
            return res.status(404).send("Appointment not found");
        }

        if (appointment.status !== "Confirmed") {
            return res.status(400).send(
                "Only confirmed appointments can be completed."
            );
        }

        appointment.status = "Completed";

        await appointment.save();

        res.redirect("/doctor/dashboard");

    } catch (error) {
        console.error("Doctor complete error:", error);
        res.status(500).send("Unable to complete appointment.");
    }
});


// =====================================================
// ADMIN - CONFIRM APPOINTMENT
// =====================================================

router.post("/admin/confirm/:id", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        console.log("ADMIN SESSION:", req.session.user);

        if (req.session.user.role !== "admin") {
            return res.status(403).send("Access denied");
        }

        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).send("Appointment not found");
        }

        if (appointment.status !== "Pending") {
            return res.status(400).send(
                "Only pending appointments can be confirmed."
            );
        }

        appointment.status = "Confirmed";

        await appointment.save();

        res.redirect("/admin/appointments");

    } catch (error) {
        console.error("Admin confirm error:", error);
        res.status(500).send("Unable to confirm appointment.");
    }
});

// =====================================================
// ADMIN - COMPLETE APPOINTMENT
// =====================================================

router.post("/admin/complete/:id", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        if (req.session.user.role !== "admin") {
            return res.status(403).send("Access denied");
        }

        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).send("Appointment not found");
        }

        if (appointment.status !== "Confirmed") {
            return res.status(400).send(
                "Only confirmed appointments can be completed."
            );
        }

        appointment.status = "Completed";

        await appointment.save();

        res.redirect("/admin/appointments");

    } catch (error) {
        console.error("Admin complete error:", error);
        res.status(500).send("Unable to complete appointment.");
    }
});


// =====================================================
// ADMIN - DELETE APPOINTMENT
// =====================================================

router.post("/admin/delete/:id", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        if (req.session.user.role !== "admin") {
            return res.status(403).send("Access denied");
        }

        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).send("Appointment not found");
        }

        await Appointment.findByIdAndDelete(req.params.id);

        res.redirect("/admin/appointments");

    } catch (error) {
        console.error("Admin delete error:", error);
        res.status(500).send("Unable to delete appointment.");
    }
});


module.exports = router;
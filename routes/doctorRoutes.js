
const express = require("express");
const mongoose = require("mongoose");

const Doctor = require("../models/Doctor");
const Department = require("../models/Department");
const Appointment = require("../models/Appointment");
const MedicalRecord = require("../models/MedicalRecord");

const router = express.Router();


// =====================================================
// ALL DOCTORS - PATIENT SIDE
// =====================================================

router.get("/doctors", async (req, res) => {
    try {
        const { search = "", department = "" } = req.query;

        let query = {};

        // ==========================================
        // SEARCH BY DOCTOR NAME / SPECIALIZATION
        // ==========================================

        if (search.trim() !== "") {
            query.$or = [
                {
                    name: {
                        $regex: search.trim(),
                        $options: "i"
                    }
                },
                {
                    specialization: {
                        $regex: search.trim(),
                        $options: "i"
                    }
                }
            ];
        }

        // ==========================================
        // FILTER BY DEPARTMENT
        // ==========================================

        if (department.trim() !== "") {

            if (!mongoose.Types.ObjectId.isValid(department)) {
                return res.status(400).send("Invalid department ID");
            }

            query.department = new mongoose.Types.ObjectId(department);
        }

        // ==========================================
        // FIND DOCTORS
        // ==========================================

        const doctors = await Doctor.find(query)
            .populate("department")
            .sort({ name: 1 });

        // ==========================================
        // FIND ALL DEPARTMENTS
        // ==========================================

        const departments = await Department.find()
            .sort({ name: 1 });

        // ==========================================
        // RENDER PAGE
        // ==========================================

        res.render("patient/doctors", {
            doctors: doctors,
            departments: departments,
            search: search,
            selectedDepartment: department
        });

    } catch (error) {

        console.error("Doctors page error:", error);

        res.status(500).send(
            "Unable to load doctors."
        );
    }
});

// =====================================================
// DOCTOR DETAILS - PATIENT SIDE
// =====================================================

router.get("/doctors/:id", async (req, res) => {

    try {

        // Validate doctor ID

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {

            return res.status(404).send(
                "Doctor not found"
            );
        }


        // Find doctor

        const doctor = await Doctor.findById(
            req.params.id
        ).populate("department");


        if (!doctor) {

            return res.status(404).send(
                "Doctor not found"
            );
        }


        // Render details

        res.render(
            "patient/doctor-details",
            {
                doctor
            }
        );

    } catch (error) {

        console.error(
            "Doctor details error:",
            error
        );

        res.status(500).send(
            "Unable to load doctor details."
        );
    }
});

router.get("/patient/:id", async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== "doctor") {
            return res.status(403).send("Access denied");
        }

        const Patient = require("../models/Patient");

        const patient = await Patient.findById(req.params.id)
            .populate("user");

        if (!patient) {
            return res.status(404).send("Patient not found");
        }

        res.render("doctor/patient-details", {
            patient
        });

    } catch (error) {
        console.error("Patient details error:", error);
        res.status(500).send("Unable to load patient details.");
    }
});
// =====================================================
// ADD MEDICAL RECORD - DOCTOR
// =====================================================

router.get("/patient/:patientId/record/:appointmentId", async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== "doctor") {
            return res.status(403).send("Access denied");
        }

        const doctor = await Doctor.findOne({
            user: req.session.user.id
        });

        if (!doctor) {
            return res.status(404).send("Doctor profile not found");
        }

        const appointment = await Appointment.findOne({
            _id: req.params.appointmentId,
            patient: req.params.patientId,
            doctor: doctor._id
        }).populate("patient");

        if (!appointment) {
            return res.status(404).send("Appointment not found");
        }

        if (appointment.status !== "Completed") {
            return res.status(400).send(
                "Medical record can be added only for completed appointments."
            );
        }

        res.render("doctor/add-medical-record", {
            appointment,
            patient: appointment.patient,
            error: null
        });

    } catch (error) {
        console.error("Add medical record page error:", error);
        res.status(500).send("Unable to load medical record form.");
    }
});


// =====================================================
// SAVE MEDICAL RECORD - DOCTOR
// =====================================================

router.post("/patient/:patientId/record/:appointmentId", async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== "doctor") {
            return res.status(403).send("Access denied");
        }

        const doctor = await Doctor.findOne({
            user: req.session.user.id
        });

        if (!doctor) {
            return res.status(404).send("Doctor profile not found");
        }

        const appointment = await Appointment.findOne({
            _id: req.params.appointmentId,
            patient: req.params.patientId,
            doctor: doctor._id
        });

        if (!appointment) {
            return res.status(404).send("Appointment not found");
        }

        if (appointment.status !== "Completed") {
            return res.status(400).send(
                "Medical record can be added only for completed appointments."
            );
        }

        const {
            diagnosis,
            prescription,
            notes
        } = req.body;

        if (!diagnosis || diagnosis.trim() === "") {
            const patient = await require("../models/Patient")
                .findById(req.params.patientId);

            return res.render("doctor/add-medical-record", {
                appointment,
                patient,
                error: "Diagnosis is required."
            });
        }

        const existingRecord = await MedicalRecord.findOne({
            appointment: appointment._id
        });

        if (existingRecord) {
            return res.status(400).send(
                "Medical record already exists for this appointment."
            );
        }

        const medicalRecord = new MedicalRecord({
            patient: appointment.patient,
            doctor: doctor._id,
            appointment: appointment._id,
            diagnosis: diagnosis.trim(),
            prescription: prescription ? prescription.trim() : "",
            notes: notes ? notes.trim() : ""
        });

        await medicalRecord.save();

        res.redirect("/doctor/dashboard");

    } catch (error) {
        console.error("Save medical record error:", error);
        res.status(500).send("Unable to save medical record.");
    }
});


// =====================================================
// DOCTOR DASHBOARD
// =====================================================

router.get("/dashboard", async (req, res) => {

    try {

        // ---------------------------------------------
        // Login check
        // ---------------------------------------------

        if (!req.session.user) {

            return res.redirect(
                "/auth/login"
            );
        }


        // ---------------------------------------------
        // Role check
        // ---------------------------------------------

        if (req.session.user.role !== "doctor") {

            return res.status(403).send(
                "Access denied"
            );
        }


        // ---------------------------------------------
        // Find doctor profile
        // ---------------------------------------------

        const doctor = await Doctor.findOne({

            user: req.session.user.id

        }).populate("department");


        if (!doctor) {

            return res.status(404).send(
                "Doctor profile not found"
            );
        }


        // ---------------------------------------------
        // Get appointments
        // ---------------------------------------------

        const appointments =
            await Appointment.find({

                doctor: doctor._id

            })
            .populate({

                path: "patient",

                populate: {
                    path: "user"
                }

            })
            .sort({

                appointmentDate: 1

            });


        // ---------------------------------------------
        // Upcoming appointments
        // ---------------------------------------------

        const today = new Date();

        today.setHours(
            0,
            0,
            0,
            0
        );


        const upcomingAppointments =
            appointments.filter(
                appointment => {

                    const appointmentDate =
                        new Date(
                            appointment.appointmentDate
                        );

                    return (

                        appointmentDate >= today &&

                        appointment.status !==
                            "Cancelled" &&

                        appointment.status !==
                            "Completed"

                    );
                }
            );


        // ---------------------------------------------
        // Completed appointments
        // ---------------------------------------------

        const completedAppointments =
            appointments.filter(
                appointment =>
                    appointment.status ===
                    "Completed"
            );


        // ---------------------------------------------
        // Pending appointments
        // ---------------------------------------------

        const pendingAppointments =
            appointments.filter(
                appointment =>
                    appointment.status ===
                    "Pending"
            );


        // ---------------------------------------------
        // Confirmed appointments
        // ---------------------------------------------

        const confirmedAppointments =
            appointments.filter(
                appointment =>
                    appointment.status ===
                    "Confirmed"
            );


        // ---------------------------------------------
        // Unique patients
        // ---------------------------------------------

        const patientIds = [

            ...new Set(

                appointments

                    .filter(
                        appointment =>
                            appointment.patient
                    )

                    .map(
                        appointment =>
                            appointment.patient._id.toString()
                    )

            )

        ];


        // ---------------------------------------------
        // Render doctor dashboard
        // ---------------------------------------------

        res.render(
            "doctor/dashboard",
            {

                doctor,

                appointments,

                upcomingAppointments,

                completedAppointments,

                pendingAppointments,

                confirmedAppointments,

                totalPatients:
                    patientIds.length

            }
        );

    } catch (error) {

        console.error(
            "Doctor dashboard error:",
            error
        );

        res.status(500).send(
            "Unable to load doctor dashboard."
        );
    }
});


module.exports = router;
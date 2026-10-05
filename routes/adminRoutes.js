const express = require("express");

const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const Department = require("../models/Department");
const Appointment = require("../models/Appointment");

const router = express.Router();


// =========================================
// ADMIN DASHBOARD
// =========================================

router.get("/dashboard", async (req, res) => {
    try {

        // Admin login check
        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        // Admin role check
        if (req.session.user.role !== "admin") {
            return res.status(403).send("Access denied");
        }


        // Get statistics

        const totalDoctors = await Doctor.countDocuments();

        const totalPatients = await Patient.countDocuments();

        const totalDepartments = await Department.countDocuments();

        const totalUsers = await User.countDocuments();


        res.render("admin/dashboard", {
            totalDoctors,
            totalPatients,
            totalDepartments,
            totalUsers
        });


    } catch (error) {

        console.error("Admin dashboard error:", error);

        res.status(500).send("Unable to load admin dashboard.");
    }
});
// =========================================
// MANAGE DOCTORS
// =========================================

router.get("/doctors", async (req, res) => {
    try {

        // Admin login check
        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        // Admin role check
        if (req.session.user.role !== "admin") {
            return res.status(403).send("Access denied");
        }

        const doctors = await Doctor.find()
            .populate("department")
            .sort({ name: 1 });
           // console.log("ADMIN DOCTORS:", doctors.length);

        res.render("admin/doctors", {
            doctors
        });

    } catch (error) {

        console.error("Admin doctors error:", error);

        res.status(500).send("Unable to load doctors.");
    }
});
// =========================================
// ADD DOCTOR - FORM
// =========================================

router.get("/doctors/add", async (req, res) => {
    try {

        // Admin login check
        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        // Admin role check
        if (req.session.user.role !== "admin") {
            return res.status(403).send("Access denied");
        }

        const departments = await Department.find()
            .sort({ name: 1 });

        res.render("admin/add-doctor", {
            departments
        });

    } catch (error) {

        console.error("Add doctor page error:", error);

        res.status(500).send("Unable to load add doctor page.");
    }
});

// =========================================
// ADD DOCTOR - SAVE
// =========================================

router.post("/doctors/add", async (req, res) => {
    try {

        // Admin login check
        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        // Admin role check
        if (req.session.user.role !== "admin") {
            return res.status(403).send("Access denied");
        }

        const {
            name,
            specialization,
            department,
            qualification,
            experience,
            phone,
            email,
            availableDays,
            availableTime,
            about
        } = req.body;


        const doctor = new Doctor({
            name,
            specialization,
            department,
            qualification,
            experience,
            phone,
            email,
            availableDays: Array.isArray(availableDays)
                ? availableDays
                : [availableDays],
            availableTime,
            about
        });


        await doctor.save();


        res.redirect("/admin/doctors");


    } catch (error) {

        console.error("Add doctor error:", error);

        res.status(500).send("Unable to add doctor.");
    }
});
// =========================================
// EDIT DOCTOR - FORM
// =========================================

router.get("/doctors/edit/:id", async (req, res) => {
    try {

        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        if (req.session.user.role !== "admin") {
            return res.status(403).send("Access denied");
        }

        const doctor = await Doctor.findById(req.params.id);

        if (!doctor) {
            return res.status(404).send("Doctor not found");
        }

        const departments = await Department.find()
            .sort({ name: 1 });

        res.render("admin/edit-doctor", {
            doctor,
            departments
        });

    } catch (error) {

        console.error("Edit doctor page error:", error);

        res.status(500).send("Unable to load edit doctor page.");
    }
});

// =========================================
// EDIT DOCTOR - UPDATE
// =========================================

router.post("/doctors/edit/:id", async (req, res) => {
    try {

        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        if (req.session.user.role !== "admin") {
            return res.status(403).send("Access denied");
        }

        const {
            name,
            specialization,
            department,
            qualification,
            experience,
            phone,
            email,
            availableDays,
            availableTime,
            about
        } = req.body;

        const doctor = await Doctor.findById(req.params.id);

        if (!doctor) {
            return res.status(404).send("Doctor not found");
        }

        doctor.name = name;
        doctor.specialization = specialization;
        doctor.department = department;
        doctor.qualification = qualification;
        doctor.experience = experience;
        doctor.phone = phone;
        doctor.email = email;

        doctor.availableDays = Array.isArray(availableDays)
            ? availableDays
            : [availableDays];

        doctor.availableTime = availableTime;
        doctor.about = about;

        await doctor.save();

        res.redirect("/admin/doctors");

    } catch (error) {

        console.error("Edit doctor error:", error);

        res.status(500).send("Unable to update doctor.");
    }
});
// =========================================
// DELETE DOCTOR
// =========================================

router.post("/doctors/delete/:id", async (req, res) => {
    try {

        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        if (req.session.user.role !== "admin") {
            return res.status(403).send("Access denied");
        }

        const doctor = await Doctor.findById(req.params.id);

        if (!doctor) {
            return res.status(404).send("Doctor not found");
        }

        await Doctor.findByIdAndDelete(req.params.id);

        res.redirect("/admin/doctors");

    } catch (error) {

        console.error("Delete doctor error:", error);

        res.status(500).send("Unable to delete doctor.");
    }
});

// =========================================
// MANAGE PATIENTS
// =========================================

router.get("/patients", async (req, res) => {
    try {

        // Admin login check
        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        // Admin role check
        if (req.session.user.role !== "admin") {
            return res.status(403).send("Access denied");
        }

        const patients = await Patient.find()
            .populate("user")
            .sort({ createdAt: -1 });

        res.render("admin/patients", {
            patients
        });

    } catch (error) {

        console.error("Admin patients error:", error);

        res.status(500).send("Unable to load patients.");
    }
});
// =========================================
// MANAGE APPOINTMENTS
// =========================================

router.get("/appointments", async (req, res) => {
    try {

        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        if (req.session.user.role !== "admin") {
            return res.status(403).send("Access denied");
        }

        const appointments = await Appointment.find()
            .populate({
                path: "patient",
                populate: {
                    path: "user"
                }
            })
            .populate({
                path: "doctor",
                populate: {
                    path: "department"
                }
            })
            .sort({ appointmentDate: 1 });

        res.render("admin/appointments", {
            appointments
        });

    } catch (error) {

        console.error("Admin appointments error:", error);

        res.status(500).send("Unable to load appointments.");
    }
});

// =========================================
// MANAGE DEPARTMENTS
// =========================================

router.get("/departments", async (req, res) => {
    try {

        // Admin login check
        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        // Admin role check
        if (req.session.user.role !== "admin") {
            return res.status(403).send("Access denied");
        }

        const departments = await Department.find()
            .sort({ name: 1 });

        res.render("admin/departments", {
            departments
        });

    } catch (error) {

        console.error("Admin departments error:", error);

        res.status(500).send("Unable to load departments.");
    }
});
router.post("/departments/add", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        if (req.session.user.role !== "admin") {
            return res.status(403).send("Access denied");
        }

        const { name, description } = req.body;

        const department = new Department({
            name,
            description
        });

        await department.save();

        res.redirect("/admin/departments");

    } catch (error) {
        console.error("Add department error:", error);
        res.status(500).send("Unable to add department.");
    }
});
router.post("/departments/delete/:id", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect("/auth/login");
        }

        if (req.session.user.role !== "admin") {
            return res.status(403).send("Access denied");
        }

        const department = await Department.findById(req.params.id);

        if (!department) {
            return res.status(404).send("Department not found");
        }

        await Department.findByIdAndDelete(req.params.id);

        res.redirect("/admin/departments");

    } catch (error) {
        console.error("Delete department error:", error);
        res.status(500).send("Unable to delete department.");
    }
});


module.exports = router;
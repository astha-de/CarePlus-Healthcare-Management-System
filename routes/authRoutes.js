const express = require("express");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Department = require("../models/Department");


const router = express.Router();


// ==========================================
// REGISTER PAGE
// ==========================================

// Registration choice page
router.get("/register", (req, res) => {
    res.render("auth/register-choice");
});

// Existing patient registration form
router.get("/patient-register", (req, res) => {
    res.render("auth/register", {
        error: null,
        success: null
    });
});


// ==========================================
// REGISTER PATIENT
// ==========================================

router.post("/register", async (req, res) => {

    try {

        const {
            name,
            email,
            password,
            confirmPassword
        } = req.body;


        // Basic validation

        if (!name || !email || !password || !confirmPassword) {
            return res.render("auth/register", {
                error: "Please fill all required fields.",
                success: null
            });
        }


        if (password !== confirmPassword) {
            return res.render("auth/register", {
                error: "Passwords do not match.",
                success: null
            });
        }


        if (password.length < 6) {
            return res.render("auth/register", {
                error: "Password must be at least 6 characters.",
                success: null
            });
        }


        // Check existing user

        const existingUser = await User.findOne({
            email: email.toLowerCase().trim()
        });


        if (existingUser) {
            return res.render("auth/register", {
                error: "An account with this email already exists.",
                success: null
            });
        }


        // Hash password

        const hashedPassword = await bcrypt.hash(password, 10);


        // Create User

        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: "patient"
        });


        // Create Patient profile

        await Patient.create({
            user: user._id
        });


        // Redirect to login

        res.redirect("/auth/login?registered=true");

    } catch (error) {

        console.error("Registration error:", error);

        res.render("auth/register", {
            error: "Something went wrong. Please try again.",
            success: null
        });
    }
});

// ================= DOCTOR REGISTRATION =================

// Show doctor registration page
router.get("/doctor-register", async (req, res) => {
    try {
        const departments = await Department.find().sort({ name: 1 });

        res.render("auth/doctor-register", {
            departments,
            error: null
        });
    } catch (error) {
        console.error("Doctor register page error:", error);
        res.status(500).send("Unable to load doctor registration page");
    }
});


// Doctor registration
router.post("/doctor-register", async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            confirmPassword,
            specialization,
            department,
            qualification,
            experience,
            phone,
            availableDays,
            availableTime,
            about
        } = req.body;

        const departments = await Department.find().sort({ name: 1 });

        // Required fields
        if (
            !name ||
            !email ||
            !password ||
            !confirmPassword ||
            !specialization ||
            !department ||
            !qualification ||
            !experience ||
            !phone ||
            !availableDays ||
            !availableTime ||
            !about
        ) {
            return res.render("auth/doctor-register", {
                departments,
                error: "Please fill all required fields."
            });
        }

        // Password match
        if (password !== confirmPassword) {
            return res.render("auth/doctor-register", {
                departments,
                error: "Passwords do not match."
            });
        }

        // Password length
        if (password.length < 6) {
            return res.render("auth/doctor-register", {
                departments,
                error: "Password must be at least 6 characters."
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        // Check existing user
        const existingUser = await User.findOne({ email: cleanEmail });

        if (existingUser) {
            return res.render("auth/doctor-register", {
                departments,
                error: "Email already registered."
            });
        }

        // Check department
        const selectedDepartment = await Department.findById(department);

        if (!selectedDepartment) {
            return res.render("auth/doctor-register", {
                departments,
                error: "Invalid department selected."
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create User
        const user = await User.create({
            name: name.trim(),
            email: cleanEmail,
            password: hashedPassword,
            role: "doctor"
        });

        try {
            // Create Doctor profile
            await Doctor.create({
                user: user._id,
                name: name.trim(),
                specialization: specialization.trim(),
                department: selectedDepartment._id,
                qualification: qualification.trim(),
                experience: Number(experience),
                phone: phone.trim(),
                email: cleanEmail,
                availableDays: Array.isArray(availableDays)
                    ? availableDays
                    : [availableDays],
                availableTime: availableTime.trim(),
                about: about.trim()
            });
        } catch (doctorError) {
            // If Doctor profile fails, remove User also
            await User.findByIdAndDelete(user._id);

            console.error("Doctor profile creation error:", doctorError);

            return res.render("auth/doctor-register", {
                departments,
                error: "Doctor registration failed. Please try again."
            });
        }

        // Registration successful
        res.redirect("/auth/login?registered=true");

    } catch (error) {
        console.error("Doctor registration error:", error);
        res.status(500).send("Doctor registration failed");
    }
});


// ==========================================
// LOGIN PAGE
// ==========================================

router.get("/login", (req, res) => {

    const registered = req.query.registered === "true";

    res.render("auth/login", {
        error: null,
        success: registered
            ? "Registration successful. Please login."
            : null
    });
});


// ==========================================
// LOGIN
// ==========================================

router.post("/login", async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        if (!email || !password) {
            return res.render("auth/login", {
                error: "Please enter email and password.",
                success: null
            });
        }


        // Find user

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });


        if (!user) {
            return res.render("auth/login", {
                error: "Invalid email or password.",
                success: null
            });
        }


        // Compare password

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );


        if (!passwordMatch) {
            return res.render("auth/login", {
                error: "Invalid email or password.",
                success: null
            });
        }


        // Store session

        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };


        // Role-based redirect

        if (user.role === "admin") {
            return res.redirect("/admin/dashboard");
        }


        if (user.role === "doctor") {
            return res.redirect("/doctor/dashboard");
        }


        return res.redirect("/patient/dashboard");

    } catch (error) {

        console.error("Login error:", error);

        res.render("auth/login", {
            error: "Something went wrong. Please try again.",
            success: null
        });
    }
});


// ==========================================
// LOGOUT
// ==========================================

router.get("/logout", (req, res) => {

    req.session.destroy((error) => {

        if (error) {
            console.error("Logout error:", error);
            return res.redirect("/");
        }

        res.redirect("/auth/login");
    });
});


module.exports = router;
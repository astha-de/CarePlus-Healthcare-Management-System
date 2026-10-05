const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Doctor = require("./models/Doctor");

require("dotenv").config();

async function seedDoctorUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        const email = "doctor@careplus.com";
        const password = "doctor123";

        // Check if doctor user already exists
        let user = await User.findOne({ email });

        if (!user) {
            const hashedPassword = await bcrypt.hash(password, 10);

            user = await User.create({
                name: "Dr. Amit Sharma",
                email: email,
                password: hashedPassword,
                role: "doctor"
            });

            console.log("Doctor user created");
        } else {
            console.log("Doctor user already exists");
        }

        // Find Amit Sharma's doctor profile
        const doctor = await Doctor.findOne({
            email: "amit.sharma@careplus.com"
        });

        if (!doctor) {
            console.log("Doctor profile not found");
            process.exit();
        }

        // Link doctor profile with user account
        doctor.user = user._id;

        await doctor.save();

        console.log("Doctor profile linked successfully");
        console.log("--------------------------------");
        console.log("Doctor Login Details");
        console.log("Email:", email);
        console.log("Password:", password);
        console.log("--------------------------------");

        process.exit();

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

seedDoctorUser();
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Doctor = require("./models/Doctor");
const Department = require("./models/Department");

dotenv.config();

const doctors = [
    {
        name: "Dr. Amit Sharma",
        specialization: "Cardiologist",
        qualification: "MBBS, MD Cardiology",
        experience: 12,
        phone: "9876543210",
        email: "amit.sharma@careplus.com",
        availableDays: ["Monday", "Wednesday", "Friday"],
        availableTime: "10:00 AM - 2:00 PM",
        about: "Experienced cardiologist specializing in heart and cardiovascular care."
    },
    {
        name: "Dr. Priya Verma",
        specialization: "Neurologist",
        qualification: "MBBS, MD Neurology",
        experience: 10,
        phone: "9876543211",
        email: "priya.verma@careplus.com",
        availableDays: ["Tuesday", "Thursday", "Saturday"],
        availableTime: "11:00 AM - 3:00 PM",
        about: "Specialist in neurological disorders and nervous system care."
    },
    {
        name: "Dr. Rahul Singh",
        specialization: "Orthopedic Surgeon",
        qualification: "MBBS, MS Orthopedics",
        experience: 8,
        phone: "9876543212",
        email: "rahul.singh@careplus.com",
        availableDays: ["Monday", "Tuesday", "Thursday"],
        availableTime: "9:00 AM - 1:00 PM",
        about: "Orthopedic specialist focusing on bones, joints and muscles."
    },
    {
        name: "Dr. Neha Gupta",
        specialization: "Dermatologist",
        qualification: "MBBS, MD Dermatology",
        experience: 7,
        phone: "9876543213",
        email: "neha.gupta@careplus.com",
        availableDays: ["Monday", "Wednesday", "Saturday"],
        availableTime: "10:00 AM - 1:00 PM",
        about: "Dermatologist specializing in skin, hair and nail conditions."
    },
    {
        name: "Dr. Anjali Mehta",
        specialization: "Pediatrician",
        qualification: "MBBS, MD Pediatrics",
        experience: 9,
        phone: "9876543214",
        email: "anjali.mehta@careplus.com",
        availableDays: ["Tuesday", "Wednesday", "Friday"],
        availableTime: "10:00 AM - 2:00 PM",
        about: "Pediatrician providing healthcare for children and adolescents."
    },
    {
        name: "Dr. Sneha Kapoor",
        specialization: "Gynecologist",
        qualification: "MBBS, MD Gynecology",
        experience: 11,
        phone: "9876543215",
        email: "sneha.kapoor@careplus.com",
        availableDays: ["Monday", "Thursday", "Saturday"],
        availableTime: "11:00 AM - 3:00 PM",
        about: "Gynecologist specializing in women's reproductive health."
    },
    {
        name: "Dr. Vikash Yadav",
        specialization: "General Physician",
        qualification: "MBBS, MD Medicine",
        experience: 6,
        phone: "9876543216",
        email: "vikash.yadav@careplus.com",
        availableDays: ["Monday", "Tuesday", "Friday"],
        availableTime: "9:00 AM - 12:00 PM",
        about: "General physician providing diagnosis and treatment for common medical conditions."
    }
];


async function seedDoctors() {

    try {

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        // -----------------------------------------
        // Get departments
        // -----------------------------------------

        const departments = await Department.find();

        if (departments.length === 0) {

            console.log(
                "No departments found. Run seedDepartments.js first."
            );

            await mongoose.connection.close();

            return;
        }


        // -----------------------------------------
        // Match doctors with departments
        // -----------------------------------------

        for (const doctor of doctors) {

            let departmentName = "";

            if (doctor.specialization === "Cardiologist") {
                departmentName = "Cardiology";
            }

            else if (doctor.specialization === "Neurologist") {
                departmentName = "Neurology";
            }

            else if (doctor.specialization === "Orthopedic Surgeon") {
                departmentName = "Orthopedics";
            }

            else if (doctor.specialization === "Dermatologist") {
                departmentName = "Dermatology";
            }

            else if (doctor.specialization === "Pediatrician") {
                departmentName = "Pediatrics";
            }

            else if (doctor.specialization === "Gynecologist") {
                departmentName = "Gynecology";
            }

            else if (doctor.specialization === "General Physician") {
                departmentName = "General Medicine";
            }


            const department = departments.find(
                dept => dept.name === departmentName
            );


            if (!department) {

                console.log(
                    "Department not found:",
                    departmentName
                );

                continue;
            }


            doctor.department = department._id;


            // -------------------------------------
            // Avoid duplicate doctors
            // -------------------------------------

            const existing = await Doctor.findOne({
                email: doctor.email
            });


            if (!existing) {

                await Doctor.create(doctor);

                console.log(
                    "Added:",
                    doctor.name
                );

            } else {

                console.log(
                    "Already exists:",
                    doctor.name
                );
            }
        }


        console.log("Doctors seeded successfully");

        await mongoose.connection.close();

    } catch (error) {

        console.error("Seed error:", error);

        await mongoose.connection.close();
    }
}


seedDoctors();
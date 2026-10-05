const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Department = require("./models/Department");

dotenv.config();

const departments = [
    {
        name: "Cardiology",
        description: "Specialized care for heart and cardiovascular conditions."
    },
    {
        name: "Neurology",
        description: "Diagnosis and treatment of disorders of the nervous system."
    },
    {
        name: "Orthopedics",
        description: "Treatment of bones, joints, muscles and related conditions."
    },
    {
        name: "Dermatology",
        description: "Medical care for skin, hair and nail conditions."
    },
    {
        name: "Pediatrics",
        description: "Healthcare services for children and adolescents."
    },
    {
        name: "Gynecology",
        description: "Healthcare services focused on women's reproductive health."
    },
    {
        name: "General Medicine",
        description: "Diagnosis and treatment of common medical conditions."
    }
];

async function seedDepartments() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        for (const department of departments) {
            const existing = await Department.findOne({
                name: department.name
            });

            if (!existing) {
                await Department.create(department);
                console.log("Added:", department.name);
            } else {
                console.log("Already exists:", department.name);
            }
        }

        console.log("Departments seeded successfully");

        await mongoose.connection.close();

    } catch (error) {
        console.error("Seed error:", error);
        await mongoose.connection.close();
    }
}

seedDepartments();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");

require("dotenv").config();

async function seedAdminUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        const email = "admin@careplus.com";
        const password = "admin123";

        let user = await User.findOne({ email });

        if (!user) {

            const hashedPassword = await bcrypt.hash(password, 10);

            await User.create({
                name: "CarePlus Admin",
                email: email,
                password: hashedPassword,
                role: "admin"
            });

            console.log("Admin user created successfully");

        } else {

            console.log("Admin user already exists");

        }

        console.log("--------------------------------");
        console.log("Admin Login Details");
        console.log("Email:", email);
        console.log("Password:", password);
        console.log("--------------------------------");

        process.exit();

    } catch (error) {

        console.error("Error:", error);

        process.exit(1);
    }
}

seedAdminUser();
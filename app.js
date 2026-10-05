const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const path = require("path");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const adminRoutes = require("./routes/adminRoutes");
//const patientRoutes = require("./routes/patientRoutes");

dotenv.config();

const app = express();




app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));




app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use(express.static(path.join(__dirname, "public")));



app.use(
    session({
        secret: process.env.SESSION_SECRET || "careplus_secret_key",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 24 * 60 * 60 * 1000
        }
    })
);



app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    next();
});

const dns = require("dns");

dns.setServers([
    "8.8.8.8",
    "1.1.1.1"
]);




mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {

        console.log(
            "MongoDB connected successfully"
        );

    })
    .catch((error) => {

        console.error(
            "MongoDB connection error:",
            error
        );

    });
app.use("/auth", authRoutes);
app.use("/patient", patientRoutes);
app.use("/patient", doctorRoutes);
app.use("/doctor", doctorRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/admin", adminRoutes);




app.get("/", (req, res) => {
    res.render("home");
});




app.get("/test", (req, res) => {
    res.send("CarePlus Healthcare Management System is working!");
});



app.use((req, res) => {
    res.status(404).send("Page not found");
});




const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
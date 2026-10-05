const express = require("express");

const Department = require("../models/Department");

const router = express.Router();


// ===============================
// DEPARTMENT PAGE
// ===============================

router.get("/", async (req, res) => {
    try {

        const departments = await Department.find()
            .sort({ name: 1 });

        res.render("admin/departments", {
            departments,
            error: null,
            success: null
        });

    } catch (error) {

        console.error("Department page error:", error);

        res.status(500).send("Something went wrong");
    }
});


// ===============================
// ADD DEPARTMENT
// ===============================

router.post("/add", async (req, res) => {

    try {

        const { name, description } = req.body;

        if (!name || !description) {

            const departments = await Department.find()
                .sort({ name: 1 });

            return res.render("admin/departments", {
                departments,
                error: "Please fill all fields.",
                success: null
            });
        }


        const existingDepartment = await Department.findOne({
            name: name.trim()
        });

        if (existingDepartment) {

            const departments = await Department.find()
                .sort({ name: 1 });

            return res.render("admin/departments", {
                departments,
                error: "Department already exists.",
                success: null
            });
        }


        await Department.create({
            name: name.trim(),
            description: description.trim()
        });


        res.redirect("/departments?success=Department added successfully");


    } catch (error) {

        console.error("Add department error:", error);

        res.status(500).send("Something went wrong");
    }
});


// ===============================
// DELETE DEPARTMENT
// ===============================

router.post("/delete/:id", async (req, res) => {

    try {

        await Department.findByIdAndDelete(req.params.id);

        res.redirect("/departments");

    } catch (error) {

        console.error("Delete department error:", error);

        res.status(500).send("Something went wrong");
    }
});


module.exports = router;
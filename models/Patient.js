const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        phone: {
            type: String,
            trim: true
        },

        dateOfBirth: {
            type: Date
        },

        gender: {
            type: String,
            enum: ["Male", "Female", "Other"]
        },

        address: {
            type: String,
            trim: true
        },

        bloodGroup: {
            type: String,
            trim: true
        },

        emergencyContact: {
            type: String,
            trim: true
        },

        profileImage: {
            type: String,
            default: "/images/default-patient.jpg"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Patient", patientSchema);
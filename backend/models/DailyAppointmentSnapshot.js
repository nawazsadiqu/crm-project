import mongoose from "mongoose";

const dailyAppointmentSnapshotSchema = new mongoose.Schema(
    {
        appointmentDate: {
            type: String,
            required: true,
            unique: true
        },

        confirmedCount: {
            type: Number,
            required: true,
            default: 0
        },

        appointments: [
            {
                _id: false,

                presentationId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "PresentationDetail",
                    required: true
                },

                businessName: {
                    type: String,
                    default: ""
                },

                appointmentTime: {
                    type: String,
                    default: ""
                },

                baId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    default: null
                },

                baName: {
                    type: String,
                    default: ""
                },

                fixedByRole: {
                    type: String,
                    default: ""
                }
            }
        ],

        capturedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model(
    "DailyAppointmentSnapshot",
    dailyAppointmentSnapshotSchema
);
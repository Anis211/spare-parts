import mongoose from "mongoose";

const calendarSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      validate: {
        validator: function (v) {
          return (
            v.getUTCHours() === 0 &&
            v.getUTCMinutes() === 0 &&
            v.getUTCSeconds() === 0 &&
            v.getUTCMilliseconds() === 0
          );
        },
        message: "Date must be a date-only value (midnight UTC)",
      },
    },
    workers: [
      {
        id: { type: Number, required: true },
        speciality: { type: String, required: true },
        workload: [
          {
            time_period: {
              from: { type: Date, required: true },
              to: { type: Date },
            },
            reservation: {
              id: { type: Number, required: true },
            },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

const Calendar =
  mongoose.models?.Calendar || mongoose.model("Calendar", calendarSchema);

export default Calendar;

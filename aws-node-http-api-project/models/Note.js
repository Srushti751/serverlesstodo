const mongoose = require("mongoose");
const moment = require("moment");
const date = Date.now();

const NoteSchema = new mongoose.Schema({
  time: {
    type: Number,
    required: true,
  },
  day: {
    type: String,
    enum: ["am", "pm", "AM", "PM"],
    default: "pm",
  },
  title: {
    type: String,
    required: true,
  },
  taskArray: [
    {
      task: String,
      done: Boolean,
    },
  ],
  description: String,
  created_at: {
    type: String,
    required: true,
    default: moment(date).format("YYYY-MM-DD"),
  },
  date: String,
});
module.exports = mongoose.model("Note", NoteSchema);

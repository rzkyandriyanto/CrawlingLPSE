require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB_URI;

async function checkJobs() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB.");

  const agendaJobs = mongoose.connection.collection("agendaJobs");
  const jobs = await agendaJobs.find({}).toArray();

  if (jobs.length === 0) {
    console.log("Tidak ada job di agendaJobs.");
  } else {
    for (const job of jobs) {
      console.log(`\nJob Name: ${job.name}`);
      console.log(`Last Run At: ${job.lastRunAt}`);
      console.log(`Last Finished At: ${job.lastFinishedAt}`);
      console.log(`Next Run At: ${job.nextRunAt}`);
      console.log(`Locked At: ${job.lockedAt}`);
      console.log(`Fail Reason: ${job.failReason || "None"}`);
    }
  }

  process.exit(0);
}

checkJobs().catch(console.error);

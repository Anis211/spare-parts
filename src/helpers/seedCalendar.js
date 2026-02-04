import Calendar from "@/models/Calendar";
import Worker from "@/models/admin/RepairWorker";
import { toUTCDateOnly } from "@/lib/dateUtils";

async function seedCalendar(days = 10) {
  const today = toUTCDateOnly(new Date());
  const entries = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    entries.push({ date });
  }

  const workers = await Worker.find({});
  workers.map((worker) =>
    console.log(`Worker with id - ${worker.id}: `, worker)
  );

  for (const entry of entries) {
    await Calendar.findOneAndUpdate(
      {
        date: entry.date,
        workers: workers.map((worker) => ({
          id: worker.id,
          speciality: worker.speciality,
        })),
      },
      entry,
      {
        upsert: true,
        new: true,
      }
    );
  }

  console.log(`✅ Seeded ${days} calendar days`);
}

export default seedCalendar;

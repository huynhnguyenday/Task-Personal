import fs from "node:fs";
import mongoose from "mongoose";

const env = fs.readFileSync(".env.local", "utf8");
const line = env.split(/\r?\n/).find((item) => item.trim().startsWith("MONGODB_URI="));
const uri = line.slice(line.indexOf("=") + 1).trim().replace(/^(['"])(.*)\1$/, "$2");
const connection = await mongoose.createConnection(uri, { dbName: "production" }).asPromise();
try {
  const tasks = connection.collection("tasks");
  const settings = connection.collection("settings");
  const joined = await tasks.aggregate([
    { $sort: { createdAt: -1, _id: -1 } },
    { $limit: 2 },
    { $lookup: { from: "settings", localField: "categoryId", foreignField: "_id", as: "categorySetting" } },
    { $lookup: { from: "settings", localField: "statusId", foreignField: "_id", as: "statusSetting" } },
    { $project: { description: 1, categoryId: 1, statusId: 1, category: { $first: "$categorySetting.name" }, status: { $first: "$statusSetting.name" } } },
  ]).toArray();
  console.log(JSON.stringify({ database: connection.name, tasks: await tasks.countDocuments(), settings: await settings.countDocuments(), joined }, null, 2));
} finally { await connection.close(); }

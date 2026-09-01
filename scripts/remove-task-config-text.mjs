import fs from "node:fs";
import mongoose from "mongoose";

const env = fs.readFileSync(".env.local", "utf8");
const line = env.split(/\r?\n/).find((item) => item.trim().startsWith("MONGODB_URI="));
if (!line) throw new Error("MONGODB_URI is missing");
const uri = line.slice(line.indexOf("=") + 1).trim().replace(/^(['"])(.*)\1$/, "$2");
const database = process.env.MONGODB_DB || "production";
const fields = ["category", "department", "company", "workplace", "status"];
const idFields = fields.map((field) => `${field}Id`);
const connection = await mongoose.createConnection(uri, { dbName: database }).asPromise();
try {
  const tasks = connection.collection("tasks");
  const missingIds = await tasks.countDocuments({ $or: idFields.map((field) => ({ [field]: { $type: "objectId" } })).map((condition, index) => ({ [idFields[index]]: { $not: condition[idFields[index]] } })) });
  if (missingIds) throw new Error(`${missingIds} tasks do not contain all required ObjectId references`);
  const result = await tasks.updateMany({}, { $unset: Object.fromEntries(fields.map((field) => [field, ""])) });
  const remainingTextFields = await tasks.countDocuments({ $or: fields.map((field) => ({ [field]: { $exists: true } })) });
  console.log(JSON.stringify({ database: connection.name, matchedTasks: result.matchedCount, modifiedTasks: result.modifiedCount, remainingTextFields }, null, 2));
} finally {
  await connection.close();
}

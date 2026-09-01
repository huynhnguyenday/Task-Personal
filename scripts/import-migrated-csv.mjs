import fs from "node:fs";
import mongoose from "mongoose";

const [settingsPath, tasksPath] = process.argv.slice(2);
if (!settingsPath || !tasksPath) throw new Error("Usage: node script <settings.csv> <tasks.csv>");

function parseCsv(text) {
  const rows = []; let row = [], value = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { value += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else value += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(value); value = ""; }
    else if (char === '\n') { row.push(value.replace(/\r$/, "")); rows.push(row); row = []; value = ""; }
    else value += char;
  }
  if (value || row.length) { row.push(value.replace(/\r$/, "")); rows.push(row); }
  const [headers, ...data] = rows;
  return data.filter((item) => item.some(Boolean)).map((item) => Object.fromEntries(headers.map((header, index) => [header, item[index] ?? ""])));
}

function readMongoUri() {
  const env = fs.readFileSync(".env.local", "utf8");
  const line = env.split(/\r?\n/).find((item) => item.trim().startsWith("MONGODB_URI="));
  if (!line) throw new Error("MONGODB_URI is missing from .env.local");
  return line.slice(line.indexOf("=") + 1).trim().replace(/^(['"])(.*)\1$/, "$2");
}

const settings = parseCsv(fs.readFileSync(settingsPath, "utf8").replace(/^\uFEFF/, ""));
const tasks = parseCsv(fs.readFileSync(tasksPath, "utf8").replace(/^\uFEFF/, ""));
const idFields = ["categoryId", "departmentId", "companyId", "workplaceId", "statusId"];
const settingDocs = settings.map((item) => ({
  ...item,
  _id: new mongoose.Types.ObjectId(item._id),
  createdAt: new Date(item.createdAt),
  updatedAt: new Date(item.updatedAt),
  __v: Number(item.__v || 0),
}));
const taskDocs = tasks.map((item) => ({
  ...item,
  _id: new mongoose.Types.ObjectId(item._id),
  createdAt: new Date(item.createdAt),
  updatedAt: new Date(item.updatedAt),
  __v: Number(item.__v || 0),
  ...Object.fromEntries(idFields.map((field) => [field, new mongoose.Types.ObjectId(item[field])])),
}));

const database = process.env.MONGODB_DB || "production";
const connection = await mongoose.createConnection(readMongoUri(), { bufferCommands: false, dbName: database }).asPromise();
try {
  const settingsCollection = connection.collection("settings");
  const tasksCollection = connection.collection("tasks");
  const [existingSettings, existingTasks] = await Promise.all([settingsCollection.countDocuments(), tasksCollection.countDocuments()]);
  if (existingSettings || existingTasks) throw new Error(`Import stopped: settings=${existingSettings}, tasks=${existingTasks}; collections must be empty`);

  await settingsCollection.insertMany(settingDocs, { ordered: true });
  try {
    await tasksCollection.insertMany(taskDocs, { ordered: true });
  } catch (error) {
    await settingsCollection.deleteMany({ _id: { $in: settingDocs.map((item) => item._id) } });
    throw error;
  }

  const validIds = new Set(settingDocs.map((item) => item._id.toString()));
  const brokenReferences = taskDocs.reduce((count, task) => count + idFields.filter((field) => !validIds.has(task[field].toString())).length, 0);
  const [importedSettings, importedTasks] = await Promise.all([settingsCollection.countDocuments(), tasksCollection.countDocuments()]);
  console.log(JSON.stringify({ database: connection.name, importedSettings, importedTasks, checkedReferences: taskDocs.length * idFields.length, brokenReferences }, null, 2));
} finally {
  await connection.close();
}

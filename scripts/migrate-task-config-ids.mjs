import fs from "node:fs";
import path from "node:path";

const [settingsPath, tasksPath, mode = "check"] = process.argv.slice(2);
if (!settingsPath || !tasksPath) throw new Error("Usage: node script <settings.csv> <tasks.csv> [write]");

function parseCsv(text) {
  const rows = [];
  let row = [], value = "", quoted = false;
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
  return rows;
}

function stringifyCsv(rows) {
  return rows.map((row) => row.map((value) => {
    const text = String(value ?? "");
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  }).join(",")).join("\r\n") + "\r\n";
}

function records(rows) {
  const [headers, ...data] = rows;
  return { headers, data: data.filter((row) => row.some(Boolean)).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]))) };
}

const settingsText = fs.readFileSync(settingsPath, "utf8").replace(/^\uFEFF/, "");
const tasksText = fs.readFileSync(tasksPath, "utf8").replace(/^\uFEFF/, "");
const settings = records(parseCsv(settingsText));
const tasks = records(parseCsv(tasksText));
const types = ["category", "department", "company", "workplace", "status"];
const lookup = new Map(settings.data.map((item) => [`${item.type}\0${item.name}`, item._id]));
const aliases = new Map([
  ["category\0Tạo tài khoản, hỗ trợ setup cho người mới", "Tạo tài khoản, hỗ trợ setup, chấm công cho người mới"],
]);
const missing = [];

for (const task of tasks.data) {
  for (const type of types) {
    const key = `${type}\0${task[type]}`;
    const currentName = aliases.get(key);
    const id = lookup.get(currentName ? `${type}\0${currentName}` : key);
    if (!id) missing.push({ taskId: task._id, type, value: task[type] });
    else task[`${type}Id`] = id;
  }
}

if (missing.length) {
  console.error(JSON.stringify({ taskCount: tasks.data.length, settingCount: settings.data.length, missing }, null, 2));
  process.exitCode = 2;
} else {
  const headers = tasks.headers.filter((header) => !types.includes(header));
  for (const type of types) if (!headers.includes(`${type}Id`)) headers.push(`${type}Id`);
  if (mode === "write") {
    const backup = `${tasksPath}.before-config-id-migration`;
    if (!fs.existsSync(backup)) fs.copyFileSync(tasksPath, backup);
    fs.writeFileSync(tasksPath, stringifyCsv([headers, ...tasks.data.map((task) => headers.map((header) => task[header] ?? ""))]), "utf8");
    // Normalize line endings/quoting of settings without altering its IDs or values.
    fs.writeFileSync(settingsPath, stringifyCsv([settings.headers, ...settings.data.map((item) => settings.headers.map((header) => item[header] ?? ""))]), "utf8");
    console.log(JSON.stringify({ taskCount: tasks.data.length, settingCount: settings.data.length, backup, written: [path.resolve(settingsPath), path.resolve(tasksPath)] }, null, 2));
  } else {
    console.log(JSON.stringify({ taskCount: tasks.data.length, settingCount: settings.data.length, mappedReferences: tasks.data.length * types.length, ready: true }, null, 2));
  }
}

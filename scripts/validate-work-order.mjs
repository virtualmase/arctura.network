import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const schemaUrl = "https://arctura.network/schemas/work-order/v1/schema.json";
const file = process.argv[2];
if (!file) {
  console.error("Usage: npm run validate:work-order -- <work-order.json>");
  process.exit(2);
}

const input = JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));
const errors = [];
const text = (value, name, max, required = true) => {
  if (value === null && !required) return;
  if (typeof value !== "string" || (required && !value.trim())) errors.push(`${name} must be a non-empty string`);
  else if (value.length > max) errors.push(`${name} exceeds ${max} characters`);
};
const exactKeys = (value, name, keys) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) { errors.push(`${name} must be an object`); return false; }
  for (const key of keys) if (!(key in value)) errors.push(`${name}.${key} is required`);
  for (const key of Object.keys(value)) if (!keys.includes(key)) errors.push(`${name}.${key} is not allowed`);
  return true;
};

const top = ["schema", "id", "createdAt", "status", "work", "boundaries", "proof", "stewardship"];
exactKeys(input, "workOrder", top);
if (input.schema !== schemaUrl) errors.push(`schema must equal ${schemaUrl}`);
if (typeof input.id !== "string" || !/^awo-[A-Za-z0-9._-]{1,116}$/.test(input.id)) errors.push("id must start with awo- and contain only letters, numbers, dot, underscore, or hyphen");
if (typeof input.createdAt !== "string" || Number.isNaN(Date.parse(input.createdAt))) errors.push("createdAt must be an ISO date-time");
if (!["proposed", "tested", "accepted", "rejected", "archived"].includes(input.status)) errors.push("status is not recognized");

if (exactKeys(input.work, "work", ["name", "expectedResult"])) { text(input.work.name, "work.name", 80); text(input.work.expectedResult, "work.expectedResult", 600); }
if (exactKeys(input.boundaries, "boundaries", ["approvedInputs", "excludedInputs", "allowedActions", "humanReviewRequiredBefore"])) { text(input.boundaries.approvedInputs, "boundaries.approvedInputs", 800); text(input.boundaries.excludedInputs, "boundaries.excludedInputs", 500, false); text(input.boundaries.allowedActions, "boundaries.allowedActions", 700); text(input.boundaries.humanReviewRequiredBefore, "boundaries.humanReviewRequiredBefore", 700); }
if (exactKeys(input.proof, "proof", ["acceptanceChecks", "failureAndRefusalCases", "evidenceToKeep"])) { text(input.proof.acceptanceChecks, "proof.acceptanceChecks", 1000); text(input.proof.failureAndRefusalCases, "proof.failureAndRefusalCases", 700, false); text(input.proof.evidenceToKeep, "proof.evidenceToKeep", 800); }
if (exactKeys(input.stewardship, "stewardship", ["owner", "reviewStatus"])) { text(input.stewardship.owner, "stewardship.owner", 100, false); if (!["not-reviewed", "in-review", "approved", "changes-requested"].includes(input.stewardship.reviewStatus)) errors.push("stewardship.reviewStatus is not recognized"); }

if (errors.length) {
  console.error(`Invalid Arctura work order:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`Valid Arctura work order: ${input.id}`);

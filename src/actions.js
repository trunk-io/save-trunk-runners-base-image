// The few GitHub Actions runner functions that this action needs, with no
// dependency on @actions/core, so that the whole action is easy to read.
"use strict";

const fs = require("node:fs");
const os = require("node:os");

// The runner gives each input as INPUT_<NAME>, with spaces as `_` and in
// upper case. It keeps the `-` characters.
function getInput(name) {
  return (process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`] || "").trim();
}

// Values from the main step reach the post step through $GITHUB_STATE.
function saveState(name, value) {
  fs.appendFileSync(process.env.GITHUB_STATE, `${name}=${value}${os.EOL}`);
}

function getState(name) {
  return process.env[`STATE_${name}`] || "";
}

function fail(message) {
  console.log(`::error::${message}`);
  process.exitCode = 1;
}

module.exports = { getInput, saveState, getState, fail };

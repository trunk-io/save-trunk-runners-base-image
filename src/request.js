// The request file that tells Trunk Runners to save the disk of this job.
// The runner writes the same file for GitHub's `snapshot:` job keyword. The
// runner launcher reads it after the runner exits, only on an image
// generation runner.
"use strict";

const fs = require("node:fs");

const REQUEST_DIR = "/opt/actions-runner/.snapshot";
const REQUEST_PATH = `${REQUEST_DIR}/request.json`;

// The same rules as the Trunk Runners server. A request that breaks them is
// refused when the job ends, so the action checks them when the job starts.
const NAME_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}$/;
const VERSION_PATTERN = /^[1-9][0-9]{0,2}\.\*$/;

function checkName(name) {
  if (!NAME_PATTERN.test(name)) {
    return `The name "${name}" is not valid. Use 1 to 63 characters: lowercase letters, digits and "-", and do not start with "-".`;
  }
  return null;
}

function checkVersion(version) {
  if (!VERSION_PATTERN.test(version)) {
    return `The version "${version}" is not valid. Use "<major>.*", with a major from 1 to 999 (for example "1.*"). Trunk Runners sets the minor version.`;
  }
  return null;
}

function requestBody(name, version) {
  return `${JSON.stringify({ ImageName: name, Version: version })}\n`;
}

// Reads the file back as the launcher does: a regular file (not a symbolic
// link) that holds the same name and version.
function checkWritten(path, name, version) {
  const stat = fs.lstatSync(path);
  if (!stat.isFile()) {
    return `${path} is not a regular file.`;
  }
  const written = JSON.parse(fs.readFileSync(path, "utf8"));
  if (written.ImageName !== name || written.Version !== version) {
    return `${path} does not hold the requested name and version.`;
  }
  return null;
}

module.exports = {
  REQUEST_DIR,
  REQUEST_PATH,
  checkName,
  checkVersion,
  requestBody,
  checkWritten,
};

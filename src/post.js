// The post step. It runs only when the job passed (`post-if: success()` in
// action.yml). It is the last step of the job when the action is the first
// step, so nothing changes the disk after the request.
"use strict";

const childProcess = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { getState, fail } = require("./actions");
const { REQUEST_DIR, REQUEST_PATH, requestBody, checkWritten } = require("./request");

function post() {
  const name = getState("name");
  const version = getState("version");
  if (!name) {
    // The main step failed, so the job did not pass. Nothing to do.
    return;
  }

  if (getState("remove") === "true") {
    for (const file of [".ssh", ".gitconfig"]) {
      fs.rmSync(path.join(os.homedir(), file), { recursive: true, force: true });
    }
    console.log("Removed ~/.ssh and ~/.gitconfig.");
  }

  // The runner user does not own /opt/actions-runner.
  childProcess.execFileSync("sudo", ["-n", "install", "-d", "-o", String(os.userInfo().uid), REQUEST_DIR], {
    stdio: "inherit",
  });
  // Remove an earlier file first, so that the write never follows a symbolic
  // link that a job step left there.
  fs.rmSync(REQUEST_PATH, { force: true });
  fs.writeFileSync(REQUEST_PATH, requestBody(name, version), { flag: "wx" });

  const problem = checkWritten(REQUEST_PATH, name, version);
  if (problem) {
    fail(problem);
    return;
  }
  console.log(`Asked Trunk Runners to save this disk as "${name}" (version ${version}).`);
  console.log(fs.readFileSync(REQUEST_PATH, "utf8").trim());
}

post();

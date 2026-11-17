// The main step: checks the inputs and the runner when the job starts, so a
// mistake fails the job at once and not after a long build. It writes
// nothing; the post step writes the request when the job passed.
"use strict";

const { getInput, saveState, fail } = require("./actions");
const { checkName, checkVersion } = require("./request");

function main() {
  const name = getInput("name");
  const version = getInput("version") || "1.*";
  const remove = getInput("remove-ssh-and-git-config") || "true";

  const problems = [checkName(name), checkVersion(version)];
  if (remove !== "true" && remove !== "false") {
    problems.push(`remove-ssh-and-git-config must be "true" or "false", not "${remove}".`);
  }
  // Trunk Runners sets this variable only on an image generation runner. On
  // any other runner, nothing reads the request file.
  if (process.env.GITHUB_ACTIONS_IMAGE_GEN_ENABLED !== "true") {
    problems.push(
      'This job does not run on a Trunk Runners image generation runner. Add "..image-gen=true" to runs-on.',
    );
  }
  const found = problems.filter(Boolean);
  if (found.length > 0) {
    found.forEach(fail);
    return;
  }

  saveState("name", name);
  saveState("version", version);
  saveState("remove", remove);
  console.log(`When this job passes, Trunk Runners saves its disk as the base image "${name}" (version ${version}).`);
}

main();

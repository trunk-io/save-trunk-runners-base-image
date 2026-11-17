"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");
const { checkName, checkVersion, requestBody, checkWritten } = require("../src/request");

// The same cases as the Trunk Runners server tests.
test("accepts the names that the server accepts", () => {
  for (const name of ["a", "0", "death-star-ci-snapshot", "a".repeat(63), "ci-2"]) {
    assert.equal(checkName(name), null, name);
  }
});

test("refuses the names that the server refuses", () => {
  for (const name of ["", "-ci", "Rust", "rust_ci", "a.b", "a".repeat(64), "a b"]) {
    assert.notEqual(checkName(name), null, name);
  }
});

test("accepts <major>.* versions from 1 to 999", () => {
  for (const version of ["1.*", "2.*", "999.*"]) {
    assert.equal(checkVersion(version), null, version);
  }
});

test("refuses the versions that the server refuses", () => {
  for (const version of ["2", "2.1", "1.2", "2.1.0", "latest", "0.*", "1000.*", "01.*", ".*", "a.*", ""]) {
    assert.notEqual(checkVersion(version), null, version);
  }
});

test("writes the keys that the launcher reads", () => {
  assert.deepEqual(JSON.parse(requestBody("ci", "1.*")), { ImageName: "ci", Version: "1.*" });
});

test("the read-back accepts the written file and refuses a symbolic link", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "request-"));
  const file = path.join(dir, "request.json");
  fs.writeFileSync(file, requestBody("ci", "1.*"));
  assert.equal(checkWritten(file, "ci", "1.*"), null);
  assert.notEqual(checkWritten(file, "other", "1.*"), null);

  const link = path.join(dir, "link.json");
  fs.symlinkSync(file, link);
  assert.notEqual(checkWritten(link, "ci", "1.*"), null);
});

# Save Trunk Runners base image

A GitHub Action that saves the disk of a [Trunk Runners](https://trunk.io) job
as a **base image** (a template) when the job passes. Later jobs boot that disk
with `template=<name>` in `runs-on`, so the tools, images and caches that the
job prepared are already there.

## Usage

Make the action the **first step** of a job that runs on an image generation
runner (`image-gen=true` in `runs-on`):

```yaml
jobs:
  base-image:
    runs-on: trunk=${{ github.run_id }}-${{ github.run_attempt }}..size=large..image-gen=true
    steps:
      - uses: trunk-io/save-trunk-runners-base-image@<full commit SHA> # v1
        with:
          name: my-ci-base-image

      - uses: actions/checkout@v7
      # ... install tools, pull images, fill caches ...
```

Then boot it in other jobs:

```yaml
    runs-on: trunk=${{ github.run_id }}-${{ github.run_attempt }}..size=large..template=my-ci-base-image
```

Pin the action to a full commit SHA. The job that makes a base image often has
secrets, and every job that boots the base image runs on its disk.

## How it works

- **When the job starts** (the main step), the action checks the inputs and
  the runner. A bad name, a bad version or a runner with no `image-gen=true`
  fails the job at once, not after a long build. This step writes nothing.
- **When the job ends** (the post step), and only if the job passed, the
  action:
  1. removes `~/.ssh` and `~/.gitconfig` (unless
     `remove-ssh-and-git-config: false`);
  2. writes the request file `/opt/actions-runner/.snapshot/request.json`;
  3. reads the file back and fails the job if it is not correct.

  After the runner exits, Trunk Runners checks with GitHub that the job passed
  and saves the disk. The **Trunk template capture** check run on the commit
  shows the result, or the reason for a refusal.

GitHub runs post steps in the reverse order of the steps. As the first step,
this action's post step runs last, so no other step changes the disk after the
request.

## Inputs

| Input | Required | Default | Description |
| --- | --- | --- | --- |
| `name` | yes | | The base image name: 1 to 63 characters, lowercase letters, digits and `-`, and not starting with `-`. |
| `version` | no | `1.*` | The major version, as `<major>.*` (major 1 to 999). Trunk Runners sets the minor version: each saved disk gets the next one. |
| `remove-ssh-and-git-config` | no | `true` | Remove `~/.ssh` and `~/.gitconfig` before the disk is saved. |

## Rules for the job

- **Do not write a secret to the disk.** Every job that boots the base image
  can read it. Keep credentials in step environment variables or in memory
  (`/dev/shm`). Trunk Runners removes the checkout and its own credentials
  before it saves the disk.
- **Run on the host.** The action does not work in a `container:` job: the
  request file must be on the runner host.
- **This action or `snapshot:`, not both.** Where your organization can use
  GitHub's `snapshot:` job keyword, it does the same thing. This action is for
  organizations where GitHub refuses that keyword, and it adds the early
  checks.

## License

MIT

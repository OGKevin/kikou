# Instructions for GitHub Copilot

This is a tauri + nextjs project.

The main purpose of this project is to have a modern application for tagging
commics/manga using the Comicinfo.xml standard.

## General Instructions

When making changes, ensure that a majority of the logic is in the rust backend. The frontend should only do visual stuff and call the backend for logic.

## Tooling & devenv

You may use `devenv shell -- <cli args>` for running commands, formatting, linting, building, and testing, both in CI and locally. Prefer this over direct cargo/pnpm commands when possible. If the `DEVENV_ROOT` environment variable is set, you are already inside a devenv shell and should run commands directly (without `devenv shell --`).

## Rust Files

When changing rust files, make sure to run `cargo fmt` to format the code and
`cargo clippy` to lint the code.

Next to this, ensure the code compiles and passes all tests by running:

- `cargo check --workspace` (or `cargo check` from workspace root)
- `cargo test --workspace` (or `cargo test` from workspace root)

Or use:

- `devenv shell -- cargo check --workspace`
- `devenv shell -- cargo test --workspace`

**Note:** The project uses a Rust workspace with members `src-tauri` and `src-tauri/calibre_db`. Run commands from the workspace root (`/workspaces/kikou`) to check and test all crates together, or use `--workspace` flag to ensure both crates are included.

## Frontend/Typescript Files

For frontend, `pnpm` and `nextjs` are used.

Prefer to use react components where it makes sense to do so.

To make sure it all works, please run `pnpm build` and `pnpm test`.
Or use:

- `devenv shell -- pnpm build`
- `devenv shell -- pnpm test`

Make sure that all typescript types are correct and there are no `any` or `unknown` types used.

Make sure the code is linted using `pnpm lint` or `devenv shell -- pnpm lint`.

### Tauri Commands

When making changes to the rust backend, please ensure that the tauri commands
are properly typed in the frontend. Make sure to create a wrapper function for the invoke call under `src/api/`.

## TDD

When adding new features, please add tests for the rust backend and the
frontend.

Tests should be added first before the actual implementation.

### Rust Tests

Rust tests can be executed via:

`cargo test --workspace`
Or use:
`devenv shell -- cargo test --workspace`

To run tests for a specific crate:

- `cargo test -p calibre_db` (calibre_db crate only)
- `cargo test --manifest-path=src-tauri/Cargo.toml` (src-tauri crate only)

## Code Style

When it comes to the code, please prefer to not use `else` statements. Instead, use early returns to make the code more readable.

Have a preference for small functions that do one thing only.

There is no need to leave comments in the code, unless it is really necessary. The code should be self-explanatory.

Please add new lines around control structures like `if`, `for`, `while`, etc.

Prefer the use of Traits, Interfaces, Data Objects and Enums to make the code more readable and maintainable.

### Formatting

- For rust, use `cargo fmt` to format the code or `devenv shell -- cargo fmt`.
- For frontend, use `prettier` to format the code or `devenv shell -- pnpm fmt`.

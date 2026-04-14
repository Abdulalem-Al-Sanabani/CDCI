# Project Guidelines

## Repository State
This repository is currently a blank CI/CD workspace.
Before adding code or automation, inspect the files present and derive the stack from the actual project contents instead of assuming a language, framework, or deployment platform.

## Structure
Keep shared GitHub automation under `.github/`.
Place GitHub Actions workflows in `.github/workflows/`.
Keep reusable scripts in clearly named top-level folders such as `scripts/` or `tools/` once they exist.

## Build and Test
Do not invent build or test commands.
When a stack is introduced, prefer the commands already defined by the project itself such as package scripts, Make targets, or existing CI jobs.
If no executable validation exists yet, state that explicitly instead of pretending the repository was verified.

## Conventions
Prefer small, reviewable CI/CD changes that modify one concern at a time.
When adding automation, document required secrets, environment variables, and external services near the workflow or in the repository documentation.
Avoid introducing platform-specific tooling unless the repository files or user request clearly call for it.
If the repository grows into multiple areas with different rules, add scoped instruction files instead of expanding this file into a catch-all document.
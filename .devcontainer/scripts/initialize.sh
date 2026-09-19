#!/usr/bin/env bash

set -euo pipefail

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly WORKSPACE_DIR="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"

mkdir -p "${WORKSPACE_DIR}/.codex-local" "${HOME}/.codex"

if [[ ! -f "${HOME}/.codex/auth.json" ]]; then
  printf '{}\n' >"${HOME}/.codex/auth.json"
fi

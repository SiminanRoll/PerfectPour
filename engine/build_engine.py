#!/usr/bin/env python3
"""Rebuild/test the dependency-free Rust engine and copy its browser artifact."""
from pathlib import Path
import os
import shutil
import subprocess

root = Path(__file__).resolve().parent
env = os.environ.copy()
cargo = shutil.which("cargo")
if not cargo:
    isolated = root / ".toolchain" / "cargo" / "bin" / "cargo"
    if isolated.exists():
        cargo = str(isolated)
        env["CARGO_HOME"] = str(root / ".toolchain" / "cargo")
        env["RUSTUP_HOME"] = str(root / ".toolchain" / "rustup")
        env["PATH"] = str(isolated.parent) + os.pathsep + env.get("PATH", "")
if not cargo:
    raise SystemExit("Install Rust from https://rustup.rs and run: rustup target add wasm32-unknown-unknown")

subprocess.run([cargo, "test", "--manifest-path", str(root / "Cargo.toml")], env=env, check=True)
subprocess.run([cargo, "build", "--manifest-path", str(root / "Cargo.toml"),
                "--target", "wasm32-unknown-unknown", "--release"], env=env, check=True)
source = root / "target" / "wasm32-unknown-unknown" / "release" / "perfect_pour_engine.wasm"
destination = root / "perfect_pour_engine.wasm"
shutil.copyfile(source, destination)
print(f"Built {destination.name} ({destination.stat().st_size:,} bytes)")


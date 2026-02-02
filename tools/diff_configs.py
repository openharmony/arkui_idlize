#!/usr/bin/env python3
"""
Generate a diff between code generated from two different interface_sdk-js versions.

Usage:
    python diff_configs.py <old-ref> <new-ref> [output-diff-file]

Arguments:
    old-ref: The older/base git reference (commit, branch, or tag)
    new-ref: The newer git reference to compare against

The diff shows changes FROM old-ref TO new-ref:
    - Lines starting with '-' were removed (existed in old-ref)
    - Lines starting with '+' were added (new in new-ref)

Examples:
    python diff_configs.py HEAD~5 HEAD           # Changes in last 5 commits
    python diff_configs.py v1.0.0 v2.0.0         # Changes between releases
    python diff_configs.py main feature-branch   # Changes on feature branch
"""

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Optional


class Colors:
    """ANSI color codes for terminal output."""
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color


def log_info(msg: str) -> None:
    print(f"{Colors.BLUE}[INFO]{Colors.NC} {msg}")


def log_success(msg: str) -> None:
    print(f"{Colors.GREEN}[SUCCESS]{Colors.NC} {msg}")


def log_warn(msg: str) -> None:
    print(f"{Colors.YELLOW}[WARN]{Colors.NC} {msg}")


def log_error(msg: str) -> None:
    print(f"{Colors.RED}[ERROR]{Colors.NC} {msg}")


def run_command(cmd: list[str], cwd: Optional[Path] = None, silent: bool = False) -> subprocess.CompletedProcess:
    """Run a shell command and return the result."""
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            check=True
        )
        if not silent and result.stdout:
            print(result.stdout)
        return result
    except subprocess.CalledProcessError as e:
        if not silent:
            log_error(f"Command failed: {' '.join(cmd)}")
            if e.stdout:
                print(e.stdout)
            if e.stderr:
                print(e.stderr)
        raise


def git_checkout(repo_dir: Path, ref: str) -> None:
    """Checkout a git repository to a specific ref."""
    run_command(['git', 'fetch', '--all', '--quiet'], cwd=repo_dir, silent=True)
    run_command(['git', 'checkout', ref, '--quiet'], cwd=repo_dir, silent=True)


def git_get_current_ref(repo_dir: Path) -> str:
    """Get the current git ref (branch name or commit hash)."""
    try:
        result = run_command(
            ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
            cwd=repo_dir,
            silent=True
        )
        ref = result.stdout.strip()
        if ref == 'HEAD':
            # Detached HEAD, get commit hash
            result = run_command(['git', 'rev-parse', 'HEAD'], cwd=repo_dir, silent=True)
            ref = result.stdout.strip()
        return ref
    except subprocess.CalledProcessError:
        return ''


def validate_git_ref(repo_dir: Path, ref: str) -> bool:
    """Check if a git ref exists in the repository."""
    try:
        run_command(['git', 'rev-parse', ref], cwd=repo_dir, silent=True)
        return True
    except subprocess.CalledProcessError:
        return False


def sanitize_ref_name(ref: str) -> str:
    """Convert a git ref to a safe filename."""
    return ref.replace('/', '-').replace('~', '_').replace('^', '_')


class DiffGenerator:
    """Generate diffs between two interface_sdk-js versions."""

    def __init__(self, repo_root: Path):
        self.repo_root = repo_root
        self.interface_sdk_dir = repo_root / 'interface_sdk-js'
        self.sdk_patched_dir = repo_root / 'sdk-patched-arkts'
        self.runner_dir = repo_root / 'runner'
        self.etsgen_dir = repo_root / 'etsgen'
        self.scraper_dir = repo_root / 'scraper'
        self.generated_dir = self.scraper_dir / 'out' / 'generated'
        self.ohos_base_idl = self.scraper_dir / 'out' / 'idl' / '@ohos.base.idl'

        self.original_sdk_ref: Optional[str] = None
        self.temp_dir: Optional[Path] = None

    def validate_directories(self) -> bool:
        """Ensure all required directories exist."""
        required = [
            (self.interface_sdk_dir, 'interface_sdk-js'),
            (self.runner_dir, 'runner'),
            (self.etsgen_dir, 'etsgen'),
            (self.scraper_dir, 'scraper'),
        ]

        for path, name in required:
            if not path.exists():
                log_error(f"Required directory not found: {name} ({path})")
                return False
        return True

    def patch_ohos_base_idl(self) -> bool:
        """
        Patch @ohos.base.idl to fix TypeParameters.
        Changes [TypeParameters="T,E"] to [TypeParameters="T"] on line 4.
        This is a workaround for a known issue in the generated IDL.
        """
        if not self.ohos_base_idl.exists():
            log_warn(f"@ohos.base.idl not found at {self.ohos_base_idl}")
            return True  # Not a fatal error

        log_info("Patching @ohos.base.idl (fixing TypeParameters)...")
        try:
            content = self.ohos_base_idl.read_text()
            # Replace T,E with T in TypeParameters on AsyncCallback line
            patched = content.replace('[TypeParameters="T,E"]', '[TypeParameters="T"]')
            if content != patched:
                self.ohos_base_idl.write_text(patched)
                log_info("Patched: [TypeParameters=\"T,E\"] -> [TypeParameters=\"T\"]")
            return True
        except Exception as e:
            log_error(f"Failed to patch @ohos.base.idl: {e}")
            return False

    def save_original_state(self) -> None:
        """Save the current git state to restore later."""
        self.original_sdk_ref = git_get_current_ref(self.interface_sdk_dir)
        log_info(f"Saved original interface_sdk-js state: {self.original_sdk_ref}")

    def restore_original_state(self) -> None:
        """Restore the original git state."""
        if self.original_sdk_ref:
            log_info(f"Restoring interface_sdk-js to: {self.original_sdk_ref}")
            try:
                git_checkout(self.interface_sdk_dir, self.original_sdk_ref)
            except subprocess.CalledProcessError:
                log_warn("Could not restore original state")

    def generate_for_ref(self, ref: str, output_dir: Path) -> bool:
        """Generate code for a specific git ref."""
        log_info(f"Generating code for ref: {ref}")

        # Step 1: Checkout interface_sdk-js
        log_info(f"Checking out interface_sdk-js to {ref}...")
        try:
            git_checkout(self.interface_sdk_dir, ref)
        except subprocess.CalledProcessError:
            log_error(f"Failed to checkout {ref}")
            return False

        # Step 2: Run prepare:sdk to transform interface definitions
        log_info("Running prepare:sdk (transforming interface definitions)...")
        try:
            run_command(['npm', 'run', 'prepare:sdk'], cwd=self.runner_dir, silent=True)
        except subprocess.CalledProcessError:
            log_error("prepare:sdk failed")
            return False

        # Step 3: Run etsgen to convert to IDL
        log_info("Running etsgen (ets2idl conversion)...")
        try:
            run_command(['npm', 'run', 'run:sdk'], cwd=self.etsgen_dir, silent=True)
        except subprocess.CalledProcessError:
            log_error("etsgen failed")
            return False

        # Step 4: Run scraper
        log_info("Running scraper...")
        try:
            run_command(['npm', 'run', 'go'], cwd=self.scraper_dir, silent=True)
        except subprocess.CalledProcessError:
            log_error("scraper failed")
            return False

        # Step 5: Patch @ohos.base.idl (workaround for TypeParameters issue)
        if not self.patch_ohos_base_idl():
            return False

        # Step 6: Run code generation (go-main.sh)
        log_info("Running code generation (go-main.sh)...")
        go_main_script = self.scraper_dir / 'out' / 'go-main.sh'
        try:
            run_command(['bash', str(go_main_script)], cwd=self.scraper_dir / 'out', silent=True)
        except subprocess.CalledProcessError:
            log_error("go-main.sh failed")
            return False

        # Step 7: Copy generated files
        log_info(f"Copying generated files to {output_dir}...")
        if output_dir.exists():
            shutil.rmtree(output_dir)

        if self.generated_dir.exists():
            shutil.copytree(self.generated_dir, output_dir)
        else:
            log_error(f"Generated directory not found: {self.generated_dir}")
            return False

        log_success(f"Generation complete for ref: {ref}")
        return True

    def generate_diff(self, ref_a: str, ref_b: str, output_file: Path) -> bool:
        """Generate a diff between two refs."""
        ref_a_safe = sanitize_ref_name(ref_a)
        ref_b_safe = sanitize_ref_name(ref_b)

        # Create temp directory
        self.temp_dir = Path(tempfile.mkdtemp())
        output_a = self.temp_dir / f"output-{ref_a_safe}"
        output_b = self.temp_dir / f"output-{ref_b_safe}"

        log_info(f"Temporary directory: {self.temp_dir}")
        log_info(f"Comparing: {ref_a} vs {ref_b}")

        try:
            # Generate for ref A
            log_info("=" * 50)
            log_info(f"Step 1/3: Generating code for {ref_a}")
            log_info("=" * 50)
            if not self.generate_for_ref(ref_a, output_a):
                return False

            # Generate for ref B
            log_info("=" * 50)
            log_info(f"Step 2/3: Generating code for {ref_b}")
            log_info("=" * 50)
            if not self.generate_for_ref(ref_b, output_b):
                return False

            # Generate diff
            log_info("=" * 50)
            log_info("Step 3/3: Generating diff")
            log_info("=" * 50)

            log_info(f"Creating diff file: {output_file}")

            # Use diff command
            result = subprocess.run(
                ['diff', '-ruN',
                 '--label', f'a/{ref_a}',
                 '--label', f'b/{ref_b}',
                 str(output_a),
                 str(output_b)],
                capture_output=True,
                text=True,
                cwd=self.temp_dir
            )

            # diff returns 1 if there are differences, 0 if identical
            if result.returncode in (0, 1):
                if result.stdout:
                    output_file.write_text(result.stdout)
                    diff_lines = len(result.stdout.splitlines())
                    log_success(f"Diff file created: {output_file}")
                    log_info(f"Diff contains {diff_lines} lines")

                    # Count added/removed lines
                    added = sum(1 for line in result.stdout.splitlines() if line.startswith('+'))
                    removed = sum(1 for line in result.stdout.splitlines() if line.startswith('-'))
                    log_info(f"Summary: +{added} lines added, -{removed} lines removed")
                else:
                    log_info(f"No differences found between {ref_a} and {ref_b}")
            else:
                log_error(f"diff command failed with return code {result.returncode}")
                if result.stderr:
                    print(result.stderr)
                return False

            return True

        finally:
            # Cleanup temp directory
            if self.temp_dir and self.temp_dir.exists():
                shutil.rmtree(self.temp_dir)

    def run(self, ref_a: str, ref_b: str, output_file: Optional[str] = None) -> int:
        """Main entry point."""
        # Validate directories
        if not self.validate_directories():
            return 1

        # Validate refs
        if not validate_git_ref(self.interface_sdk_dir, ref_a):
            log_error(f"Invalid git reference: {ref_a}")
            return 1

        if not validate_git_ref(self.interface_sdk_dir, ref_b):
            log_error(f"Invalid git reference: {ref_b}")
            return 1

        # Determine output file
        if output_file is None:
            ref_a_safe = sanitize_ref_name(ref_a)
            ref_b_safe = sanitize_ref_name(ref_b)
            output_file = f"diff-{ref_a_safe}-vs-{ref_b_safe}.patch"

        output_path = self.repo_root / output_file

        # Save original state
        self.save_original_state()

        try:
            success = self.generate_diff(ref_a, ref_b, output_path)
            return 0 if success else 1
        finally:
            self.restore_original_state()
            log_success("Done!")


def main():
    parser = argparse.ArgumentParser(
        description='Generate a diff between code generated from two different interface_sdk-js versions.'
    )
    parser.add_argument('ref_a', metavar='old-ref', help='Older/base git reference (commit, branch, or tag)')
    parser.add_argument('ref_b', metavar='new-ref', help='Newer git reference to compare against')
    parser.add_argument('output', nargs='?', help='Output diff file (optional)')

    args = parser.parse_args()

    # Find repo root (script is in tools/)
    script_dir = Path(__file__).resolve().parent
    repo_root = script_dir.parent

    generator = DiffGenerator(repo_root)
    return generator.run(args.ref_a, args.ref_b, args.output)


if __name__ == '__main__':
    sys.exit(main())

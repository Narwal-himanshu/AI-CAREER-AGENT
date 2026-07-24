#!/usr/bin/env python3
"""Convert leetcode-company-wise-problems CSVs into companywise.json."""

import csv
import json
import io
from pathlib import Path

REPO_ROOT = Path("/var/folders/9w/qg1zplbx21g2lpwqxbn_rl780000gn/T/opencode/repos/leetcode-company-wise-problems")
OUTPUT = Path(__file__).resolve().parent.parent / "backend" / "data" / "companywise.json"


def parse_csv(filepath: Path) -> list[dict]:
    """Parse a company CSV file into a list of problem dicts."""
    problems = []
    text = filepath.read_text(encoding="utf-8")
    reader = csv.DictReader(io.StringIO(text))

    for row in reader:
        difficulty = (row.get("Difficulty") or "MEDIUM").strip().upper()
        if difficulty not in ("EASY", "MEDIUM", "HARD"):
            difficulty = "MEDIUM"

        title = (row.get("Title") or "").strip()
        url = (row.get("Link") or "").strip()
        topics_raw = (row.get("Topics") or "").strip()
        tags = [t.strip() for t in topics_raw.split(",") if t.strip()] if topics_raw else []

        try:
            frequency = float(row.get("Frequency", 0) or 0)
        except (ValueError, TypeError):
            frequency = 0.0

        try:
            acceptance = float(row.get("Acceptance Rate", 0) or 0)
        except (ValueError, TypeError):
            acceptance = 0.0

        if not title or not url:
            continue

        problems.append({
            "title": title,
            "difficulty": difficulty,
            "frequency": round(frequency, 1),
            "acceptance_rate": round(acceptance * 100, 2) if acceptance < 1 else round(acceptance, 2),
            "url": url,
            "tags": tags,
        })

    return problems


def main():
    companies = []

    # Get all company directories
    company_dirs = sorted([
        d for d in REPO_ROOT.iterdir()
        if d.is_dir() and not d.name.startswith(".")
    ])

    print(f"Found {len(company_dirs)} company directories")

    for company_dir in company_dirs:
        company_name = company_dir.name

        # Prefer "5. All.csv"
        csv_file = company_dir / "5. All.csv"
        if not csv_file.exists():
            # Try other CSV files
            csv_files = sorted(company_dir.glob("*.csv"))
            if not csv_files:
                print(f"  Skipping {company_name} - no CSV files")
                continue
            csv_file = csv_files[-1]  # Use the last one (most comprehensive)

        problems = parse_csv(csv_file)
        if not problems:
            print(f"  Skipping {company_name} - no valid problems")
            continue

        companies.append({
            "company_name": company_name,
            "problem_count": len(problems),
            "problems": problems,
        })
        print(f"  {company_name}: {len(problems)} problems")

    # Sort by problem count descending
    companies.sort(key=lambda c: c["problem_count"], reverse=True)

    output = {
        "total_companies": len(companies),
        "total_problems": sum(c["problem_count"] for c in companies),
        "companies": companies,
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nDone! Wrote {output['total_companies']} companies with {output['total_problems']} total problems to {OUTPUT}")


if __name__ == "__main__":
    main()

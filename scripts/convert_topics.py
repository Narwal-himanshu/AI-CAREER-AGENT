#!/usr/bin/env python3
"""Convert 450DSA topic-wise JS files into a single topicwise.json.
Uses a simple line-by-line parser instead of JS-to-JSON conversion."""

import json
import re
from pathlib import Path

REPO_SRC = Path("/var/folders/9w/qg1zplbx21g2lpwqxbn_rl780000gn/T/opencode/repos/450dsa/src")
OUTPUT = Path(__file__).resolve().parent.parent / "backend" / "data" / "topicwise.json"

JS_FILES = ["450DSAFinal.js", "STriverSDEData.js", "StriverDSAData.js"]


def parse_js_file(filepath: Path) -> list[dict]:
    """Parse a JS file into a list of topic sections with questions."""
    text = filepath.read_text(encoding="utf-8")
    # Normalize: replace tabs, strip \r
    text = text.replace("\r", "").replace("\t", " ")

    sections = []
    current_section = None
    current_question = None

    for line in text.split("\n"):
        stripped = line.strip()

        # Match topicName: '...' or "topicName": "..."
        m = re.match(r'(?:topicName|["\']topicName["\'])\s*:\s*[\'"](.+?)[\'"]', stripped)
        if m:
            if current_section and current_section.get("problems"):
                sections.append(current_section)
            current_section = {
                "topic_name": m.group(1).strip(),
                "problems": [],
            }
            continue

        # Match Problem: '...' or "Question": "..."
        m = re.match(r'(?:Problem|["\']Question["\'])\s*:\s*[\'"](.+?)[\'"]\s*,?\s*$', stripped)
        if m:
            current_question = {"title": m.group(1).strip()}
            continue

        # Match URL: '...' or "Question_link": "..."
        m = re.match(r'(?:URL|["\']Question_link["\'])\s*:\s*[\'"](.+?)[\'"]\s*,?\s*$', stripped)
        if m and current_question:
            url = m.group(1).strip()
            url = re.sub(r"\s+$", "", url)
            current_question["url"] = url

            if current_section and current_question.get("title") and current_question.get("url"):
                current_question["difficulty"] = "MEDIUM"
                topic = current_section["topic_name"]
                current_question["tags"] = [topic]
                current_section["problems"].append(current_question)
            current_question = None
            continue

        # Match Topic: '...' (inside question object)
        m = re.match(r'(?:Topic|["\']Topic["\'])\s*:\s*[\'"](.+?)[\'"]', stripped)
        if m and current_question:
            current_question["tag"] = m.group(1).strip()

    # Append last section
    if current_section and current_section.get("problems"):
        sections.append(current_section)

    return sections


def main():
    all_urls = set()
    topic_order = []
    topic_problems = {}  # topic_name -> [problem]

    for js_file in JS_FILES:
        filepath = REPO_SRC / js_file
        if not filepath.exists():
            print(f"Warning: {filepath} not found, skipping")
            continue

        print(f"Processing {js_file}...")
        sections = parse_js_file(filepath)
        print(f"  Found {len(sections)} sections")

        for section in sections:
            topic_name = section["topic_name"]

            if topic_name not in topic_problems:
                topic_order.append(topic_name)
                topic_problems[topic_name] = []

            for prob in section["problems"]:
                if not prob.get("url") or not prob.get("title"):
                    continue
                if prob["url"] in all_urls:
                    continue
                all_urls.add(prob["url"])

                tag = prob.pop("tag", None)
                if tag and tag not in prob["tags"]:
                    prob["tags"] = [tag] if tag else prob["tags"]

                topic_problems[topic_name].append(prob)

    # Build output
    topics = []
    for topic_name in topic_order:
        problems = topic_problems[topic_name]
        if not problems:
            continue
        topics.append({
            "topic_name": topic_name,
            "problem_count": len(problems),
            "problems": problems,
        })

    output = {
        "total_topics": len(topics),
        "total_problems": sum(t["problem_count"] for t in topics),
        "topics": topics,
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nDone! Wrote {output['total_problems']} problems across {output['total_topics']} topics to {OUTPUT}")


if __name__ == "__main__":
    main()

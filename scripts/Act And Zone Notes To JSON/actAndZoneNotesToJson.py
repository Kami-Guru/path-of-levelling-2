#!/usr/bin/env python3
"""
Convert PoE2 Act/Zone notes from .txt into zoneNotes.json
Running this script creates a zoneNotes.json in the poe2/ directory, replace the zoneNotes.json in
profiles/poe2/referenceData/ with the new one.

Zone drafts: each zone starts with a header line
  <zoneCode> <zoneName>---
followed by note lines until the next zone header.

Act notes: blocks headed by ACT 1--- or Interludes---.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

# G1_1, G1_13_2, P1_Town, G4_11_1a, G3_16
ZONE_HEADER_RE = re.compile(
    r"^([A-Z][A-Za-z0-9_]+)\s+(.+?)-+\s*$",
)

ACT_NUMBER_HEADER_RE = re.compile(
    r"^ACT\s+(\d+)\s*-+\s*$",
    re.IGNORECASE,
)

INTERLUDES_HEADER_RE = re.compile(
    r"^Interludes\s*-+\s*$",
    re.IGNORECASE,
)

POE2_ZONE_DRAFT_GLOB = "Zone Notes Act *.txt"
POE2_INTERLUDES_DRAFT = "Zone Notes Interludes.txt"
POE2_ACT_NOTES_DRAFT = "Act Notes.txt"

ACT_NOTE_ORDER = (
    "Act 1",
    "Act 2",
    "Act 3",
    "Act 4",
    "Interludes",
)


def _strip_trailing_newlines(text: str) -> str:
    while text.endswith("\n"):
        text = text[:-1]
    return text


def parse_zone_notes_draft(text: str) -> list[dict[str, str]]:
    """Parse a zone-notes draft file into zone note dicts (without lockNoteOption)."""
    zones: list[dict[str, str]] = []
    current_code: str | None = None
    current_name: str | None = None
    note_lines: list[str] = []

    def flush_zone() -> None:
        nonlocal current_code, current_name, note_lines
        if current_code is None:
            return
        zones.append(
            {
                "zoneCode": current_code,
                "zoneName": current_name or "",
                "notes": _strip_trailing_newlines("\n".join(note_lines)),
            }
        )
        current_code = None
        current_name = None
        note_lines = []

    for raw_line in text.splitlines():
        header_match = ZONE_HEADER_RE.match(raw_line.rstrip("\n\r"))
        if header_match:
            flush_zone()
            current_code = header_match.group(1)
            current_name = header_match.group(2).strip()
            continue
        if current_code is not None:
            note_lines.append(raw_line.rstrip("\n\r"))

    flush_zone()
    return zones


def parse_act_notes_draft(text: str) -> list[dict[str, str]]:
    """Parse poe2/act notes.txt into act note dicts (without lockNoteOption)."""
    acts: list[dict[str, str]] = []
    current_name: str | None = None
    note_lines: list[str] = []

    def flush_act() -> None:
        nonlocal current_name, note_lines
        if current_name is None:
            return
        acts.append(
            {
                "actName": current_name,
                "notes": _strip_trailing_newlines("\n".join(note_lines)),
            }
        )
        current_name = None
        note_lines = []

    for raw_line in text.splitlines():
        line = raw_line.rstrip("\n\r")
        act_match = ACT_NUMBER_HEADER_RE.match(line)
        if act_match:
            flush_act()
            current_name = f"Act {act_match.group(1)}"
            continue
        if INTERLUDES_HEADER_RE.match(line):
            flush_act()
            current_name = "Interludes"
            continue
        if current_name is not None:
            note_lines.append(line)

    flush_act()

    order_index = {name: index for index, name in enumerate(ACT_NOTE_ORDER)}
    acts.sort(key=lambda act: order_index.get(act["actName"], len(ACT_NOTE_ORDER)))
    return acts


def poe2_zone_draft_paths(poe2_dir: Path) -> list[Path]:
    """Act zone drafts in act-number order, then interludes."""
    act_drafts = sorted(
        poe2_dir.glob(POE2_ZONE_DRAFT_GLOB),
        key=lambda path: int(re.split(r'[ .]',path.name)[3]),
    )
    interludes = poe2_dir / POE2_INTERLUDES_DRAFT
    paths = list(act_drafts)
    if interludes.is_file():
        paths.append(interludes)
    return paths


def build_zone_notes_json(
    act_notes: list[dict[str, str]],
    zone_notes: list[dict[str, str]],
    *,
    lock_note_option: str = "unlocked",
) -> dict:
    return {
        "actNotes": [
            {
                "lockNoteOption": lock_note_option,
                "actName": act["actName"],
                "notes": act["notes"],
            }
            for act in act_notes
        ],
        "zoneNotes": [
            {
                "lockNoteOption": lock_note_option,
                "zoneCode": zone["zoneCode"],
                "zoneName": zone["zoneName"],
                "notes": zone["notes"],
            }
            for zone in zone_notes
        ],
    }


def convert_poe2_drafts(
    poe2_dir: Path,
    output_path: Path,
    *,
    lock_note_option: str = "unlocked",
) -> dict:
    zone_notes: list[dict[str, str]] = []
    for draft_path in poe2_zone_draft_paths(poe2_dir):
        parsed = parse_zone_notes_draft(draft_path.read_text(encoding="utf-8"))
        if not parsed:
            raise ValueError(f"No zone headers found in {draft_path}")
        zone_notes.extend(parsed)

    act_notes_path = poe2_dir / POE2_ACT_NOTES_DRAFT
    act_notes: list[dict[str, str]] = []
    if act_notes_path.is_file():
        act_notes = parse_act_notes_draft(
            act_notes_path.read_text(encoding="utf-8"),
        )

    result = build_zone_notes_json(
        act_notes,
        zone_notes,
        lock_note_option=lock_note_option,
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as out_file:
        json.dump(result, out_file, indent="\t", ensure_ascii=False)
        out_file.write("\n")
    return result


def convert_single_zone_draft(
    input_path: Path,
    output_path: Path,
    *,
    lock_note_option: str = "unlocked",
) -> dict:
    zone_notes = parse_zone_notes_draft(input_path.read_text(encoding="utf-8"))
    if not zone_notes:
        raise ValueError(f"No zone headers found in {input_path}")

    result = build_zone_notes_json([], zone_notes, lock_note_option=lock_note_option)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as out_file:
        json.dump(result, out_file, indent="\t", ensure_ascii=False)
        out_file.write("\n")
    return result


def main() -> int:
    script_dir = Path(__file__).resolve().parent
    poe2_dir = script_dir / "poe2"
    parser = argparse.ArgumentParser(
        description=(
            "Convert PoE2 act/zone-notes drafts to zoneNotes.json. "
            "By default merges all act zone drafts, interludes, and act notes."
        ),
    )
    parser.add_argument(
        "input",
        type=Path,
        nargs="?",
        help=(
            "Optional: a single zone-notes draft .txt file "
            "(skips multi-file merge and act notes)"
        ),
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=poe2_dir / "zoneNotes.json",
        help="Output JSON path (default: poe2/zoneNotes.json)",
    )
    args = parser.parse_args()

    output_path = args.output.resolve()

    try:
        if args.input is None:
            if not poe2_dir.is_dir():
                print(f"error: poe2 directory not found: {poe2_dir}", file=sys.stderr)
                return 1
            result = convert_poe2_drafts(poe2_dir, output_path)
            print(
                f"Wrote {len(result['actNotes'])} act notes and "
                f"{len(result['zoneNotes'])} zone notes to {output_path}",
            )
        else:
            input_path = args.input.resolve()
            if not input_path.is_file():
                print(f"error: input file not found: {input_path}", file=sys.stderr)
                return 1
            result = convert_single_zone_draft(input_path, output_path)
            print(
                f"Wrote {len(result['zoneNotes'])} zone notes to {output_path}",
            )
    except ValueError as error:
        print(f"error: {error}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())

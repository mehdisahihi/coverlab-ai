#!/usr/bin/env python3
"""Refresh large publisher journal identity catalogs from official sources.

This script intentionally updates identity-only generated files. It does not
create or modify publication technical profiles or AI-policy rules.

No third-party Python packages are required.
"""

from __future__ import annotations

import argparse
import html as html_lib
import io
import json
import math
import re
import time
import unicodedata
import urllib.parse
import urllib.request
import zipfile
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
CATALOG_DIR = ROOT / "lib" / "publications" / "catalog"

WILEY_PORTFOLIO_URL = (
    "https://onlinelibrary.wiley.com/partners/indexing-and-discovery"
)
# Current official 2026 workbook. The discovery page is attempted first so a
# newer link can replace this automatically when Wiley updates the file.
WILEY_2026_XLSX_FALLBACK = (
    "https://onlinelibrary.wiley.com/pb-assets/_PriceLists/"
    "All_Wiley_journals-1786635357360.xlsx"
)

ELSEVIER_JOURNAL_CATALOG_URL = "https://www.elsevier.com/products/journals"
ELSEVIER_SEARCH_API_URL = (
    "https://www.elsevier.com/api/search/journal-catalog-search"
)

USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/140.0 Safari/537.36 "
    "CoverLabAI-JournalCatalog/1.0"
)

ISSN_RE = re.compile(r"(?<!\d)(\d{4})-?(\d{3}[\dXx])(?!\d)")


@dataclass
class JournalIdentity:
    name: str
    issn: set[str] = field(default_factory=set)


def fetch_bytes(url: str, timeout: int = 90) -> bytes:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read()


def fetch_text(url: str, timeout: int = 90) -> str:
    payload = fetch_bytes(url, timeout=timeout)
    return payload.decode("utf-8", errors="replace")


def post_json(url: str, payload: dict[str, object], timeout: int = 90) -> object:
    body = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9",
            "Content-Type": "text/plain;charset=UTF-8",
            "Origin": "https://www.elsevier.com",
            "Referer": ELSEVIER_JOURNAL_CATALOG_URL,
        },
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        raw = response.read().decode("utf-8", errors="replace")
    try:
        return json.loads(raw)
    except json.JSONDecodeError as error:
        preview = collapse_space(raw[:500])
        raise RuntimeError(
            "Elsevier journal catalog API returned non-JSON content: "
            f"{preview!r}"
        ) from error


def collapse_space(value: str) -> str:
    return " ".join(html_lib.unescape(value).split()).strip()


def normalize_name(value: str) -> str:
    return collapse_space(value).casefold()


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    ascii_value = ascii_value.replace("&", " and ")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_value).strip("-").lower()
    return slug or "journal"


def normalize_issn(value: str) -> list[str]:
    found: list[str] = []
    for left, right in ISSN_RE.findall(value or ""):
        item = f"{left}-{right.upper()}"
        if item not in found:
            found.append(item)
    return found


def parse_manual_names(path: Path) -> tuple[set[str], set[str]]:
    """Return normalized names and IDs already maintained by hand."""
    text = path.read_text(encoding="utf-8")
    pattern = re.compile(
        r'id\s*:\s*"([^"]+)"[\s\S]*?name\s*:\s*"([^"]+)"',
        re.MULTILINE,
    )
    ids: set[str] = set()
    names: set[str] = set()
    for journal_id, name in pattern.findall(text):
        ids.add(journal_id)
        names.add(normalize_name(name))
    return names, ids


def relationship_target(root: ET.Element, relationship_id: str) -> str:
    for rel in root:
        if rel.attrib.get("Id") == relationship_id:
            target = rel.attrib.get("Target")
            if not target:
                break
            target = target.lstrip("/")
            if target.startswith("xl/"):
                return target
            return f"xl/{target}"
    raise RuntimeError(f"Could not resolve worksheet relationship {relationship_id}.")


def column_index(cell_reference: str) -> int:
    match = re.match(r"([A-Z]+)", cell_reference)
    if not match:
        return 0
    value = 0
    for character in match.group(1):
        value = value * 26 + (ord(character) - ord("A") + 1)
    return value - 1


def xlsx_rows(payload: bytes, preferred_sheet_fragment: str) -> list[dict[int, str]]:
    ns_main = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
    ns_rel = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"

    with zipfile.ZipFile(io.BytesIO(payload)) as archive:
        shared_strings: list[str] = []
        if "xl/sharedStrings.xml" in archive.namelist():
            shared_root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            for si in shared_root.findall(f"{{{ns_main}}}si"):
                text = "".join(
                    node.text or ""
                    for node in si.iter(f"{{{ns_main}}}t")
                )
                shared_strings.append(text)

        workbook_root = ET.fromstring(archive.read("xl/workbook.xml"))
        rels_root = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))

        sheets = workbook_root.find(f"{{{ns_main}}}sheets")
        if sheets is None:
            raise RuntimeError("Wiley workbook does not contain worksheets.")

        selected = None
        preferred = preferred_sheet_fragment.casefold()
        for sheet in sheets:
            name = sheet.attrib.get("name", "")
            if preferred in name.casefold():
                selected = sheet
                break
        if selected is None:
            selected = next(iter(sheets), None)
        if selected is None:
            raise RuntimeError("Could not select a Wiley workbook worksheet.")

        relationship_id = selected.attrib.get(f"{{{ns_rel}}}id")
        if not relationship_id:
            raise RuntimeError("Selected Wiley worksheet has no relationship ID.")

        sheet_path = relationship_target(rels_root, relationship_id)
        sheet_root = ET.fromstring(archive.read(sheet_path))

        rows: list[dict[int, str]] = []
        sheet_data = sheet_root.find(f"{{{ns_main}}}sheetData")
        if sheet_data is None:
            return rows

        for row in sheet_data.findall(f"{{{ns_main}}}row"):
            values: dict[int, str] = {}
            for cell in row.findall(f"{{{ns_main}}}c"):
                ref = cell.attrib.get("r", "A1")
                index = column_index(ref)
                cell_type = cell.attrib.get("t")

                value = ""
                if cell_type == "inlineStr":
                    inline = cell.find(f"{{{ns_main}}}is")
                    if inline is not None:
                        value = "".join(
                            node.text or ""
                            for node in inline.iter(f"{{{ns_main}}}t")
                        )
                else:
                    value_node = cell.find(f"{{{ns_main}}}v")
                    raw = value_node.text if value_node is not None else ""
                    if cell_type == "s" and raw:
                        try:
                            value = shared_strings[int(raw)]
                        except (ValueError, IndexError):
                            value = raw
                    else:
                        value = raw or ""

                values[index] = collapse_space(value)
            rows.append(values)

    return rows


def find_wiley_header(rows: list[dict[int, str]]) -> tuple[int, int, list[int]]:
    exact_title_headers = {
        "journal title",
        "publication title",
        "product title",
        "title",
    }
    best: tuple[int, int, int, list[int]] | None = None

    for row_index, row in enumerate(rows[:40]):
        normalized = {column: value.casefold().strip() for column, value in row.items()}
        title_columns = [
            column
            for column, header in normalized.items()
            if header in exact_title_headers
            or ("title" in header and "previous" not in header and "former" not in header)
        ]
        if not title_columns:
            continue
        issn_columns = [
            column for column, header in normalized.items() if "issn" in header
        ]
        score = 20 + len(issn_columns) * 3 + len(row)
        candidate = (score, row_index, title_columns[0], issn_columns)
        if best is None or candidate[0] > best[0]:
            best = candidate

    if best is None:
        preview = [list(row.values()) for row in rows[:12]]
        raise RuntimeError(
            "Could not identify the journal-title column in Wiley's workbook. "
            f"First rows: {preview!r}"
        )

    _, row_index, title_column, issn_columns = best
    return row_index, title_column, issn_columns


def discover_wiley_workbook_url() -> str:
    try:
        page = fetch_text(WILEY_PORTFOLIO_URL)
        links = re.findall(
            r'href=["\']([^"\']+\.xlsx(?:\?[^"\']*)?)["\']',
            page,
            flags=re.IGNORECASE,
        )
        if links:
            preferred = next(
                (
                    item
                    for item in links
                    if "all_wiley_journals" in item.casefold()
                    or "all-wiley-journals" in item.casefold()
                ),
                links[0],
            )
            return urllib.parse.urljoin(WILEY_PORTFOLIO_URL, preferred)
    except Exception as error:  # noqa: BLE001 - fallback is intentional.
        print(f"Wiley title-list discovery warning: {type(error).__name__}: {error}")

    return WILEY_2026_XLSX_FALLBACK


def load_wiley_journals(local_xlsx: Path | None = None) -> list[JournalIdentity]:
    if local_xlsx is not None:
        payload = local_xlsx.read_bytes()
        source_label = str(local_xlsx)
    else:
        workbook_url = discover_wiley_workbook_url()
        print(f"Fetching Wiley journal workbook: {workbook_url}")
        payload = fetch_bytes(workbook_url)
        source_label = workbook_url

    rows = xlsx_rows(payload, "All Journals")
    header_index, title_column, issn_columns = find_wiley_header(rows)

    by_name: dict[str, JournalIdentity] = {}
    for row in rows[header_index + 1 :]:
        title = collapse_space(row.get(title_column, ""))
        if not title:
            continue

        normalized = normalize_name(title)
        if normalized in {"journal title", "title"}:
            continue

        identity = by_name.setdefault(normalized, JournalIdentity(name=title))
        for column in issn_columns:
            identity.issn.update(normalize_issn(row.get(column, "")))

    journals = sorted(by_name.values(), key=lambda item: item.name.casefold())
    if len(journals) < 1400:
        raise RuntimeError(
            "Wiley source returned too few journals "
            f"({len(journals)} from {source_label}); refusing to overwrite the catalog."
        )
    return journals


def _string_values(value: object) -> list[str]:
    if isinstance(value, str):
        return [value]
    if isinstance(value, dict):
        found: list[str] = []
        for child in value.values():
            found.extend(_string_values(child))
        return found
    if isinstance(value, list):
        found = []
        for child in value:
            found.extend(_string_values(child))
        return found
    return []


def elsevier_issns(identifiers: object) -> set[str]:
    found: set[str] = set()
    if not isinstance(identifiers, dict):
        return found

    for key, value in identifiers.items():
        if "issn" not in str(key).casefold():
            continue
        for text in _string_values(value):
            found.update(normalize_issn(text))
    return found


def elsevier_api_page(page: int) -> tuple[list[dict[str, object]], int, int]:
    payload: dict[str, object] = {
        "query": "",
        "page": page,
        "filters": {},
        "sort": "alphabeticalAsc",
    }
    data = post_json(ELSEVIER_SEARCH_API_URL, payload)
    if not isinstance(data, dict):
        raise RuntimeError("Elsevier journal catalog API returned an invalid payload.")

    response = data.get("searchResponse")
    if not isinstance(response, dict):
        raise RuntimeError("Elsevier journal catalog API omitted searchResponse.")

    total = response.get("total")
    page_info = response.get("pageInfo")
    items = response.get("items")
    if not isinstance(total, int) or total <= 0:
        raise RuntimeError("Elsevier journal catalog API returned an invalid total.")
    if not isinstance(page_info, dict):
        raise RuntimeError("Elsevier journal catalog API omitted pageInfo.")
    if not isinstance(items, list):
        raise RuntimeError("Elsevier journal catalog API omitted journal items.")

    page_size = page_info.get("size")
    backend_page = page_info.get("page")
    if not isinstance(page_size, int) or page_size <= 0:
        raise RuntimeError("Elsevier journal catalog API returned an invalid page size.")

    # The public UI sends one-based page numbers. Its searchResponse pageInfo
    # reports the corresponding zero-based page index (page=1 -> pageInfo.page=0).
    expected_backend_page = page - 1
    if backend_page != expected_backend_page:
        raise RuntimeError(
            "Elsevier pagination mismatch: requested page "
            f"{page}, received backend page {backend_page!r}; refusing a partial update."
        )

    typed_items: list[dict[str, object]] = []
    for item in items:
        if not isinstance(item, dict):
            raise RuntimeError("Elsevier journal catalog returned a non-object result.")
        typed_items.append(item)

    return typed_items, total, page_size


def load_elsevier_journals() -> list[JournalIdentity]:
    print("Fetching Elsevier official journal catalog API: page 1")
    first_items, expected_total, page_size = elsevier_api_page(1)
    if expected_total < 2500:
        raise RuntimeError(
            "Elsevier official catalog returned too few raw journal records "
            f"({expected_total}); refusing to overwrite the catalog."
        )

    page_count = max(1, math.ceil(expected_total / page_size))
    by_name: dict[str, JournalIdentity] = {}
    seen_backend_ids: set[str] = set()
    raw_count = 0

    for page in range(1, page_count + 1):
        if page == 1:
            items = first_items
            total = expected_total
            size = page_size
        else:
            if page == 2 or page % 25 == 0 or page == page_count:
                print(f"Fetching Elsevier official journal catalog API: page {page}/{page_count}")
            items, total, size = elsevier_api_page(page)
            time.sleep(0.08)

        if total != expected_total:
            raise RuntimeError(
                "Elsevier catalog total changed during sync "
                f"({expected_total} -> {total}); refusing a potentially inconsistent update."
            )
        if size != page_size:
            raise RuntimeError(
                "Elsevier catalog page size changed during sync "
                f"({page_size} -> {size}); refusing a potentially inconsistent update."
            )

        expected_items = min(page_size, expected_total - (page - 1) * page_size)
        if len(items) != expected_items:
            raise RuntimeError(
                "Elsevier catalog returned an incomplete page "
                f"{page}: expected {expected_items} records, received {len(items)}."
            )

        for item in items:
            if item.get("__typename") != "Journal":
                raise RuntimeError(
                    "Elsevier journal-catalog API returned a non-Journal record; "
                    "refusing to mix unrelated catalog identities."
                )

            backend_id = item.get("id")
            if isinstance(backend_id, str) and backend_id:
                if backend_id in seen_backend_ids:
                    raise RuntimeError(
                        "Elsevier pagination repeated backend journal ID "
                        f"{backend_id!r}; refusing a partial/duplicated update."
                    )
                seen_backend_ids.add(backend_id)

            titles = item.get("titles")
            primary = titles.get("primary") if isinstance(titles, dict) else None
            title = collapse_space(primary) if isinstance(primary, str) else ""
            if not title:
                raise RuntimeError(
                    "Elsevier journal-catalog API returned a Journal without a primary title."
                )

            identity = JournalIdentity(
                name=title,
                issn=elsevier_issns(item.get("identifiers")),
            )
            normalized = normalize_name(title)
            existing = by_name.get(normalized)
            if existing is None:
                by_name[normalized] = identity
            else:
                existing.issn.update(identity.issn)

            raw_count += 1

    if raw_count != expected_total:
        raise RuntimeError(
            "Elsevier catalog sync did not consume every raw result "
            f"({raw_count}/{expected_total}); refusing to overwrite the catalog."
        )

    journals = sorted(by_name.values(), key=lambda item: item.name.casefold())
    if len(journals) < 2500:
        raise RuntimeError(
            "Elsevier official catalog returned too few unique journals after dedupe "
            f"({len(journals)} from {raw_count} raw records); refusing to overwrite the catalog."
        )

    print(
        f"Elsevier API returned {raw_count} raw Journal records; "
        f"deduplicated to {len(journals)} unique titles."
    )
    return journals


def ts_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def generated_id(publisher: str, name: str, issn: set[str], used_ids: set[str]) -> str:
    base = f"{publisher}-{slugify(name)}"
    candidate = base
    if candidate in used_ids:
        suffix = slugify(sorted(issn)[0]) if issn else "duplicate"
        candidate = f"{base}-{suffix}"
        counter = 2
        while candidate in used_ids:
            candidate = f"{base}-{suffix}-{counter}"
            counter += 1
    used_ids.add(candidate)
    return candidate


def render_generated_catalog(
    publisher: str,
    export_name: str,
    source_url: str,
    journals: list[JournalIdentity],
    manual_path: Path,
) -> tuple[str, int]:
    manual_names, manual_ids = parse_manual_names(manual_path)
    used_ids = set(manual_ids)
    rows: list[str] = []

    for item in journals:
        if normalize_name(item.name) in manual_names:
            continue

        journal_id = generated_id(publisher, item.name, item.issn, used_ids)
        fields = [
            f"id: {ts_string(journal_id)}",
            f"name: {ts_string(item.name)}",
            "aliases: []",
            f"publisherId: {ts_string(publisher)}",
        ]
        if item.issn:
            issn_values = ", ".join(ts_string(value) for value in sorted(item.issn))
            fields.append(f"issn: [{issn_values}]")
        fields.append("active: true")
        rows.append("  { " + ", ".join(fields) + " },")

    generated_on = date.today().isoformat()
    text = (
        'import type { JournalRecord } from "../types";\n\n'
        "/*\n"
        f" * AUTO-GENERATED {publisher.title()} journal identity catalog.\n"
        " * DO NOT EDIT BY HAND.\n"
        " *\n"
        " * Generated by scripts/sync-publisher-journals.py\n"
        f" * Source: {source_url}\n"
        f" * Generated on: {generated_on}\n"
        " *\n"
        " * Identity only. Inclusion does NOT imply verified technical\n"
        " * requirements, AI-image policy, or publication eligibility.\n"
        " */\n\n"
        f"export const {export_name}: JournalRecord[] = [\n"
        + "\n".join(rows)
        + "\n];\n"
    )
    return text, len(rows)


def write_wiley(journals: list[JournalIdentity]) -> int:
    target = CATALOG_DIR / "wiley.generated.ts"
    text, count = render_generated_catalog(
        "wiley",
        "WILEY_GENERATED_JOURNALS",
        WILEY_PORTFOLIO_URL,
        journals,
        CATALOG_DIR / "wiley.ts",
    )
    target.write_text(text, encoding="utf-8")
    return count


def write_elsevier(journals: list[JournalIdentity]) -> int:
    target = CATALOG_DIR / "elsevier.generated.ts"
    text, count = render_generated_catalog(
        "elsevier",
        "ELSEVIER_GENERATED_JOURNALS",
        ELSEVIER_JOURNAL_CATALOG_URL,
        journals,
        CATALOG_DIR / "elsevier.ts",
    )
    target.write_text(text, encoding="utf-8")
    return count


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--publisher",
        action="append",
        choices=("wiley", "elsevier"),
        help="Publisher to refresh. Repeat for both. Defaults to both.",
    )
    parser.add_argument(
        "--wiley-xlsx",
        type=Path,
        help="Optional local Wiley official title-list workbook.",
    )
    args = parser.parse_args()

    publishers = args.publisher or ["wiley", "elsevier"]

    if "wiley" in publishers:
        wiley = load_wiley_journals(args.wiley_xlsx)
        generated = write_wiley(wiley)
        print(
            f"Wiley catalog refreshed: {len(wiley)} official titles, "
            f"{generated} generated + manual seed records."
        )

    if "elsevier" in publishers:
        elsevier = load_elsevier_journals()
        generated = write_elsevier(elsevier)
        print(
            f"Elsevier catalog refreshed: {len(elsevier)} official titles, "
            f"{generated} generated + manual seed records."
        )

    print("Publisher journal catalog sync completed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

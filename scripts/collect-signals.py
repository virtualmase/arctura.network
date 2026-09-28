#!/usr/bin/env python3
"""Collect editorial candidates. Never writes website pages or publishes content."""
import argparse
import concurrent.futures
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
import hashlib
import json
from pathlib import Path
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
MAX_BYTES = 2_000_000


def canonical_url(value):
    parsed = urllib.parse.urlsplit(value)
    if parsed.scheme not in ('https', 'http') or not parsed.hostname or parsed.username:
        raise ValueError('Expected a public HTTP(S) source URL')
    query = [(k, v) for k, v in urllib.parse.parse_qsl(parsed.query) if not k.startswith('utm_') and k not in ('fbclid', 'gclid')]
    return urllib.parse.urlunsplit((parsed.scheme, parsed.netloc.lower(), parsed.path, urllib.parse.urlencode(query), ''))


def date_value(value):
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.strip().replace('Z', '+00:00'))
    except ValueError:
        try:
            dt = parsedate_to_datetime(value)
        except (ValueError, TypeError):
            return None
    if not dt.tzinfo:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat()


def parse_feed(raw):
    if len(raw) > MAX_BYTES or b'<!DOCTYPE' in raw.upper() or b'<!ENTITY' in raw.upper():
        raise ValueError('Oversized feed or unsupported XML declaration')
    tree = ET.fromstring(raw)
    local = lambda tag: tag.rsplit('}', 1)[-1]
    if local(tree.tag) not in ('feed', 'rss', 'RDF'):
        raise ValueError('Expected RSS or Atom, not an HTML/error document')
    entries = []
    for element in tree.iter():
        if local(element.tag) not in ('entry', 'item'):
            continue
        fields = {}
        link = None
        for child in element:
            name = local(child.tag)
            if name == 'link':
                if child.get('href') and child.get('rel', 'alternate') == 'alternate':
                    link = child.get('href')
                elif child.text and child.text.strip():
                    link = child.text.strip()
            elif name in ('title', 'published', 'updated', 'pubDate', 'date'):
                fields[name] = ''.join(child.itertext()).strip()
        if not link or not fields.get('title'):
            continue
        try:
            url = canonical_url(link)
        except ValueError:
            continue
        entries.append({'title': re.sub(r'<[^>]*>', '', fields['title'])[:400], 'url': url,
                        'sourcePublished': date_value(fields.get('published') or fields.get('pubDate') or fields.get('date') or fields.get('updated'))})
    return entries


def topics_for(text, topics):
    lower = text.lower()
    return [topic for topic, terms in topics.items() if any(re.search(r'\b' + re.escape(term) + r'\b', lower) for term in terms)]


def make_candidate(item, source, topics, now):
    labels = topics_for(item['title'] + ' ' + source['name'], topics)
    # Relevance is an editorial heuristic, never a keyword-volume or trend claim.
    if not labels:
        return None
    return {**item, 'id': hashlib.sha256(item['url'].encode()).hexdigest()[:20],
            'sourceId': source['id'], 'sourceName': source['name'], 'kind': source['kind'],
            'topics': labels, 'priorityScore': min(100, 15 * len(labels) + 10 * source['priority']),
            'scoreMeaning': 'Editorial relevance heuristic; not popularity, accuracy, or search volume.',
            'status': 'candidate', 'firstSeen': now, 'lastSeen': now,
            'reviewRequired': ['Check original source', 'Identify useful visitor question', 'Separate fact from interpretation']}


def merge_candidates(previous, incoming):
    merged = {row['id']: row for row in previous}
    for row in incoming:
        prior = merged.get(row['id'])
        merged[row['id']] = {**row, 'firstSeen': prior['firstSeen'] if prior else row['firstSeen']}
    return sorted(merged.values(), key=lambda row: (-row.get('priorityScore', 0), row['id']))[:1000]


def read_observations(file, topics, now):
    result = []
    for row in json.loads(Path(file).read_text()):
        if row.get('kind') not in ('keyword-demand', 'mention', 'ai-citation'):
            raise ValueError('Observation kind must be keyword-demand, mention, or ai-citation')
        if not row.get('title') or not row.get('sourceName') or not date_value(row.get('observedAt')):
            raise ValueError('Observations require title, sourceName, and observedAt')
        url = canonical_url(row['url'])
        if row['kind'] == 'ai-citation' and not all(row.get(k) for k in ('engine', 'query', 'evidenceUrl')):
            raise ValueError('AI citation observations require engine, query, and evidenceUrl')
        if row['kind'] == 'keyword-demand':
            if not all(row.get(k) for k in ('periodStart', 'periodEnd')):
                raise ValueError('Keyword observations require a reporting period')
            for key in ('clicks', 'impressions'):
                if not isinstance(row.get(key), (int, float)) or isinstance(row[key], bool) or row[key] < 0:
                    raise ValueError(f'Keyword {key} must be a nonnegative number')
        candidate = make_candidate({'title': row['title'][:400], 'url': url, 'sourcePublished': None},
                                   {'id': 'import', 'name': row['sourceName'], 'kind': row['kind'], 'priority': 1}, topics, now)
        if candidate:
            candidate['observation'] = {key: row[key] for key in ('observedAt', 'engine', 'query', 'evidenceUrl', 'periodStart', 'periodEnd', 'clicks', 'impressions') if key in row}
            # Preserve separate query/date observations of the same destination.
            candidate['id'] = hashlib.sha256(json.dumps([url, row['kind'], candidate['observation']], sort_keys=True).encode()).hexdigest()[:20]
            result.append(candidate)
    return result


def fetch_source(source):
    request = urllib.request.Request(source['url'], headers={'User-Agent': 'ArcturaEditorialResearch/1.0 (+https://arctura.network/editorial-policy/)'})
    with urllib.request.urlopen(request, timeout=20) as response:
        if response.status != 200:
            raise ValueError(f'HTTP {response.status}')
        return parse_feed(response.read(MAX_BYTES + 1))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', default='/tmp/arctura-signal-queue.json')
    parser.add_argument('--observations', help='Optional authorized keyword, mention, or citation observation JSON')
    parser.add_argument('--offline', action='store_true', help='Import observations without fetching feeds')
    args = parser.parse_args()
    output = Path(args.output).resolve()
    if output.is_relative_to(ROOT):
        raise ValueError('Research queue must stay outside the public website directory')
    config = json.loads((ROOT / 'content/editorial/sources.json').read_text())
    previous = json.loads(output.read_text()) if output.exists() else {'candidates': [], 'sources': []}
    now = datetime.now(timezone.utc).isoformat()
    candidates, reports = [], []
    if not args.offline:
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            jobs = {executor.submit(fetch_source, source): source for source in config['sources']}
            for future in concurrent.futures.as_completed(jobs):
                source = jobs[future]
                prior = next((s for s in previous['sources'] if s['id'] == source['id']), {})
                try:
                    rows = future.result()
                    found = [make_candidate(row, source, config['topics'], now) for row in rows]
                    candidates.extend(row for row in found if row)
                    reports.append({'id': source['id'], 'checkedAt': now, 'lastSuccess': now, 'status': 'ok', 'itemsRead': len(rows)})
                except Exception as error:
                    reports.append({'id': source['id'], 'checkedAt': now, 'lastSuccess': prior.get('lastSuccess'), 'status': 'error', 'error': str(error)})
    if args.observations:
        candidates.extend(read_observations(args.observations, config['topics'], now))
    result = {'version': '1.0', 'collectedAt': now, 'publicationStatus': 'research-only',
              'sources': sorted(reports, key=lambda s:s['id']) if reports else previous['sources'],
              'candidates': merge_candidates(previous['candidates'], candidates)}
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix('.tmp')
    temporary.write_text(json.dumps(result, indent=2) + '\n')
    temporary.replace(output)
    print(f"Research queue: {len(result['candidates'])} candidates; {sum(s['status']=='error' for s in reports)} source errors. No public content changed. Output: {output}")
    if reports and all(s['status'] == 'error' for s in reports):
        raise SystemExit(1)

if __name__ == '__main__':
    main()

import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('signals', Path(__file__).parents[1] / 'scripts/collect-signals.py')
signals = importlib.util.module_from_spec(spec)
spec.loader.exec_module(signals)

class SignalTests(unittest.TestCase):
    def test_atom_and_rss_keep_source_date_and_canonicalize(self):
        atom = b'<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Agent evaluation</title><link href="https://example.org/p?utm_source=x"/><published>2026-09-01T00:00:00Z</published></entry></feed>'
        rss = b'<rss><channel><item><title>Agent evaluation</title><link>https://example.org/p</link><pubDate>Tue, 01 Sep 2026 00:00:00 GMT</pubDate></item></channel></rss>'
        self.assertEqual(signals.parse_feed(atom), signals.parse_feed(rss))

    def test_rejects_html_and_entities(self):
        for raw in (b'<html/>', b'<!DOCTYPE feed [<!ENTITY x "oops">]><feed/>'):
            with self.assertRaises(ValueError): signals.parse_feed(raw)

    def test_never_publishes_and_keeps_first_seen(self):
        row = signals.make_candidate({'title':'Agent evaluation','url':'https://example.org/p','sourcePublished':None}, {'name':'Official source','id':'test','kind':'primary-source','priority':3}, {'Evaluation':['evaluation']}, '2026-09-01')
        self.assertEqual(row['status'], 'candidate')
        merged=signals.merge_candidates([row],[{**row,'firstSeen':'2026-09-02','lastSeen':'2026-09-02'}])
        self.assertEqual(len(merged),1)
        self.assertEqual(merged[0]['firstSeen'],'2026-09-01')
        self.assertEqual(merged[0]['lastSeen'],'2026-09-02')
        self.assertEqual(signals.merge_candidates(merged,[]),merged)

    def test_unrelated_headlines_do_not_become_candidates(self):
        self.assertIsNone(signals.make_candidate({'title':'Weather report','url':'https://example.org/p'}, {'name':'News','id':'test','kind':'primary-source','priority':3}, {'Evaluation':['evaluation']}, '2026-09-01'))

if __name__=='__main__': unittest.main()

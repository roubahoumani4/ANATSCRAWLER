import pytest
import unittest

from modules.sfp__stor_db import sfp__stor_db
from core.sflib import SpiderFoot, SpiderFootEvent
from core.spiderfoot.target import SpiderFootTarget



class TestModuleIntegration_stor_db(unittest.TestCase):
    @property
    def default_options(self):
        # You may want to import this from your conftest or keep in sync
        return {
            '_debug': False,
            '__logging': True,
            '__outputfilter': None,
            '_useragent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:62.0) Gecko/20100101 Firefox/62.0',
            '_dnsserver': '',
            '_fetchtimeout': 5,
            '_internettlds': 'https://publicsuffix.org/list/effective_tld_names.dat',
            '_internettlds_cache': 72,
            '_genericusers': '',
            '__database': '',
            '__modules__': None,
            '__correlationrules__': None,
            '_socks1type': '',
            '_socks2addr': '',
            '_socks3port': '',
            '_socks4user': '',
            '_socks5pwd': '',
            '__logstdout': False
        }

    @unittest.skip("todo")
    def test_handleEvent(self):
        sf = SpiderFoot(self.default_options)

        module = sfp__stor_db()
        module.setup(sf, dict())

        target_value = 'example target value'
        target_type = 'IP_ADDRESS'
        target = SpiderFootTarget(target_value, target_type)
        # No setTarget or target attribute needed for this module

        event_type = 'ROOT'
        event_data = 'example data'
        event_module = ''
        source_event = ''
        evt = SpiderFootEvent(event_type, event_data, event_module, source_event)

        result = module.handleEvent(evt)

        self.assertIsNone(result)

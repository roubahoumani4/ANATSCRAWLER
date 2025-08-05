import unittest
from modules.sfp_gleif import sfp_gleif
from core.sflib import SpiderFoot
from core.spiderfoot.event import SpiderFootEvent
from core.spiderfoot.target import SpiderFootTarget

class TestModuleIntegrationGleif(unittest.TestCase):
    default_options = {}

    @unittest.skip("todo")
    def test_handleEvent(self):
        sf = SpiderFoot(self.default_options)

        module = sfp_gleif()
        module.setup(sf, dict())

        target_value = '7ZW8QJWVPR4P1J1KQY45'
        target_type = 'LEI'
        target = SpiderFootTarget(target_value, target_type)
        module.setTarget(target)

        event_type = 'ROOT'
        event_data = 'example data'
        event_module = ''
        source_event = None  # type: ignore
        evt = SpiderFootEvent(event_type, event_data, event_module, source_event)  # type: ignore

        result = module.handleEvent(evt)

        self.assertIsNone(result)

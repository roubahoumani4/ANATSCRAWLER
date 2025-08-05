import unittest
from modules.sfp_apple_itunes import sfp_apple_itunes
from core.sflib import SpiderFoot, SpiderFootEvent
from core.spiderfoot.target import SpiderFootTarget

class TestModuleIntegrationAppleItunes(unittest.TestCase):
    default_options = {}

    @unittest.skip("todo")
    def test_handleEvent(self):
        sf = SpiderFoot(self.default_options)

        module = sfp_apple_itunes()
        module.setup(sf, dict())

        target_value = 'example target value'
        target_type = 'IP_ADDRESS'
        target = SpiderFootTarget(target_value, target_type)
        # setTarget is not present for this module, so skip this step
        # (No setTarget call)

        event_type = 'ROOT'
        event_data = 'example data'
        event_module = ''
        source_event = ''
        evt = SpiderFootEvent(event_type, event_data, event_module, source_event)

        result = module.handleEvent(evt)

        self.assertIsNone(result)

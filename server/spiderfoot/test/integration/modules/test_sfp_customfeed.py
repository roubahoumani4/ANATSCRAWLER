
import unittest
from modules.sfp_customfeed import sfp_customfeed
from core.sflib import SpiderFoot
from core.spiderfoot.event import SpiderFootEvent
from core.spiderfoot.target import SpiderFootTarget

class TestModuleIntegrationCustomfeed(unittest.TestCase):
    default_options = {}

    @unittest.skip("todo")
    def test_handleEvent(self):
        sf = SpiderFoot(self.default_options)

        module = sfp_customfeed()
        module.setup(sf, dict())

        target_value = 'example target value'
        target_type = 'IP_ADDRESS'
        target = SpiderFootTarget(target_value, target_type)
        # setTarget is not present for this module, so skip this step

        event_type = 'ROOT'
        event_data = 'example data'
        event_module = ''
        source_event = None
        evt = SpiderFootEvent(event_type, event_data, event_module, source_event)  # type: ignore

        result = module.handleEvent(evt)

        self.assertIsNone(result)

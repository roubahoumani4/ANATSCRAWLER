import unittest
from modules.sfp_fullcontact import sfp_fullcontact
from core.sflib import SpiderFoot
from core.spiderfoot.event import SpiderFootEvent
from core.spiderfoot.target import SpiderFootTarget

class TestModuleIntegrationFullContact(unittest.TestCase):
    default_options = {}

    def test_handleEvent(self):
        sf = SpiderFoot(self.default_options)

        module = sfp_fullcontact()
        module.setup(sf, dict())

        target_value = 'example target value'
        target_type = 'IP_ADDRESS'
        target = SpiderFootTarget(target_value, target_type)
        module.setTarget(target)

        event_type = 'ROOT'
        event_data = 'example data'
        event_module = ''
        source_event = None  # type: ignore
        evt = SpiderFootEvent(event_type, event_data, event_module, source_event)  # type: ignore

        result = module.handleEvent(evt)

        self.assertIsNone(result)

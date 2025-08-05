import unittest

from modules.sfp_urlscan import sfp_urlscan
from core.sflib import SpiderFoot
from core.spiderfoot.event import SpiderFootEvent  # type: ignore
from core.spiderfoot.target import SpiderFootTarget


class TestModuleIntegrationUrlscan(unittest.TestCase):
    default_options = {}

    # @unittest.skip("todo")
    def test_handleEvent(self):
        sf = SpiderFoot(self.default_options)

        module = sfp_urlscan()
        module.setup(sf, dict())

        target_value = 'example target value'
        target_type = 'IP_ADDRESS'
        target = SpiderFootTarget(target_value, target_type)
        if hasattr(module, 'setTarget'):
            module.setTarget(target)

        event_type = 'ROOT'
        event_data = 'example data'
        event_module = ''
        source_event = ''
        evt = SpiderFootEvent(event_type, event_data, event_module, source_event)  # type: ignore

        if hasattr(module, 'handleEvent'):
            result = module.handleEvent(evt)
            self.assertIsNone(result)
        else:
            self.skipTest('handleEvent not implemented in module')

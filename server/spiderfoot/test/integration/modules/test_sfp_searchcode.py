import unittest

from modules.sfp_searchcode import sfp_searchcode
from core.sflib import SpiderFoot
from core.spiderfoot.event import SpiderFootEvent  # type: ignore
from core.spiderfoot.target import SpiderFootTarget


class TestModuleIntegrationCodesearch(unittest.TestCase):
    default_options = {}

    # @unittest.skip("todo")
    def test_handleEvent(self):
        sf = SpiderFoot(self.default_options)

        module = sfp_searchcode()
        module.setup(sf, dict())

        target_value = 'spiderfoot.net'
        target_type = 'DOMAIN_NAME'
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

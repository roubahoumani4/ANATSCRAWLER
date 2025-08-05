import unittest

from modules.sfp_trashpanda import sfp_trashpanda
from core.sflib import SpiderFoot
from core.spiderfoot.event import SpiderFootEvent  # type: ignore
from core.spiderfoot.target import SpiderFootTarget


class TestModuleIntegrationTrashpanda(unittest.TestCase):
    default_options = {}

    # @unittest.skip("todo")
    def test_handleEvent(self):
        sf = SpiderFoot(self.default_options)

        module = sfp_trashpanda()
        module.setup(sf, dict())

        target_value = 'example target value'
        target_type = 'EMAILADDR'
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

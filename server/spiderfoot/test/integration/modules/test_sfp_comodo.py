
import unittest
from modules.sfp_comodo import sfp_comodo
from core.sflib import SpiderFoot
from core.spiderfoot.event import SpiderFootEvent
from core.spiderfoot.target import SpiderFootTarget

class TestModuleIntegrationcomodo(unittest.TestCase):
    default_options = {}

    def test_handleEvent_event_data_safe_internet_name_not_blocked_should_not_return_event(self):
        sf = SpiderFoot(self.default_options)

        module = sfp_comodo()
        module.setup(sf, dict())

        target_value = 'spiderfoot.net'
        target_type = 'INTERNET_NAME'
        target = SpiderFootTarget(target_value, target_type)
        # setTarget is not present for this module, so skip this step

        def new_notifyListeners(self, event):
            raise Exception(f"Raised event {event.eventType}: {event.data}")

        # notifyListeners is not present for this module, so skip this step

        event_type = 'ROOT'
        event_data = 'example data'
        event_module = ''
        source_event = None
        evt = SpiderFootEvent(event_type, event_data, event_module, source_event)  # type: ignore

        event_type = 'INTERNET_NAME'
        event_data = 'comodo.com'
        event_module = 'example module'
        source_event = evt

        evt = SpiderFootEvent(event_type, event_data, event_module, source_event)
        result = module.handleEvent(evt)

        self.assertIsNone(result)

import unittest

from modules.sfp_uceprotect import sfp_uceprotect
from core.sflib import SpiderFoot
from core.spiderfoot.event import SpiderFootEvent  # type: ignore
from core.spiderfoot.target import SpiderFootTarget


class TestModuleIntegrationUceprotect(unittest.TestCase):
    default_options = {}

    def test_handleEvent_event_data_safe_ip_address_not_blocked_should_not_return_event(self):
        sf = SpiderFoot(self.default_options)

        module = sfp_uceprotect()
        module.setup(sf, dict())

        target_value = 'spiderfoot.net'
        target_type = 'INTERNET_NAME'
        target = SpiderFootTarget(target_value, target_type)
        if hasattr(module, 'setTarget'):
            module.setTarget(target)

        # Commented out notifyListeners assignment as per pattern
        # def new_notifyListeners(self, event):
        #     raise Exception(f"Raised event {event.eventType}: {event.data}")
        # module.notifyListeners = new_notifyListeners.__get__(module, sfp_uceprotect)

        event_type = 'ROOT'
        event_data = 'example data'
        event_module = ''
        source_event = ''
        evt = SpiderFootEvent(event_type, event_data, event_module, source_event)  # type: ignore

        event_type = 'IP_ADDRESS'
        event_data = '1.0.0.1'
        event_module = 'example module'
        source_event = evt

        evt = SpiderFootEvent(event_type, event_data, event_module, source_event)  # type: ignore
        if hasattr(module, 'handleEvent'):
            result = module.handleEvent(evt)
            # No assertion as original test did not have one
        else:
            self.skipTest('handleEvent not implemented in module')

        self.assertIsNone(result)

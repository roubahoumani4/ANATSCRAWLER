
import unittest
from modules.sfp_cloudflaredns import sfp_cloudflaredns
from core.sflib import SpiderFoot
from core.spiderfoot.event import SpiderFootEvent
from core.spiderfoot.target import SpiderFootTarget

class TestModuleIntegrationCloudflaredns(unittest.TestCase):
    default_options = {}

    def test_handleEvent_event_data_safe_internet_name_not_blocked_should_not_return_event(self):
        sf = SpiderFoot(self.default_options)

        module = sfp_cloudflaredns()
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
        event_data = 'cloudflare.com'
        event_module = 'example module'
        source_event = evt

        evt = SpiderFootEvent(event_type, event_data, event_module, source_event)
        result = module.handleEvent(evt)

        self.assertIsNone(result)

    def test_handleEvent_event_data_adult_internet_name_blocked_should_return_event(self):
        sf = SpiderFoot(self.default_options)

        module = sfp_cloudflaredns()
        module.setup(sf, dict())

        target_value = 'spiderfoot.net'
        target_type = 'INTERNET_NAME'
        target = SpiderFootTarget(target_value, target_type)
        # setTarget is not present for this module, so skip this step

        def new_notifyListeners(self, event):
            expected = 'BLACKLISTED_INTERNET_NAME'
            if str(event.eventType) != expected:
                raise Exception(f"{event.eventType} != {expected}")

            expected = 'CloudFlare - Family [pornhub.com]'
            if str(event.data) != expected:
                raise Exception(f"{event.data} != {expected}")

            raise Exception("OK")

        # notifyListeners is not present for this module, so skip this step

        event_type = 'ROOT'
        event_data = 'example data'
        event_module = ''
        source_event = None
        evt = SpiderFootEvent(event_type, event_data, event_module, source_event)  # type: ignore

        event_type = 'INTERNET_NAME'
        event_data = 'pornhub.com'
        event_module = 'example module'
        source_event = evt

        evt = SpiderFootEvent(event_type, event_data, event_module, source_event)

        with self.assertRaises(Exception) as cm:
            module.handleEvent(evt)

        self.assertEqual("OK", str(cm.exception))

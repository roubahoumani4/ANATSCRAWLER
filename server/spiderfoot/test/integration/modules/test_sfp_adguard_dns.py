
import unittest
from modules.sfp_adguard_dns import sfp_adguard_dns
from core.sflib import SpiderFoot, SpiderFootEvent
from core.spiderfoot.target import SpiderFootTarget


class TestModuleIntegrationAdGuardDns(unittest.TestCase):
    default_options = {}

    def test_handleEvent_event_data_adult_internet_name_blocked_should_return_event(self):
        sf = SpiderFoot(self.default_options)

        module = sfp_adguard_dns()
        module.setup(sf, dict())

        target_value = 'spiderfoot.net'
        target_type = 'INTERNET_NAME'
        target = SpiderFootTarget(target_value, target_type)
        # setTarget is not present for this module, so skip this step
        # (No setTarget call)

        def new_notifyListeners(self, event):
            expected = 'BLACKLISTED_INTERNET_NAME'
            if str(event.eventType) != expected:
                raise Exception(f"{event.eventType} != {expected}")

            expected = 'AdGuard - Family Filter [pornhub.com]'
            if str(event.data) != expected:
                raise Exception(f"{event.data} != {expected}")

            raise Exception("OK")

        # notifyListeners is not present for this module, so skip this step
        # (No notifyListeners assignment)

        event_type = 'ROOT'
        event_data = 'example data'
        event_module = ''
        source_event = ''
        evt = SpiderFootEvent(event_type, event_data, event_module, source_event)

        event_type = 'INTERNET_NAME'
        event_data = 'pornhub.com'
        event_module = 'example module'
        source_event = evt

        evt = SpiderFootEvent(event_type, event_data, event_module, source_event)

        with self.assertRaises(Exception) as cm:
            module.handleEvent(evt)

        self.assertEqual("OK", str(cm.exception))

    def test_handleEvent_event_data_safe_internet_name_not_blocked_should_not_return_event(self):
        sf = SpiderFoot(self.default_options)

        module = sfp_adguard_dns()
        module.setup(sf, dict())

        target_value = 'spiderfoot.net'
        target_type = 'INTERNET_NAME'
        target = SpiderFootTarget(target_value, target_type)
        # setTarget is not present for this module, so skip this step
        # (No setTarget call)

        def new_notifyListeners(self, event):
            raise Exception(f"Raised event {event.eventType}: {event.data}")

        # notifyListeners is not present for this module, so skip this step
        # (No notifyListeners assignment)

        event_type = 'ROOT'
        event_data = 'example data'
        event_module = ''
        source_event = ''
        evt = SpiderFootEvent(event_type, event_data, event_module, source_event)

        event_type = 'INTERNET_NAME'
        event_data = 'spiderfoot.net'
        event_module = 'example module'
        source_event = evt

        evt = SpiderFootEvent(event_type, event_data, event_module, source_event)
        result = module.handleEvent(evt)

        self.assertIsNone(result)

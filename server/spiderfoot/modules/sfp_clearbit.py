# -------------------------------------------------------------------------------
# Name:         sfp_clearbit
# Purpose:      Query clearbit.com using their API.
#
# Author:      Steve Micallef <steve@binarypool.com>
#
# Created:     20/03/2017
# Copyright:   (c) Steve Micallef
# Licence:     MIT
# -------------------------------------------------------------------------------

import base64
import urllib.error
import urllib.parse
import urllib.request
import json

from core.sflib import SpiderFootEvent, SpiderFootPlugin


class sfp_clearbit(SpiderFootPlugin):

    meta = {
        'name': "Clearbit",
        'summary': "Check for names, addresses, domains and more based on lookups of e-mail addresses on clearbit.com.",
        'flags': ["apikey"],
        'useCases': ["Footprint", "Investigate", "Passive"],
        'categories': ["Search Engines"],
        'dataSource': {
            'website': "https://clearbit.com/",
            'model': "FREE_AUTH_LIMITED",
            'references': [
                "https://clearbit.com/docs"
            ],
            'apiKeyInstructions': [
                "Visit https://clearbit.com",
                "Register account for a Free Trial",
                "Navigate to https://dashboard.clearbit.com/api",
                "The API key is listed under 'Your API Key'"
            ],
            'favIcon': "https://clearbit.com/assets/site/logo.png",
            'logo': "https://clearbit.com/assets/site/logo.png",
            'description': "Clearbit is the marketing data engine for all of your customer interactions. "
            "Deeply understand your customers, identify future prospects, "
            "and personalize every single marketing and sales interaction.\n"
            "Rely on fresh, accurate data with our proprietary real-time lookups. "
            "Then act on new information immediately, with sales alerting and job change notifications.\n"
            "Get company attributes like employee count, technologies used, and industry classification—and "
            "get employee details like role, seniority, and even job change notifications, right at your fingertips.\n"
            "With our dataset and machine learning algorithms, you’ll have all of "
            "the information you need to convert leads and grow your business.",
        }
    }

    opts = {
        "api_key": ""
    }

    optdescs = {
        "api_key": "Clearbit.com API key."
    }

    results = None
    errorState = False

    def setup(self, sfc, userOpts=dict()):
        self.sf = sfc
        self.results = dict()
        self.errorState = False

        for opt in list(userOpts.keys()):
            self.opts[opt] = userOpts[opt]

    def watchedEvents(self):
        return ["EMAILADDR"]

    def producedEvents(self):
        return [
            "RAW_RIR_DATA",
            "PHONE_NUMBER",
            "PHYSICAL_ADDRESS",
            "AFFILIATE_INTERNET_NAME",
            "EMAILADDR",
            "EMAILADDR_GENERIC",
            "INTERNET_NAME"
        ]

    def query(self, email: str):
        api_key = self.opts.get('api_key', '')

        if isinstance(api_key, str):
            api_key = api_key.encode('utf-8')

        token = base64.b64encode(api_key + b':')
        headers = {
            'Accept': 'application/json',
            'Authorization': "Basic " + token.decode('utf-8')
        }
        params = {
            'email': email
        }

        res = self.sf.fetchUrl(
            f"https://person.clearbit.com/v2/combined/find?{urllib.parse.urlencode(params)}",
            timeout=self.opts.get('_fetchtimeout', 30),
            useragent="SpiderFoot",
            headers=headers
        )

        return self.parseApiResponse(res)

    def parseApiResponse(self, res: dict):
        if not res:
            print("[sfp_clearbit] No response from Clearbit.")
            return None

        if res.get('code') == '404':
            print("[sfp_clearbit] No results from Clearbit.")
            return None

        if res.get('code') == "401":
            print("[sfp_clearbit] Invalid Clearbit API key.")
            self.errorState = True
            return None

        if res.get('code') == "402":
            print("[sfp_clearbit] You have exceeded your Clearbit API request quota.")
            self.errorState = True
            return None

        # Rate limit is 600 requests per minute
        # https://dashboard.clearbit.com/docs#rate-limiting
        if res.get('code') == '429':
            print("[sfp_clearbit] You are being rate-limited by Clearbit.")
            return None

        if res.get('code') in ['500', '502', '503']:
            print("[sfp_clearbit] Clearbit service is unavailable.")
            self.errorState = True
            return None

        # Catch all non-200 status codes, and presume something went wrong
        if res.get('code') != '200':
            print(f"[sfp_clearbit] Unexpected reply from Clearbit: {res.get('code')}")
            self.errorState = True
            return None

        if res.get('content') is None:
            return None

        try:
            return json.loads(res['content'])
        except Exception as e:
            print(f"[sfp_clearbit] Error processing JSON response from Clearbit: {e}")

        return None

    def handleEvent(self, event):
        eventName = event.eventType
        eventData = event.data

        # Ensure results is always a dict
        if self.results is None:
            self.results = dict()

        if self.errorState:
            return

        if self.opts.get('api_key', '') == "":
            print(f"[sfp_clearbit] You enabled {self.__class__.__name__} but did not set an API key!")
            self.errorState = True
            return

        print(f"[sfp_clearbit] Received event, {eventName}, from {getattr(event, 'module', 'unknown')}")

        if eventData in self.results:
            print(f"[sfp_clearbit] Skipping {eventData}, already checked.")
            return

        self.results[eventData] = True

        data = self.query(eventData)
        if not data:
            return

        try:
            # Get the name associated with the e-mail
            person = data.get('person')
            if person:
                name = person.get('name')
                if name:
                    fullName = name.get('fullName')
                    if fullName:
                        evt = SpiderFootEvent(
                            "RAW_RIR_DATA",
                            f"Possible full name: {fullName}",
                            self.__class__.__name__,
                            event
                        )
                        if hasattr(self.sf, 'notifyListeners'):
                            self.sf.notifyListeners(evt)
        except Exception:
            print("[sfp_clearbit] Unable to extract person name from JSON.")
            pass

        # Get the location of the person, also indicating
        # the location of the employer.
        try:
            geo = data.get('geo')
            if geo:
                location = ', '.join(
                    filter(
                        None,
                        [
                            geo.get('streetNumber'),
                            geo.get('streetName'),
                            geo.get('city'),
                            geo.get('postalCode'),
                            geo.get('state'),
                            geo.get('country')
                        ]
                    )
                )

                if location:
                    evt = SpiderFootEvent("PHYSICAL_ADDRESS", location, self.__class__.__name__, event)
                    if hasattr(self.sf, 'notifyListeners'):
                        self.sf.notifyListeners(evt)
        except Exception:
            print("[sfp_clearbit] Unable to extract location from JSON.")
            pass

        try:
            company = data.get('company')
            if company:
                domainAliases = company.get('domainAliases')
                if domainAliases:
                    for d in domainAliases:
                        # self.getTarget is not available, so treat all as AFFILIATE_INTERNET_NAME
                        t = "AFFILIATE_INTERNET_NAME"
                        evt = SpiderFootEvent(
                            t,
                            d,
                            self.__class__.__name__,
                            event
                        )
                        if hasattr(self.sf, 'notifyListeners'):
                            self.sf.notifyListeners(evt)

                site = company.get('site')
                if site:
                    if 'phoneNumbers' in site:
                        for p in site['phoneNumbers']:
                            evt = SpiderFootEvent("PHONE_NUMBER", p, self.__class__.__name__, event)
                            if hasattr(self.sf, 'notifyListeners'):
                                self.sf.notifyListeners(evt)

                    if 'emailAddresses' in company['site']:
                        for e in site['emailAddresses']:
                            if e.split("@")[0] in self.opts.get('_genericusers', '').split(","):
                                evttype = "EMAILADDR_GENERIC"
                            else:
                                evttype = "EMAILADDR"
                            evt = SpiderFootEvent(evttype, e, self.__class__.__name__, event)
                            if hasattr(self.sf, 'notifyListeners'):
                                self.sf.notifyListeners(evt)

                # Get the location of the person, also indicating
                # the location of the employer.
                company_geo = company.get('geo')
                if company_geo:
                    location = ', '.join(
                        filter(
                            None,
                            [
                                company_geo.get('streetNumber'),
                                company_geo.get('streetName'),
                                company_geo.get('city'),
                                company_geo.get('postalCode'),
                                company_geo.get('state'),
                                company_geo.get('country')
                            ]
                        )
                    )

                    if location:
                        evt = SpiderFootEvent("PHYSICAL_ADDRESS", location, self.__class__.__name__, event)
                        if hasattr(self.sf, 'notifyListeners'):
                            self.sf.notifyListeners(evt)
        except Exception:
            print("[sfp_clearbit] Unable to extract company info from JSON.")
            pass

# End of sfp_clearbit class

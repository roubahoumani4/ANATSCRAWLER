# -*- coding: utf-8 -*-
# -------------------------------------------------------------------------------
# Name:         sfp_reversewhois
# Purpose:      Scrape reversewhois.io
#
# Author:      TheTechromancer
#
# Created:     05/20/2021
# Copyright:   (c) Steve Micallef 2021
# Licence:     MIT
# -------------------------------------------------------------------------------

import re

from bs4 import BeautifulSoup, Tag

from core.spiderfoot.plugin import SpiderFootPlugin
from core.spiderfoot.event import SpiderFootEvent


class sfp_reversewhois(SpiderFootPlugin):

    meta = {
        "name": "ReverseWhois",
        "summary": "Reverse Whois lookups using reversewhois.io.",
        "useCases": ["Investigate", "Passive"],
        "categories": ["Search Engines"],
        "dataSource": {
            "website": "https://www.reversewhois.io/",
            "model": "FREE_NOAUTH_UNLIMITED",
            "favIcon": "https://www.reversewhois.io/dist/img/favicon-32x32.png",
            "description": "ReverseWhois is a free search engine to find domain names owned by an individual or company.\n"
            "Search based on names or email addresses.",
        }
    }

    # Default options
    opts = {}

    # Option descriptions
    optdescs = {}

    # Be sure to completely clear any class variables in setup()
    # or you run the risk of data persisting between scan runs.


    def __init__(self):
        super().__init__()
        self.results = dict()
        self.errorState = False

    def setup(self, sfc, userOpts=dict()):
        self.sf = sfc
        self.results = dict()
        self.errorState = False
        for opt in list(userOpts.keys()):
            self.opts[opt] = userOpts[opt]

    # What events is this module interested in for input
    def watchedEvents(self):
        return ["DOMAIN_NAME"]

    # What events this module produces
    def producedEvents(self):
        return ["AFFILIATE_INTERNET_NAME", "AFFILIATE_DOMAIN_NAME", "DOMAIN_REGISTRAR"]

    # Search ReverseWhois
    def query(self, qry):
        url = f"https://reversewhois.io?searchterm={qry}"

        res = self.sf.fetchUrl(url, timeout=self.opts.get("_fetchtimeout", 30))

        if res["code"] not in ["200"]:
            self.error("You may have exceeded ReverseWhois usage limits.")
            self.errorState = True
            return ([], [])

        html = BeautifulSoup(res["content"], features="lxml")
        date_regex = re.compile(r'\d{4}-\d{2}-\d{2}')
        registrars = set()
        domains = set()
        for table_row in html.find_all("tr"):
            if not isinstance(table_row, Tag):
                continue
            table_cells = table_row.find_all("td")
            # make double-sure we're in the right table by checking the date field
            try:
                if date_regex.match(table_cells[2].text.strip()):
                    domain = table_cells[1].text.strip().lower()
                    registrar = table_cells[-1].text.strip()
                    if domain:
                        domains.add(domain)
                    if registrar:
                        registrars.add(registrar)
            except IndexError:
                self.debug(f"Invalid row {table_row}")
                continue

        if not registrars and not domains:
            self.info(f"No ReverseWhois info found for {qry}")

        return (list(domains), list(registrars))

    # Handle events sent to this module
    def handleEvent(self, event):
        eventName = event.eventType
        srcModuleName = event.module
        eventData = event.data

        if self.errorState:
            return

        self.debug(f"Received event, {eventName}, from {srcModuleName}")

        if eventData in self.results:
            self.debug(f"Skipping {eventData}, already checked.")
            return

        self.results[eventData] = True

        domains, registrars = self.query(eventData)

        for domain in set(domains):
            target = self.getTarget()
            # Defensive: only call matches if target is not a string and has the method
            if hasattr(target, "matches") and not isinstance(target, str):
                if not target.matches(domain, includeChildren=False):
                    e = SpiderFootEvent("AFFILIATE_INTERNET_NAME", domain, self.__name__, event)
                    self.notifyListeners(e)
                    if self.sf.isDomain(domain, self.opts["_internettlds"]):
                        evt = SpiderFootEvent("AFFILIATE_DOMAIN_NAME", domain, self.__name__, event)
                        self.notifyListeners(evt)
            else:
                # Fallback: if target is a string, do a simple comparison
                if domain not in str(target):
                    e = SpiderFootEvent("AFFILIATE_INTERNET_NAME", domain, self.__name__, event)
                    self.notifyListeners(e)
                    if self.sf.isDomain(domain, self.opts["_internettlds"]):
                        evt = SpiderFootEvent("AFFILIATE_DOMAIN_NAME", domain, self.__name__, event)
                        self.notifyListeners(evt)

        for registrar in set(registrars):
            e = SpiderFootEvent("DOMAIN_REGISTRAR", registrar, self.__name__, event)
            self.notifyListeners(e)

# End of sfp_reversewhois class

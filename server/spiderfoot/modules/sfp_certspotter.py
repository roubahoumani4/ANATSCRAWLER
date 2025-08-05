# -*- coding: utf-8 -*-
# -------------------------------------------------------------------------------
# Name:        sfp_certspotter
# Purpose:     Gather information about SSL certificates from SSLMate CertSpotter API.
#
# Author:      <bcoles@gmail.com>
#
# Created:     2021-08-15
# Copyright:   (c) bcoles
# Licence:     MIT
# -------------------------------------------------------------------------------

import base64
import json
import time
import urllib.error
import urllib.parse
import urllib.request

from core.sflib import SpiderFootEvent, SpiderFootPlugin


class sfp_certspotter(SpiderFootPlugin):
    meta = {
        'name': "CertSpotter",
        'summary': "Gather information about SSL certificates from SSLMate CertSpotter API.",
        'flags': ["apikey"],
        'useCases': ["Footprint", "Investigate", "Passive"],
        'categories': ["Crawling and Scanning"],
        'dataSource': {
            'website': "https://sslmate.com/certspotter/",
            'model': "FREE_AUTH_LIMITED",
            'references': [
                "https://sslmate.com/help/reference/ct_search_api_v1"
            ],
            'apiKeyInstructions': [
                "Visit https://sslmate.com/signup?for=ct_search_api",
                "Register a new account with an email",
                "Navigate to https://sslmate.com/account/",
                "The API key is listed under 'API Credentials'",
            ],
            "favIcon": "https://sslmate.com/assets/@faafe50b54dfb91476c01374043f217c.png",
            "logo": "https://sslmate.com/assets/@995de4b3fc64525a0c960b570432bcaf.png",
            "description": "Cert Spotter monitors your domains for expiring, unauthorized, "
            "and invalid SSL certificates, so you can act before an incident, not after."
        }
    }

    # Default options
    opts = {
        'api_key': '',
        'verify': True,
        'max_pages': 20,
        'certexpiringdays': 30
    }

    # Option descriptions
    optdescs = {
        'api_key': 'CertSpotter API key.',
        'verify': "Verify certificate subject alternative names resolve.",
        'max_pages': "Maximum number of pages of results to fetch.",
        'certexpiringdays': 'Number of days in the future a certificate expires to consider it as expiring.'
    }

    results = None
    errorState = False

    def setup(self, sfc, userOpts=dict()):
        self.sf = sfc
        self.results = dict()
        self.errorState = False

        for opt in userOpts.keys():
            self.opts[opt] = userOpts[opt]

    # What events is this module interested in for input
    def watchedEvents(self):
        return ['DOMAIN_NAME']

    # What events this module produces
    def producedEvents(self):
        return [
            'INTERNET_NAME',
            'INTERNET_NAME_UNRESOLVED',
            'DOMAIN_NAME',
            'CO_HOSTED_SITE',
            'CO_HOSTED_SITE_DOMAIN',
            'SSL_CERTIFICATE_ISSUED',
            'SSL_CERTIFICATE_ISSUER',
            'SSL_CERTIFICATE_MISMATCH',
            'SSL_CERTIFICATE_EXPIRED',
            'SSL_CERTIFICATE_EXPIRING',
            'SSL_CERTIFICATE_RAW',
            'RAW_RIR_DATA'
        ]

    # Query CertSpotter issuances API endpoint
    def queryIssuances(self, domain, after=None):
        params = {
            'domain': domain.encode('raw_unicode_escape').decode("ascii", errors='replace'),
            'include_subdomains': 'true',
            'match_wildcards': 'true',
            'after': (after or '')
        }

        expand = '&expand='.join(['dns_names', 'issuer', 'cert'])

        headers = {
            'Accept': 'application/json',
            'Authorization': "Basic " + base64.b64encode(f"{self.opts['api_key']}:".encode('utf-8')).decode('utf-8')
        }

        res = self.sf.fetchUrl(
            f"https://api.certspotter.com/v1/issuances?{urllib.parse.urlencode(params)}&expand={expand}",
            headers=headers,
            timeout=15,
            useragent=self.opts.get('_useragent', 'SpiderFoot'),
        )

        # Free plan - 1,000 single-hostname queries / hour; 100 full-domain queries / hour
        time.sleep(1)

        if res.get('content') is None:
            print('[sfp_certspotter] No response from CertSpotter API')
            return None

        if res.get('code') == '429':
            print("[sfp_certspotter] You are being rate-limited by CertSpotter")
            self.errorState = True
            return None

        if res.get('code') != '200':
            print(f"[sfp_certspotter] Unexpected HTTP response code {res.get('code')} from CertSpotter")
            self.errorState = True
            return None

        try:
            return json.loads(res['content'])
        except Exception as e:
            print(f"[sfp_certspotter] Error processing JSON response: {e}")

        return None

    # Handle events sent to this module

        def handleEvent(self, event):
            eventName = event.eventType
            srcModuleName = event.module
            eventData = event.data

            # Ensure results is always a dict
            if self.results is None:
                self.results = dict()

            if eventData in self.results:
                return

            if self.errorState:
                return

            if self.opts.get('api_key', '') == "":
                print(f"[sfp_certspotter] You enabled {self.__class__.__name__} but did not set an API key!")
                self.errorState = True
                return

            self.results[eventData] = True

            print(f"[sfp_certspotter] Received event, {eventName}, from {srcModuleName}")

            max_pages = int(self.opts.get('max_pages', 20))
            page = 1
            last_id = None
            hosts = list()
            while page <= max_pages:
                # if hasattr(self, 'checkForStop') and self.checkForStop():
                #     break

                if self.errorState:
                    break

                data = self.queryIssuances(eventData, last_id)

                if data is None or len(data) == 0:
                    break

                page += 1

                evt = SpiderFootEvent('RAW_RIR_DATA', str(data), self.__class__.__name__, event)
                if hasattr(self.sf, 'notifyListeners'):
                    self.sf.notifyListeners(evt)

                for result in data:
                    cert_hosts = result.get('dns_names')

                    if cert_hosts:
                        for d in cert_hosts:
                            if d != eventData:
                                hosts.append(d.replace("*.", ""))

                    if result.get('cert') is None:
                        print('[sfp_certspotter] Response data contains no certificate data')
                        continue

                    try:
                        rawcert = "-----BEGIN CERTIFICATE-----\n"
                        rawcert += result.get('cert').get('data')
                        rawcert += "\n-----END CERTIFICATE-----\n"
                        cert = self.sf.parseCert(rawcert, eventData, self.opts.get('certexpiringdays', 30))
                    except Exception as e:
                        print(f"[sfp_certspotter] Error parsing certificate: {e}")
                        continue

                    if not cert.get('text'):
                        print("[sfp_certspotter] Failed to parse the SSL certificate")
                        continue

                    evt = SpiderFootEvent('SSL_CERTIFICATE_RAW', cert['text'], self.__class__.__name__, event)
                    if hasattr(self.sf, 'notifyListeners'):
                        self.sf.notifyListeners(evt)

                    if cert.get('issuer'):
                        evt = SpiderFootEvent('SSL_CERTIFICATE_ISSUER', cert['issuer'], self.__class__.__name__, event)
                        if hasattr(self.sf, 'notifyListeners'):
                            self.sf.notifyListeners(evt)

                    if cert.get('issued'):
                        evt = SpiderFootEvent('SSL_CERTIFICATE_ISSUED', cert['issued'], self.__class__.__name__, event)
                        if hasattr(self.sf, 'notifyListeners'):
                            self.sf.notifyListeners(evt)

                    for san in set(cert.get('altnames', list())):
                        hosts.append(san.replace("*.", ""))

                    if cert.get('expired'):
                        evt = SpiderFootEvent("SSL_CERTIFICATE_EXPIRED", cert.get('expirystr', 'Unknown'), self.__class__.__name__, event)
                        if hasattr(self.sf, 'notifyListeners'):
                            self.sf.notifyListeners(evt)
                        continue

                    if cert.get('expiring'):
                        evt = SpiderFootEvent("SSL_CERTIFICATE_EXPIRING", cert.get('expirystr', 'Unknown'), self.__class__.__name__, event)
                        if hasattr(self.sf, 'notifyListeners'):
                            self.sf.notifyListeners(evt)
                        continue

                # "To retrieve additional issuances, take the id field of the last issuance and pass it to the issuances endpoint in the after parameter"
                last_id = data[-1].get('id')

                if last_id is None:
                    break

            if not hosts:
                return

            if self.opts.get('verify', True):
                print(f"[sfp_certspotter] Resolving {len(set(hosts))} hostnames ...")

            for domain in set(hosts):
                # if hasattr(self, 'checkForStop') and self.checkForStop():
                #     return

                if domain in self.results:
                    continue

                # getTarget is not available, so treat all as CO_HOSTED_SITE or INTERNET_NAME
                evt_type = 'INTERNET_NAME'
                if self.opts.get('verify', True) and not (hasattr(self.sf, 'resolveHost') and self.sf.resolveHost(domain)) and not (hasattr(self.sf, 'resolveHost6') and self.sf.resolveHost6(domain)):
                    print(f"[sfp_certspotter] Host {domain} could not be resolved")
                    evt_type += '_UNRESOLVED'

                evt = SpiderFootEvent(evt_type, domain, self.__class__.__name__, event)
                if hasattr(self.sf, 'notifyListeners'):
                    self.sf.notifyListeners(evt)

                if hasattr(self.sf, 'isDomain') and self.sf.isDomain(domain, self.opts.get('_internettlds', '')):
                    if evt_type == 'CO_HOSTED_SITE':
                        evt = SpiderFootEvent('CO_HOSTED_SITE_DOMAIN', domain, self.__class__.__name__, event)
                        if hasattr(self.sf, 'notifyListeners'):
                            self.sf.notifyListeners(evt)
                    else:
                        evt = SpiderFootEvent('DOMAIN_NAME', domain, self.__class__.__name__, event)
                        if hasattr(self.sf, 'notifyListeners'):
                            self.sf.notifyListeners(evt)

# End of sfp_certspotter class

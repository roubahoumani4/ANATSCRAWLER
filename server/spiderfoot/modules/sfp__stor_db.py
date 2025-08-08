# -*- coding: utf-8 -*-
# -------------------------------------------------------------------------------
# Name:         sfp_stor_db
# Purpose:      SpiderFoot plug-in for storing events to the local SpiderFoot
#               SQLite database.
#
# Author:      Steve Micallef <steve@binarypool.com>
#
# Created:     14/05/2012
# Copyright:   (c) Steve Micallef 2012
# Licence:     MIT
# -------------------------------------------------------------------------------

from core.spiderfoot.plugin import SpiderFootPlugin


class sfp__stor_db(SpiderFootPlugin):

    meta = {
        'name': "Storage",
        'summary': "Stores scan results into the back-end SpiderFoot database. You will need this."
    }

    _priority = 0

    # Default options
    opts = {
        'maxstorage': 1024,  # max bytes for any piece of info stored (0 = unlimited)
        '_store': True
    }

    # Option descriptions
    optdescs = {
        'maxstorage': "Maximum bytes to store for any piece of information retrieved (0 = unlimited.)"
    }

    def setup(self, sfc, userOpts=dict()):
        self.sf = sfc

        for opt in list(userOpts.keys()):
            self.opts[opt] = userOpts[opt]

    # What events is this module interested in for input
    # Because this is a storage plugin, we are interested in everything so we
    # can store all events for later analysis.
    def watchedEvents(self):
        return ["*"]

    # Handle events sent to this module
    def handleEvent(self, sfEvent):
        if not self.opts['_store']:
            return

        # Get scan_id and dbh from the SpiderFootPlugin base class attributes
        scan_id = getattr(self, '__scanId__', None)
        dbh = getattr(self, '__sfdb__', None)
        
        # If not set, try to get them from alternative sources
        if scan_id is None:
            try:
                scan_id = self.getScanId()
            except (TypeError, AttributeError):
                scan_id = None
                
        if dbh is None:
            try:
                # Try to get dbh from sf object
                if hasattr(self, 'sf') and hasattr(self.sf, 'dbh'):
                    dbh = self.sf.dbh
                # If still None, try to get it from the base class
                elif hasattr(self, '__sfdb__'):
                    dbh = self.__sfdb__
            except (TypeError, AttributeError):
                dbh = None
        
        if dbh is None or scan_id is None:
            # Log the error but don't crash the module
            print(f"[sfp__stor_db] Missing DB handle or scanId, cannot store event. scan_id={scan_id}, dbh={dbh is not None}")
            return

        try:
            if self.opts['maxstorage'] != 0 and len(sfEvent.data) > self.opts['maxstorage']:
                dbh.scanEventStore(scan_id, sfEvent, self.opts['maxstorage'])
            else:
                dbh.scanEventStore(scan_id, sfEvent)
        except Exception as e:
            print(f"[sfp__stor_db] Error storing event: {e}")

# End of sfp__stor_db class

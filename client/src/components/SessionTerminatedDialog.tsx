import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, LogOut, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSessionSocket } from '@/hooks/useSessionSocket';

export const SessionTerminatedDialog = () => {
  const { sessionTerminated, terminationMessage } = useSessionSocket();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (sessionTerminated) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [sessionTerminated]);

  return (
    <AnimatePresence>
      {sessionTerminated && (
        <Dialog open={sessionTerminated} modal>
          <DialogContent 
            className="bg-jetBlack border-2 border-crimsonRed text-coolWhite max-w-md"
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  className="bg-crimsonRed/20 p-4 rounded-full"
                >
                  <Shield className="h-12 w-12 text-crimsonRed" />
                </motion.div>
              </div>
              <DialogTitle className="text-center text-2xl font-bold text-crimsonRed">
                Session Terminated
              </DialogTitle>
              <DialogDescription className="text-center text-gray-300 pt-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-center space-x-2 text-yellow-400">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-semibold">Security Notice</span>
                  </div>
                  
                  <p className="text-base">
                    {terminationMessage}
                  </p>

                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mt-4">
                    <div className="flex items-center justify-center space-x-2">
                      <LogOut className="h-5 w-5 text-crimsonRed" />
                      <span className="text-sm">
                        Logging out in <span className="font-bold text-crimsonRed text-lg">{countdown}</span> seconds...
                      </span>
                    </div>
                  </div>

                  <motion.div
                    className="w-full bg-gray-700 rounded-full h-2 mt-4 overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="bg-crimsonRed h-full"
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: 3, ease: "linear" }}
                    />
                  </motion.div>

                  <p className="text-xs text-gray-400 mt-4">
                    If you believe this is an error, please contact your administrator.
                  </p>
                </motion.div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

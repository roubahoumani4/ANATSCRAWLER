import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import BackButton from "../ui/back-button";

const API_BASE = "/api/spiderfoot";

const moduleSets = {
  all: [],
  footprint: ["sfp_dnsresolve", "sfp_whois", "sfp_ipinfo", "sfp_shodan"],
  investigate: ["sfp_abuseipdb", "sfp_riskiq", "sfp_spamhaus", "sfp_alienvault"],
  passive: ["sfp_dnsresolve", "sfp_whois", "sfp_socialprofiles"]
};

const OsintNewScan = () => {
  const [target, setTarget] = useState("");
  const [scanName, setScanName] = useState("");
  const [modules, setModules] = useState([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [scanType, setScanType] = useState<keyof typeof moduleSets>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/modules`)
      .then(res => res.json())
      .then(data => setModules(data.modules || []))
      .catch(() => setModules([]));
  }, []);

  useEffect(() => {
    setSelectedModules(moduleSets[scanType] || []);
  }, [scanType]);

  const startScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, modules: selectedModules, name: scanName, scan_type: scanType })
      });
      const data = await res.json();
      if (!data.scan_id) setError("Failed to start scan");
    } catch {
      setError("Failed to start scan");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 min-h-screen w-screen bg-gradient-to-br from-[#0a0f1c] via-[#0a0f1c] to-[#10151f] text-white overflow-auto px-6 pt-8 pb-4">
      {/* Animated background: blue for New Scan */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-10 z-0">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute font-mono text-xs select-none"
            style={{ left: `${(i * 8) + 5}%`, top: `-5%` }}
            animate={{ y: ["0vh", "100vh"] }}
            transition={{ duration: Math.random() * 6 + 8, repeat: Infinity, delay: Math.random() * 3, ease: "linear" }}
          >
            {"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?".split("").slice(0, 10).map((_, idx) => (
              <div key={idx} className="mb-1" style={{ color: '#3b82f6' }}>{"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?".split("")[Math.floor(Math.random() * 68)]}</div>
            ))}
          </motion.div>
        ))}
      </div>
      <div className="relative z-10 w-full">
        <div className="mb-6">
          <BackButton color="blue" to="/osint" />
        </div>
        <motion.form
          onSubmit={startScan}
          className="w-full flex flex-col gap-8"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
      <div className="flex flex-col md:flex-row gap-8 w-full">
        <div className="flex-1">
          <label className="block mb-2 text-coolWhite font-semibold">Scan Name</label>
          <input
            type="text"
            value={scanName}
            onChange={e => setScanName(e.target.value)}
            className="w-full p-3 rounded bg-darkGray border border-gray-700 mb-4 text-coolWhite placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="The name of this scan."
          />
          <label className="block mb-2 text-coolWhite font-semibold">Scan Target</label>
          <input
            type="text"
            value={target}
            onChange={e => setTarget(e.target.value)}
            className="w-full p-3 rounded bg-darkGray border border-gray-700 mb-4 text-coolWhite placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="The target of your scan."
            required
          />
        </div>
        <div className="flex-1 text-sm text-coolWhite bg-darkGray border border-gray-700 rounded p-4">
          <div className="mb-2 font-semibold flex items-center gap-1 text-blue-400">
            <span className="text-yellow-400">&#9888;</span> Your scan target may be a domain, IP, email, phone, username, subnet, or bitcoin address. Format will be auto-detected.
          </div>
          <div className="grid grid-cols-2 gap-x-4 text-xs">
            <div>
              <div><b>Domain Name:</b> <span className="italic">example.com</span></div>
              <div><b>IPv4:</b> <span className="italic">1.2.3.4</span></div>
              <div><b>IPv6:</b> <span className="italic">2606:4700:4700::1111</span></div>
              <div><b>Hostname:</b> <span className="italic">abc.example.com</span></div>
              <div><b>Subnet:</b> <span className="italic">1.2.3.0/24</span></div>
              <div><b>Bitcoin:</b> <span className="italic">1HesYJSP1QqcyPEjnQ9vZBL1wujruNGe7R</span></div>
            </div>
            <div>
              <div><b>Email:</b> <span className="italic">bob@example.com</span></div>
              <div><b>Phone:</b> <span className="italic">+12345678901</span></div>
              <div><b>Name:</b> <span className="italic">"John Smith"</span></div>
              <div><b>Username:</b> <span className="italic">"jsmith2000"</span></div>
              <div><b>ASN:</b> <span className="italic">1234</span></div>
            </div>
          </div>
        </div>
      </div>
      {/* Scan Type Section */}
      <div className="w-full mt-8">
        <div className="flex flex-col gap-4">
          {[
            {
              value: "all",
              label: "All",
              title: "Get anything and everything about the target.",
              desc: "All modules will be enabled (slow) and every possible piece of information about the target will be obtained and analysed."
            },
            {
              value: "footprint",
              label: "Footprint",
              title: "Understand what information this target exposes to the Internet.",
              desc: "Gain an understanding about the target's network perimeter, associated identities and other information that is obtained through a lot of web crawling and search engine use."
            },
            {
              value: "investigate",
              label: "Investigate",
              title: "Best for when you suspect the target to be malicious but need more information.",
              desc: "Some basic footprinting will be performed in addition to querying of blacklists and other sources that may have information about your target's maliciousness."
            },
            {
              value: "passive",
              label: "Passive",
              title: "When you don't want the target to even suspect they are being investigated.",
              desc: "As much information will be gathered without touching the target or their affiliates, therefore only modules that do not touch the target will be enabled."
            }
          ].map((opt, idx) => (
            <label
              key={opt.value}
              className={`flex items-center gap-0 px-4 py-3 rounded cursor-pointer border-2 ${scanType === opt.value ? 'border-blue-500 bg-blue-900/30' : 'border-gray-700 bg-darkGray'} transition-all`}
            >
              <input
                type="radio"
                name="scanType"
                value={opt.value}
                checked={scanType === opt.value}
                onChange={() => setScanType(opt.value as keyof typeof moduleSets)}
                className="mt-1 mr-2 accent-blue-500"
              />
              <div className="flex flex-row w-full items-center">
                <div className="w-32 min-w-[8rem] max-w-[8rem] font-bold text-coolWhite text-left">{opt.label}</div>
                <div className="flex flex-col flex-1 pl-4">
                  <span className="font-semibold text-coolWhite mb-1">{opt.title}</span>
                  <span className="text-xs text-gray-300 mt-1">{opt.desc}</span>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
      <button
        type="submit"
        className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded font-bold flex items-center w-fit"
        disabled={loading}
      >
        <Search className="w-4 h-4 mr-2" /> Run Scan
      </button>
      {error && <div className="text-red-400 mt-2">{error}</div>}
        </motion.form>
      </div>
    </div>
  );
};

export default OsintNewScan;

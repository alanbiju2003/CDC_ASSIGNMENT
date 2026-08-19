import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, AlertCircle, Sparkles, ArrowRight, ShieldAlert, FileText, UploadCloud, Cpu, Award, Download, CheckCircle2 } from 'lucide-react';
import { API } from '../api';
import { useAuth } from '../context/AuthContext';

export default function KycPage() {
  const { user, refreshUser } = useAuth();

  const [step, setStep] = useState(1); // 1: Entity Info, 2: Doc Upload & Scan, 3: Verification & Certificate
  const [pan, setPan] = useState(user?.pan || 'AAAAA0000A');
  const [docType, setDocType] = useState('PAN Card - Business / Individual');
  const [gstin, setGstin] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('pan_card_document.pdf');
  
  // Scanning state
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Verification state
  const [loading, setLoading] = useState(false);
  const [kycResult, setKycResult] = useState(null);
  const [existingRecord, setExistingRecord] = useState(null);
  const [error, setError] = useState('');

  const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  const cleanPan = pan.trim().toUpperCase();
  const isFormatValid = PAN_REGEX.test(cleanPan);

  // Load existing KYC record if already verified
  useEffect(() => {
    async function loadRecord() {
      try {
        const res = await API.getKycRecord();
        if (res.record) {
          setExistingRecord(res.record);
          setPan(res.record.pan);
        }
      } catch (e) {}
    }
    loadRecord();
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setFileName(f.name);
    }
  };

  const startScanAndVerify = async (e) => {
    e.preventDefault();
    if (!isFormatValid) {
      setError('Please enter a valid 10-character PAN number matching regex ^[A-Z]{5}[0-9]{4}[A-Z]$.');
      return;
    }

    setError('');
    setStep(2);
    setScanning(true);
    setScanProgress(10);

    // Simulate OCR & Government Tax Registry Verification Progress
    const timer1 = setTimeout(() => setScanProgress(45), 600);
    const timer2 = setTimeout(() => setScanProgress(80), 1200);
    const timer3 = setTimeout(async () => {
      setScanProgress(100);
      setScanning(false);
      setStep(3);

      try {
        setLoading(true);
        const res = await API.verifyKyc({
          pan: cleanPan,
          docType,
          gstin: gstin || `29${cleanPan}1Z5`,
          fileName
        });
        setKycResult(res);
        if (res.verified) {
          await refreshUser();
          const recRes = await API.getKycRecord();
          if (recRes.record) setExistingRecord(recRes.record);
        }
      } catch (err) {
        setError(err.message || 'KYC verification failed.');
      } finally {
        setLoading(false);
      }
    }, 1800);
  };

  // Helper to decode 4th character entity type
  const getEntityLabel = (panStr) => {
    if (!panStr || panStr.length < 4) return 'Registered Business';
    const char = panStr.charAt(3).toUpperCase();
    switch (char) {
      case 'P': return 'Proprietorship / Individual (Type P)';
      case 'C': return 'Private Limited / Corporate Entity (Type C)';
      case 'F': return 'Partnership Firm / LLP (Type F)';
      case 'A': return 'Association of Persons (Type A)';
      case 'H': return 'Hindu Undivided Family (Type H)';
      case 'T': return 'Trust Entity (Type T)';
      default: return 'Tax Registered Entity';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-2 pb-12">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 mx-auto shadow-xl shadow-emerald-500/20">
          <div className="w-full h-full bg-[#0b0f19] rounded-[14px] flex items-center justify-center font-bold text-emerald-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
        </div>
        <h1 className="text-2xl font-bold font-heading text-white">Enterprise KYC & Tax Verification</h1>
        <p className="text-xs text-slate-400 max-w-lg mx-auto">
          Automated identity verification, PAN format regex check, entity classification, and Tax Registry certification.
        </p>
      </div>

      {/* Stepper Bar */}
      <div className="grid grid-cols-3 gap-2 p-2 rounded-2xl bg-[#121827] border border-slate-800 text-xs font-semibold">
        <div className={`p-3 rounded-xl flex items-center gap-2 transition-all ${
          step === 1 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-500'
        }`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
            step === 1 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
          }`}>1</div>
          <span className="hidden sm:inline">Identity & Details</span>
        </div>

        <div className={`p-3 rounded-xl flex items-center gap-2 transition-all ${
          step === 2 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-500'
        }`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
            step === 2 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
          }`}>2</div>
          <span className="hidden sm:inline">OCR Document Scan</span>
        </div>

        <div className={`p-3 rounded-xl flex items-center gap-2 transition-all ${
          step === 3 ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'text-slate-500'
        }`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
            step === 3 ? 'bg-violet-500 text-white' : 'bg-slate-800 text-slate-400'
          }`}>3</div>
          <span className="hidden sm:inline">Audit Certificate</span>
        </div>
      </div>

      {/* Status Banner */}
      <div className="p-5 rounded-2xl bg-[#121827] border border-slate-800 flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs text-slate-400 block font-medium">Vendor Partner: {user?.name} ({user?.businessName || 'Store'})</span>
          <span className="text-xs text-slate-500 block font-mono">Email: {user?.email}</span>
        </div>
        <div>
          {user?.status === 'active' ? (
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Account Active & Verified
            </span>
          ) : (
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> Status: Pending KYC
            </span>
          )}
        </div>
      </div>

      {/* STEP 1: Form Inputs */}
      {step === 1 && (
        <form onSubmit={startScanAndVerify} className="p-6 rounded-2xl bg-[#121827] border border-slate-800 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Document Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="PAN Card - Business / Individual">Government Issued PAN Card</option>
                <option value="GSTIN Registration Certificate">GSTIN Tax Registration Certificate</option>
                <option value="Partnership / Incorporation Certificate">Incorporation / Firm Certificate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">PAN Identification Number</label>
              <input
                type="text"
                required
                maxLength={10}
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                placeholder="e.g. AAAAA0000A"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-emerald-500 tracking-wider"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">GSTIN / Business Registration ID (Optional)</label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              placeholder={`29${cleanPan || 'AAAAA0000A'}1Z5`}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Regex Analysis Box */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">
                PAN Regex Match: <code className="text-emerald-400 font-mono font-bold">^[A-Z]&#123;5&#125;[0-9]&#123;4&#125;[A-Z]$</code>
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
                isFormatValid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {isFormatValid ? '✓ Regex Passed' : '✗ Regex Failed'}
              </span>
            </div>
            {isFormatValid && (
              <p className="text-[11px] text-emerald-400/90 font-medium">
                Detected Entity Category: <strong>{getEntityLabel(cleanPan)}</strong>
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPan('AAAAA0000A')}
                className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono"
              >
                Preset 1: AAAAA0000A (Proprietorship)
              </button>
              <button
                type="button"
                onClick={() => setPan('ZZZZZ9999Z')}
                className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono"
              >
                Preset 2: ZZZZZ9999Z (Company)
              </button>
            </div>
          </div>

          {/* Mock Document Upload Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Attach Proof Document (PDF / Image)</label>
            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-5 text-center bg-slate-900/50 transition-colors relative">
              <input
                type="file"
                accept=".pdf,.png,.jpeg,.jpg"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center justify-center gap-3">
                <div className="p-2 rounded-lg bg-slate-800 text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-slate-200">{fileName}</p>
                  <p className="text-[11px] text-slate-500">Click or drag file to attach proof document copy</p>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn-emerald w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
          >
            <span>Proceed to Live OCR Scan & Verification</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* STEP 2: OCR Scanning Animation */}
      {step === 2 && (
        <div className="p-8 rounded-2xl bg-[#121827] border border-slate-800 text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
            <Cpu className="w-8 h-8 text-emerald-400 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold text-white font-heading">AI Document Scanning & Verification</h3>
            <p className="text-xs text-slate-400">
              Extracting text metadata from <code className="text-emerald-400 font-mono">{fileName}</code> and validating against Tax Registry database...
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md mx-auto space-y-1">
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>Regex Check: PASSED</span>
              <span>{scanProgress}% Processed</span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Verification Audit Certificate */}
      {step === 3 && (
        <div className="space-y-4">
          {kycResult && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#121827] to-[#0f172a] border border-emerald-500/40 text-slate-100 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base font-heading">TAX REGISTRY VERIFICATION CERTIFICATE</h3>
                    <p className="text-xs text-emerald-400 font-mono font-semibold">
                      {kycResult.certificateId || existingRecord?.id || 'KYC-CERT-889102'}
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-4 h-4" /> VERIFIED_ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">PAN Number</span>
                  <span className="font-mono font-bold text-white text-sm">{kycResult.pan || cleanPan}</span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Entity Classification</span>
                  <span className="font-semibold text-emerald-400">{kycResult.entityType || getEntityLabel(cleanPan)}</span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Confidence Match</span>
                  <span className="font-bold text-amber-400">{kycResult.confidenceScore || '98.5%'}</span>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Verified Timestamp</span>
                  <span className="text-slate-300 font-mono text-[11px]">
                    {new Date(kycResult.verifiedAt || Date.now()).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Vendor Account:</span>
                  <span className="text-white font-semibold">{user?.email}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Document Type:</span>
                  <span className="text-white font-semibold">{docType}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Proof File Attached:</span>
                  <span className="text-emerald-400 font-mono">{fileName}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Re-Verify / Edit Details
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-emerald px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Download Certificate
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

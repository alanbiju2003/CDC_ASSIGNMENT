import React from 'react';
import { CheckCircle, Clock, AlertCircle, RefreshCw, XCircle, ArrowUpRight } from 'lucide-react';

export default function StatusBadge({ status }) {
  const norm = (status || '').toLowerCase();

  let label = status;
  let classes = 'badge-submitted';
  let Icon = Clock;

  switch (norm) {
    case 'live':
    case 'active':
      label = norm === 'live' ? 'Live on Vault' : 'Active Partner';
      classes = 'badge-live';
      Icon = CheckCircle;
      break;
    case 'submitted':
      label = 'Under Review';
      classes = 'badge-submitted';
      Icon = Clock;
      break;
    case 'priced':
      label = 'Priced';
      classes = 'badge-priced';
      Icon = ArrowUpRight;
      break;
    case 'sold':
      label = 'Sold';
      classes = 'badge-sold';
      Icon = CheckCircle;
      break;
    case 'returned':
      label = 'Returned';
      classes = 'badge-returned';
      Icon = XCircle;
      break;
    case 'pending_kyc':
      label = 'KYC Pending';
      classes = 'badge-pending_kyc';
      Icon = AlertCircle;
      break;
    case 'awaiting_signature':
      label = 'Needs E-Sign';
      classes = 'badge-submitted';
      Icon = Clock;
      break;
    case 'signed':
      label = 'Signed';
      classes = 'badge-live';
      Icon = CheckCircle;
      break;
    case 'draft':
      label = 'Draft';
      classes = 'badge-submitted';
      Icon = Clock;
      break;
    case 'sent':
      label = 'Sent / Settled';
      classes = 'badge-live';
      Icon = CheckCircle;
      break;
    case 'cancelled':
      label = 'Cancelled';
      classes = 'badge-returned';
      Icon = XCircle;
      break;
    case 'pending':
      label = 'Pending Decision';
      classes = 'badge-submitted';
      Icon = Clock;
      break;
    case 'approved':
      label = 'Approved';
      classes = 'badge-live';
      Icon = CheckCircle;
      break;
    case 'rejected':
      label = 'Rejected';
      classes = 'badge-returned';
      Icon = XCircle;
      break;
    default:
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${classes}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </span>
  );
}

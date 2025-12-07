
# Serenity Home Health - Operations Admin Guide

## 🕹️ Live Command Center
**Location:** Console > Operations > Live Board

This is your "God View" of daily operations.
*   🟢 **Green:** Staff is **On Site** (Verified).
*   🟡 **Yellow:** Staff is **En Route** (Commuter Mode Active).
*   🔴 **Red:** **Critical Alert** (Late or GPS Mismatch).
*   ⚪ **Gray:** Scheduled (Future).

**Action:** Monitor this board throughout the day. Call any "Red" staff immediately.

---

## 🛡️ Compliance Audit Queue (The "Holding Cell")
**Location:** Console > Compliance > Audit Queue

The system automatically **LOCKS** any shift that is flagged (Red). These shifts **cannot be billed** until you review them.

### Workflow:
1.  **Review:** Open the Audit Queue.
2.  **Investigate:** Click a shift to see the GPS log. Call the patient if needed.
3.  **Decide:**
    *   **Override & Pay:** If valid (e.g., phone died). You MUST enter a reason note.
    *   **Reject:** If no-show or fraud. This marks the shift as non-billable.

---

## 💰 Billing Cycle
**Location:** Console > Billing > Claims

1.  Run **"Generate Claims"**.
2.  The system will process all "Green" shifts.
3.  Any "Red" (Unverified) shifts will be skipped and listed in the error report.
4.  **Rule:** "No Green, No Green". You cannot accidentally bill for a shift that hasn't been verified.

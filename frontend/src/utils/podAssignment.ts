/**
 * Pod Assignment Utilities
 * Handles pod assignment/reassignment with audit logging and validation
 */

const PODS_STORAGE_KEY = 'serenity_pods';
const POD_MEMBERS_STORAGE_KEY = 'serenity_pod_members';
const POD_AUDIT_LOG_KEY = 'serenity_pod_audit_log';

export interface PodMember {
  id: string;
  name: string;
  email: string;
  role: string;
  memberType: 'staff' | 'patient';
  joinedAt: string;
  status: 'active' | 'inactive';
}

export interface PodAuditLog {
  id: string;
  podId: string;
  podName: string;
  memberId: string;
  memberName: string;
  memberType: 'staff' | 'patient';
  action: 'assigned' | 'reassigned' | 'removed';
  previousPodId?: string;
  previousPodName?: string;
  performedBy: string;
  performedByName: string;
  timestamp: string;
  notes?: string;
}

export interface AssignToPodParams {
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberRole: string;
  memberType: 'staff' | 'patient';
  podId: string;
  performedBy: string;
  performedByName: string;
  notes?: string;
}

/**
 * Check if a member is already assigned to a pod
 */
export function getMemberCurrentPod(memberId: string): { podId: string; podName: string } | null {
  try {
    const storedMembers = localStorage.getItem(POD_MEMBERS_STORAGE_KEY);
    const allMembers: Record<string, PodMember[]> = storedMembers ? JSON.parse(storedMembers) : {};

    // Search through all pods to find if member is assigned
    for (const [podId, members] of Object.entries(allMembers)) {
      const found = members.find(m => m.id === memberId);
      if (found) {
        // Get pod name
        const storedPods = localStorage.getItem(PODS_STORAGE_KEY);
        const pods = storedPods ? JSON.parse(storedPods) : [];
        const pod = pods.find((p: any) => p.id === podId);

        return {
          podId,
          podName: pod?.name || 'Unknown Pod'
        };
      }
    }

    return null;
  } catch (err) {
    console.error('Error checking member pod:', err);
    return null;
  }
}

/**
 * Assign or reassign a member to a pod with audit logging
 */
export function assignMemberToPod(params: AssignToPodParams): { success: boolean; error?: string } {
  try {
    const { memberId, memberName, memberEmail, memberRole, memberType, podId, performedBy, performedByName, notes } = params;

    // Get current pod assignment (if any)
    const currentPod = getMemberCurrentPod(memberId);

    // Check if already assigned to the same pod
    if (currentPod && currentPod.podId === podId) {
      return {
        success: false,
        error: `${memberName} is already assigned to this pod`
      };
    }

    // Get pod details
    const storedPods = localStorage.getItem(PODS_STORAGE_KEY);
    const pods = storedPods ? JSON.parse(storedPods) : [];
    const targetPod = pods.find((p: any) => p.id === podId);

    if (!targetPod) {
      return {
        success: false,
        error: 'Target pod not found'
      };
    }

    // Check if pod is active
    if (targetPod.status !== 'active') {
      return {
        success: false,
        error: 'Cannot assign to inactive pod'
      };
    }

    // Load all members
    const storedMembers = localStorage.getItem(POD_MEMBERS_STORAGE_KEY);
    const allMembers: Record<string, PodMember[]> = storedMembers ? JSON.parse(storedMembers) : {};

    // Remove from current pod if exists
    if (currentPod) {
      const currentPodMembers = allMembers[currentPod.podId] || [];
      allMembers[currentPod.podId] = currentPodMembers.filter(m => m.id !== memberId);
    }

    // Add to new pod
    const newPodMembers = allMembers[podId] || [];
    const newMember: PodMember = {
      id: memberId,
      name: memberName,
      email: memberEmail,
      role: memberRole,
      memberType,
      joinedAt: new Date().toISOString(),
      status: 'active'
    };

    newPodMembers.push(newMember);
    allMembers[podId] = newPodMembers;

    // Save updated members
    localStorage.setItem(POD_MEMBERS_STORAGE_KEY, JSON.stringify(allMembers));

    // Update pod member counts
    for (const [pId, members] of Object.entries(allMembers)) {
      const pod = pods.find((p: any) => p.id === pId);
      if (pod) {
        pod.memberCount = members.length;
      }
    }
    localStorage.setItem(PODS_STORAGE_KEY, JSON.stringify(pods));

    // Create audit log
    const auditLog: PodAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      podId,
      podName: targetPod.name,
      memberId,
      memberName,
      memberType,
      action: currentPod ? 'reassigned' : 'assigned',
      previousPodId: currentPod?.podId,
      previousPodName: currentPod?.podName,
      performedBy,
      performedByName,
      timestamp: new Date().toISOString(),
      notes
    };

    // Save audit log
    const storedLogs = localStorage.getItem(POD_AUDIT_LOG_KEY);
    const allLogs: PodAuditLog[] = storedLogs ? JSON.parse(storedLogs) : [];
    allLogs.push(auditLog);
    localStorage.setItem(POD_AUDIT_LOG_KEY, JSON.stringify(allLogs));

    return { success: true };
  } catch (err) {
    console.error('Error assigning member to pod:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to assign member to pod'
    };
  }
}

/**
 * Remove a member from their pod with audit logging
 */
export function removeMemberFromPod(
  memberId: string,
  memberName: string,
  memberType: 'staff' | 'patient',
  performedBy: string,
  performedByName: string,
  notes?: string
): { success: boolean; error?: string } {
  try {
    const currentPod = getMemberCurrentPod(memberId);

    if (!currentPod) {
      return {
        success: false,
        error: `${memberName} is not assigned to any pod`
      };
    }

    // Load all members
    const storedMembers = localStorage.getItem(POD_MEMBERS_STORAGE_KEY);
    const allMembers: Record<string, PodMember[]> = storedMembers ? JSON.parse(storedMembers) : {};

    // Remove from current pod
    const currentPodMembers = allMembers[currentPod.podId] || [];
    allMembers[currentPod.podId] = currentPodMembers.filter(m => m.id !== memberId);

    // Save updated members
    localStorage.setItem(POD_MEMBERS_STORAGE_KEY, JSON.stringify(allMembers));

    // Update pod member count
    const storedPods = localStorage.getItem(PODS_STORAGE_KEY);
    const pods = storedPods ? JSON.parse(storedPods) : [];
    const pod = pods.find((p: any) => p.id === currentPod.podId);
    if (pod) {
      pod.memberCount = allMembers[currentPod.podId]?.length || 0;
      localStorage.setItem(PODS_STORAGE_KEY, JSON.stringify(pods));
    }

    // Create audit log
    const auditLog: PodAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      podId: currentPod.podId,
      podName: currentPod.podName,
      memberId,
      memberName,
      memberType,
      action: 'removed',
      performedBy,
      performedByName,
      timestamp: new Date().toISOString(),
      notes
    };

    // Save audit log
    const storedLogs = localStorage.getItem(POD_AUDIT_LOG_KEY);
    const allLogs: PodAuditLog[] = storedLogs ? JSON.parse(storedLogs) : [];
    allLogs.push(auditLog);
    localStorage.setItem(POD_AUDIT_LOG_KEY, JSON.stringify(allLogs));

    return { success: true };
  } catch (err) {
    console.error('Error removing member from pod:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to remove member from pod'
    };
  }
}

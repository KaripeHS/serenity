# Quick Start Guide - Command Centers & RBAC
**Date:** December 13, 2025
**For:** Developers implementing remaining command centers

---

## 🚀 Quick Implementation Steps

### Step 1: Create New Command Center

```typescript
// Example: frontend/src/components/dashboards/OperationsCommandCenter.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout, TabContainer, UrgentSection, WidgetContainer, StatWidget, WidgetGrid } from '@/components/ui/CommandCenter';
import type { Tab } from '@/components/ui/CommandCenter';
import { api } from '@/lib/api';
import { useRoleAccess, DashboardPermission, FeaturePermission, withRoleAccess } from '@/hooks/useRoleAccess';

function OperationsCommandCenter() {
  const roleAccess = useRoleAccess();
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch urgent items
  const { data: urgentData, isLoading } = useQuery({
    queryKey: ['operations', 'urgent'],
    queryFn: async () => {
      const [scheduleIssues, geoFenceViolations] = await Promise.all([
        api.get('/operations/schedule/issues'),
        api.get('/operations/geofence/violations'),
      ]);
      return { scheduleIssues: scheduleIssues.data, geoFenceViolations: geoFenceViolations.data };
    },
  });

  // Build urgent items
  const urgentItems = [
    ...(urgentData?.scheduleIssues || []).map((issue: any) => ({
      id: `schedule-${issue.id}`,
      title: `Schedule Issue: ${issue.caregiverName}`,
      description: issue.description,
      priority: 'urgent' as const,
      action: {
        label: 'Resolve',
        onClick: () => window.location.href = `/operations/schedule/${issue.id}`,
      },
    })),
  ];

  // Define tabs with RBAC filtering
  const tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Overview',
      content: <OverviewTab />,
    },
    // Add more tabs...
  ].filter(Boolean) as Tab[];

  return (
    <DashboardLayout
      title="Operations Command Center"
      subtitle="Real-time operations monitoring and management"
      urgentSection={<UrgentSection items={urgentItems} />}
    >
      <TabContainer tabs={tabs} defaultTab="overview" />
    </DashboardLayout>
  );
}

// IMPORTANT: Export with RBAC protection
export default withRoleAccess(
  OperationsCommandCenter,
  DashboardPermission.OPERATIONS_COMMAND_CENTER
);
```

---

### Step 2: Add Dashboard Permission to RBAC

```typescript
// frontend/src/hooks/useRoleAccess.ts

export enum DashboardPermission {
  // ... existing permissions
  OPERATIONS_COMMAND_CENTER = 'dashboard:operations_command_center', // ADD THIS
}

const DASHBOARD_ACCESS: Record<DashboardPermission, UserRole[]> = {
  // ... existing mappings
  [DashboardPermission.OPERATIONS_COMMAND_CENTER]: [ // ADD THIS
    UserRole.FOUNDER,
    UserRole.SCHEDULER,
    UserRole.FIELD_SUPERVISOR,
    UserRole.CLINICAL_DIRECTOR,
  ],
};
```

---

### Step 3: Add Feature Permissions (Optional)

```typescript
// frontend/src/hooks/useRoleAccess.ts

export enum FeaturePermission {
  // ... existing permissions
  VIEW_SCHEDULE = 'feature:view_schedule', // ADD THESE
  MANAGE_SCHEDULE = 'feature:manage_schedule',
  VIEW_GPS_TRACKING = 'feature:view_gps_tracking',
}

const FEATURE_ACCESS: Record<FeaturePermission, UserRole[]> = {
  // ... existing mappings
  [FeaturePermission.VIEW_SCHEDULE]: [ // ADD THESE
    UserRole.FOUNDER,
    UserRole.SCHEDULER,
    UserRole.FIELD_SUPERVISOR,
    UserRole.CLINICAL_DIRECTOR,
  ],
  [FeaturePermission.MANAGE_SCHEDULE]: [
    UserRole.FOUNDER,
    UserRole.SCHEDULER,
  ],
};
```

---

### Step 4: Use Feature Permissions in Tabs

```typescript
// Inside your command center component:

const tabs: Tab[] = [
  {
    id: 'overview',
    label: 'Overview',
    content: <OverviewTab />,
  },
  roleAccess.canAccessFeature(FeaturePermission.MANAGE_SCHEDULE) && {
    id: 'scheduling',
    label: 'Scheduling',
    content: <SchedulingTab />,
  },
  // Tab only visible if user can manage schedule
].filter(Boolean) as Tab[];
```

---

### Step 5: Conditional Rendering in Components

```typescript
function OverviewTab() {
  const roleAccess = useRoleAccess();

  return (
    <div className="space-y-6">
      {/* Everyone can see this */}
      <WidgetContainer title="Schedule Overview">
        <p>Schedule data...</p>
      </WidgetContainer>

      {/* Only Scheduler can see this */}
      {roleAccess.canAccessFeature(FeaturePermission.MANAGE_SCHEDULE) && (
        <WidgetContainer
          title="Schedule Management"
          action={{
            label: 'Create Schedule',
            onClick: () => window.location.href = '/operations/schedule/new',
          }}
        >
          <p>Management tools...</p>
        </WidgetContainer>
      )}
    </div>
  );
}
```

---

## 📋 Checklist for New Command Center

### Before You Start
- [ ] Read [DASHBOARD_CONSOLIDATION_PLAN.md](cci:7://file:///c:/Users/bdegu/coding/Serenity01/docs/DASHBOARD_CONSOLIDATION_PLAN.md:0:0-0:0)
- [ ] Read [RBAC_IMPLEMENTATION.md](cci:7://file:///c:/Users/bdegu/coding/Serenity01/docs/RBAC_IMPLEMENTATION.md:0:0-0:0)
- [ ] Identify which old dashboards you're consolidating
- [ ] List all user roles that should have access

### Implementation
- [ ] Create component file: `frontend/src/components/dashboards/[Name]CommandCenter.tsx`
- [ ] Import shared components: `DashboardLayout`, `TabContainer`, `UrgentSection`, etc.
- [ ] Import RBAC hook: `useRoleAccess`, `withRoleAccess`, `DashboardPermission`, `FeaturePermission`
- [ ] Add dashboard permission to `DashboardPermission` enum
- [ ] Add dashboard permission mapping to `DASHBOARD_ACCESS`
- [ ] Add feature permissions to `FeaturePermission` enum (if needed)
- [ ] Add feature permission mappings to `FEATURE_ACCESS` (if needed)
- [ ] Fetch urgent items using `useQuery`
- [ ] Build `urgentItems` array with color-coded priorities
- [ ] Define tabs with RBAC filtering: `roleAccess.canAccessFeature()`
- [ ] Create tab components (e.g., `OverviewTab`, `DetailsTab`)
- [ ] Add header actions (stats, export buttons)
- [ ] Export with `withRoleAccess()` HOC

### Testing
- [ ] Test with Founder role (should see all tabs)
- [ ] Test with restricted role (should see filtered tabs)
- [ ] Test "Access Denied" page (user without permission)
- [ ] Test urgent items appear correctly
- [ ] Test countdown timers work
- [ ] Test one-click action buttons work

### Documentation
- [ ] Add component to [IMPLEMENTATION_SUMMARY.md](cci:7://file:///c:/Users/bdegu/coding/Serenity01/docs/IMPLEMENTATION_SUMMARY.md:0:0-0:0)
- [ ] Update user role matrix in [RBAC_IMPLEMENTATION.md](cci:7://file:///c:/Users/bdegu/coding/Serenity01/docs/RBAC_IMPLEMENTATION.md:0:0-0:0)

---

## 🎨 Component Library Reference

### DashboardLayout

```typescript
<DashboardLayout
  title="Command Center Title"
  subtitle="Description of what this dashboard does"
  actions={headerActions} // Optional: Buttons/stats in header
  urgentSection={<UrgentSection items={urgentItems} />}
>
  {children}
</DashboardLayout>
```

**Props**:
- `title` (required): Dashboard title
- `subtitle` (optional): Dashboard description
- `actions` (optional): React node for header actions
- `urgentSection` (optional): React node for urgent items
- `children` (required): Dashboard content

---

### TabContainer

```typescript
<TabContainer
  tabs={tabs}
  defaultTab="overview"
  onChange={(tabId) => console.log('Tab changed:', tabId)}
/>
```

**Tab Structure**:
```typescript
const tabs: Tab[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <Activity className="w-4 h-4" />, // Optional
    badge: 5, // Optional: Show count
    badgeColor: 'red', // Optional: 'red' | 'yellow' | 'green' | 'blue' | 'gray'
    content: <OverviewTab />,
  },
];
```

---

### UrgentSection

```typescript
<UrgentSection
  items={urgentItems}
  title="🚨 Urgent Items (Today)" // Optional
  emptyMessage="✅ All caught up!" // Optional
/>
```

**Urgent Item Structure**:
```typescript
const urgentItems = [
  {
    id: 'unique-id',
    title: 'Alert title',
    description: 'Additional details', // Optional
    deadline: new Date('2025-12-14'), // Optional: Shows countdown
    priority: 'urgent' | 'important' | 'info',
    action: { // Optional
      label: 'Action Button',
      onClick: () => {},
      variant: 'primary' | 'secondary' | 'danger', // Optional
    },
  },
];
```

**Priority Colors**:
- `urgent` = Red background, AlertCircle icon
- `important` = Yellow background, AlertTriangle icon
- `info` = Blue background, Clock icon

---

### WidgetContainer

```typescript
<WidgetContainer
  title="Widget Title"
  subtitle="Widget description" // Optional
  icon={<Activity className="w-5 h-5" />} // Optional
  action={{ label: 'View All', onClick: () => {} }} // Optional
  variant="default" | "compact" // Optional
>
  {children}
</WidgetContainer>
```

---

### StatWidget

```typescript
<StatWidget
  label="Metric Name"
  value="100"
  change={{ value: 10, isPositive: true, label: 'vs last month' }} // Optional
  icon={<Activity className="w-6 h-6" />} // Optional
  variant="default" | "success" | "warning" | "danger" // Optional
/>
```

**Variants**:
- `default` = White background
- `success` = Green background
- `warning` = Yellow background
- `danger` = Red background

---

### WidgetGrid

```typescript
<WidgetGrid columns={3} gap={6}>
  <StatWidget label="Metric 1" value="100" />
  <StatWidget label="Metric 2" value="200" />
  <StatWidget label="Metric 3" value="300" />
</WidgetGrid>
```

**Props**:
- `columns`: 1 | 2 | 3 | 4
- `gap`: Number (Tailwind spacing scale)

**Responsive Behavior**:
- `columns={4}`: 1 col mobile, 2 col tablet, 4 col desktop
- `columns={3}`: 1 col mobile, 2 col tablet, 3 col desktop
- `columns={2}`: 1 col mobile, 2 col tablet/desktop
- `columns={1}`: 1 col all screen sizes

---

## 🔐 RBAC Patterns

### Pattern 1: Dashboard-Level Protection

```typescript
// Only users with dashboard permission can access
export default withRoleAccess(
  MyCommandCenter,
  DashboardPermission.MY_COMMAND_CENTER
);
```

---

### Pattern 2: Tab-Level Protection

```typescript
const tabs: Tab[] = [
  {
    id: 'public',
    label: 'Public',
    content: <PublicTab />, // Everyone sees this
  },
  roleAccess.canAccessFeature(FeaturePermission.ADMIN_ONLY) && {
    id: 'admin',
    label: 'Admin',
    content: <AdminTab />, // Only admins see this
  },
].filter(Boolean) as Tab[];
```

---

### Pattern 3: Widget-Level Protection

```typescript
<WidgetContainer title="Public Widget">
  <p>Everyone can see this</p>
</WidgetContainer>

{roleAccess.canAccessFeature(FeaturePermission.MANAGE_SOMETHING) && (
  <WidgetContainer
    title="Protected Widget"
    action={{ label: 'Manage', onClick: () => {} }}
  >
    <p>Only authorized users see this</p>
  </WidgetContainer>
)}
```

---

### Pattern 4: Button-Level Protection

```typescript
<WidgetContainer
  title="My Widget"
  action={
    roleAccess.canAccessFeature(FeaturePermission.EDIT)
      ? { label: 'Edit', onClick: () => {} }
      : undefined // No action button if no permission
  }
>
  <p>Content</p>
</WidgetContainer>
```

---

### Pattern 5: Role Flags

```typescript
const { isFounder, isExecutive, isClinical, isCompliance, isHR, isFinance } = useRoleAccess();

return (
  <>
    {isExecutive && <ExecutiveWidget />}
    {isClinical && <ClinicalWidget />}
    {isCompliance && <ComplianceWidget />}
  </>
);
```

---

## 🐛 Common Mistakes

### ❌ Mistake 1: Forgetting to Export with RBAC

```typescript
// WRONG
export default MyCommandCenter;

// CORRECT
export default withRoleAccess(MyCommandCenter, DashboardPermission.MY_COMMAND_CENTER);
```

---

### ❌ Mistake 2: Not Filtering Tabs

```typescript
// WRONG - Tab shows but user can't use it
const tabs: Tab[] = [
  {
    id: 'admin',
    label: 'Admin',
    content: <AdminTab />,
  },
];

// CORRECT - Tab hidden if no permission
const tabs: Tab[] = [
  roleAccess.canAccessFeature(FeaturePermission.ADMIN) && {
    id: 'admin',
    label: 'Admin',
    content: <AdminTab />,
  },
].filter(Boolean) as Tab[];
```

---

### ❌ Mistake 3: Forgetting to Add Permission to Enum

```typescript
// WRONG - Permission doesn't exist
roleAccess.canAccessFeature(FeaturePermission.MY_NEW_PERMISSION); // Error!

// CORRECT - Add to enum first
export enum FeaturePermission {
  MY_NEW_PERMISSION = 'feature:my_new_permission',
}
```

---

### ❌ Mistake 4: Not Checking Backend Permissions

```typescript
// Frontend RBAC is UX-only, backend must enforce too!

// Backend Route (REQUIRED):
router.post('/operations/schedule',
  requireAuth,
  requireRole('founder', 'scheduler'), // MUST HAVE THIS
  scheduleController.create
);
```

---

## 📝 Example: Full Command Center

See these reference implementations:
- [ClinicalCommandCenter.tsx](cci:7://file:///c:/Users/bdegu/coding/Serenity01/frontend/src/components/dashboards/ClinicalCommandCenter.tsx:0:0-0:0) - Complete example with 5 tabs
- [ComplianceCommandCenter.tsx](cci:7://file:///c:/Users/bdegu/coding/Serenity01/frontend/src/components/dashboards/ComplianceCommandCenter.tsx:0:0-0:0) - Traffic light scoring
- [TalentCommandCenter.tsx](cci:7://file:///c:/Users/bdegu/coding/Serenity01/frontend/src/components/dashboards/TalentCommandCenter.tsx:0:0-0:0) - Kanban board example
- [RevenueCommandCenter.tsx](cci:7://file:///c:/Users/bdegu/coding/Serenity01/frontend/src/components/dashboards/RevenueCommandCenter.tsx:0:0-0:0) - Waterfall chart example
- [OperationsCommandCenter.tsx](cci:7://file:///c:/Users/bdegu/coding/Serenity01/frontend/src/components/dashboards/OperationsCommandCenter.tsx:0:0-0:0) - Real-time GPS tracking, schedule optimization

---

## 🎓 Best Practices

✅ **Always use `withRoleAccess()` HOC** - Enforces dashboard-level protection
✅ **Filter tabs based on permissions** - Hide tabs user can't use
✅ **Use feature flags for conditional rendering** - `isFounder`, `isExecutive`, etc.
✅ **Add loading states** - Show spinner while fetching data
✅ **Empty states** - Show friendly message when no data
✅ **One-click actions** - Every alert should have action button
✅ **Color-coded priorities** - Red = urgent, Yellow = important, Green = on track
✅ **Countdown timers** - Show time remaining for deadlines
✅ **Responsive design** - Use `WidgetGrid` for responsive layouts

---

**Need Help?**
- Read full documentation: [DASHBOARD_CONSOLIDATION_PLAN.md](cci:7://file:///c:/Users/bdegu/coding/Serenity01/docs/DASHBOARD_CONSOLIDATION_PLAN.md:0:0-0:0)
- Review RBAC details: [RBAC_IMPLEMENTATION.md](cci:7://file:///c:/Users/bdegu/coding/Serenity01/docs/RBAC_IMPLEMENTATION.md:0:0-0:0)
- Check implementation summary: [IMPLEMENTATION_SUMMARY.md](cci:7://file:///c:/Users/bdegu/coding/Serenity01/docs/IMPLEMENTATION_SUMMARY.md:0:0-0:0)

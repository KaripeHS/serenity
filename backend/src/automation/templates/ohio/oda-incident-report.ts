export const ODA_INCIDENT_REPORT_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; }
    .header { text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 20px; }
    .section { margin-bottom: 15px; border: 1px solid #000; padding: 10px; }
    .section-title { font-weight: bold; background-color: #eee; padding: 5px; margin: -10px -10px 10px -10px; border-bottom: 1px solid #000; }
    .row { display: flex; margin-bottom: 5px; }
    .col { flex: 1; }
    .label { font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">OHIO DEPARTMENT OF AGING - INCIDENT REPORT</div>
  
  <div class="section">
    <div class="section-title">PROVIDER INFORMATION</div>
    <div class="row">
      <div class="col"><span class="label">Provider Name:</span> Serenity Care Partners</div>
      <div class="col"><span class="label">Medicaid Provider #:</span> {{providerId}}</div>
    </div>
    <div class="row">
      <div class="col"><span class="label">Address:</span> {{providerAddress}}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">INDIVIDUAL INFORMATION</div>
    <div class="row">
      <div class="col"><span class="label">Name:</span> {{patientName}}</div>
      <div class="col"><span class="label">Medicaid ID:</span> {{patientMedicaidId}}</div>
    </div>
    <div class="row">
      <div class="col"><span class="label">DOB:</span> {{patientDob}}</div>
      <div class="col"><span class="label">Phone:</span> {{patientPhone}}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">INCIDENT DETAILS</div>
    <div class="row">
      <div class="col"><span class="label">Date of Incident:</span> {{incidentDate}}</div>
      <div class="col"><span class="label">Time:</span> {{incidentTime}}</div>
    </div>
    <div class="row">
      <div class="col"><span class="label">Location:</span> {{incidentLocation}}</div>
    </div>
    <div class="row">
      <div class="col">
        <span class="label">Description of Incident:</span><br/>
        {{incidentDescription}}
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">TYPE OF INCIDENT (Check all that apply)</div>
    <div>{{#if isFall}}[X] Fall{{else}}[ ] Fall{{/if}}</div>
    <div>{{#if isInjury}}[X] Injury{{else}}[ ] Injury{{/if}}</div>
    <div>{{#if isMedError}}[X] Medication Error{{else}}[ ] Medication Error{{/if}}</div>
    <div>{{#if isAbuse}}[X] Alleged Abuse/Neglect{{else}}[ ] Alleged Abuse/Neglect{{/if}}</div>
    <div>{{#if isOther}}[X] Other: {{otherType}}{{else}}[ ] Other{{/if}}</div>
  </div>

  <div class="section">
    <div class="section-title">ACTION TAKEN</div>
    <div>{{actionTaken}}</div>
  </div>

  <div class="section">
    <div class="section-title">NOTIFICATIONS</div>
    <div class="row">
      <div class="col"><span class="label">Case Manager Notified:</span> {{caseManagerNotified}} ({{caseManagerNotifiedTime}})</div>
    </div>
    <div class="row">
      <div class="col"><span class="label">Family Notified:</span> {{familyNotified}} ({{familyNotifiedTime}})</div>
    </div>
    <div class="row">
      <div class="col"><span class="label">Physician Notified:</span> {{physicianNotified}} ({{physicianNotifiedTime}})</div>
    </div>
  </div>

  <div class="section">
    <div class="row">
      <div class="col"><span class="label">Reported By:</span> {{reporterName}}</div>
      <div class="col"><span class="label">Title:</span> {{reporterTitle}}</div>
      <div class="col"><span class="label">Date:</span> {{reportDate}}</div>
    </div>
  </div>
</body>
</html>
`;

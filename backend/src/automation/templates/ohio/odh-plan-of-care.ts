export const ODH_PLAN_OF_CARE_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; }
    td, th { border: 1px solid #000; padding: 4px; vertical-align: top; }
    .header { font-weight: bold; background-color: #eee; }
  </style>
</head>
<body>
  <h3>HOME HEALTH CERTIFICATION AND PLAN OF CARE</h3>
  
  <table>
    <tr>
      <td colspan="2">1. Patient's HI Claim No.<br/>{{patientClaimNo}}</td>
      <td colspan="2">2. Start of Care Date<br/>{{socDate}}</td>
      <td colspan="2">3. Certification Period<br/>From: {{certStart}} To: {{certEnd}}</td>
      <td colspan="2">4. Medical Record No.<br/>{{mrn}}</td>
    </tr>
    <tr>
      <td colspan="4">5. Patient's Name and Address<br/>
        {{patientName}}<br/>
        {{patientAddress}}<br/>
        {{patientCityStateZip}}
      </td>
      <td colspan="4">6. Provider's Name, Address, and Telephone Number<br/>
        Serenity Care Partners<br/>
        {{providerAddress}}<br/>
        {{providerPhone}}
      </td>
    </tr>
    <tr>
      <td colspan="8">7. Goals/Rehabilitation Potential/Discharge Plans<br/>
        {{goals}}
      </td>
    </tr>
    <tr>
      <td colspan="8">10. Medications: Dose/Frequency/Route (N)ew (C)hanged<br/>
        {{medications}}
      </td>
    </tr>
    <tr>
      <td colspan="8">18. A. Functional Limitations<br/>
        {{functionalLimitations}}
      </td>
    </tr>
    <tr>
      <td colspan="8">18. B. Activities Permitted<br/>
        {{activitiesPermitted}}
      </td>
    </tr>
    <tr>
      <td colspan="8">21. Orders for Discipline and Treatments (Specify Amount/Frequency/Duration)<br/>
        {{orders}}
      </td>
    </tr>
    <tr>
      <td colspan="4">22. Goals/Rehabilitation Potential/Discharge Plans<br/>
        {{rehabPotential}}
      </td>
      <td colspan="4">23. Nurse's Signature and Date of Verbal SOC Where Applicable<br/>
        {{nurseSignature}} {{nurseSignDate}}
      </td>
    </tr>
    <tr>
      <td colspan="4">24. Physician's Name and Address<br/>
        {{physicianName}}<br/>
        {{physicianAddress}}
      </td>
      <td colspan="4">25. Date HHA Received Signed POT<br/>
        {{dateReceived}}
      </td>
    </tr>
    <tr>
      <td colspan="8">26. I certify/recertify that this patient is confined to his/her home and needs intermittent skilled nursing care, physical therapy and/or speech therapy or continues to need occupational therapy. The patient is under my care, and I have authorized the services on this plan of care and will periodically review the plan.<br/><br/>
        Physician's Signature: ___________________________________________________ Date: ______________
      </td>
    </tr>
  </table>
</body>
</html>
`;

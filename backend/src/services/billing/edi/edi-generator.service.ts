/**
 * EDI 837P Generator Service
 * Generates X12 837 Professional Claim files
 */

export interface EdiConfig {
    senderId: string;    // ISA06
    receiverId: string;  // ISA08
    controlNumber: number;
    isTest: boolean;     // ISA15 (T/P)
}

export interface EdiProvider {
    name: string;
    npi: string;
    taxId: string;
    address: string;
    city: string;
    state: string;
    zip: string;
}

export interface EdiSubscriber {
    firstName: string;
    lastName: string;
    memberId: string;
    dob: string; // YYYY-MM-DD
    gender: 'M' | 'F';
    address: string;
    city: string;
    state: string;
    zip: string;
}

export interface EdiServiceLine {
    procedureCode: string;
    chargeAmount: number;
    date: Date;
    units: number;
}

export interface EdiClaim {
    id: string;
    billingProvider: EdiProvider;
    subscriber: EdiSubscriber;
    payer: any; // Kept simple for now
    diagnoses: string[];
    services: EdiServiceLine[];
    totalCharge: number;
}

export class EdiGeneratorService {
    private config: EdiConfig;
    private segmentSeparator = '~';
    private elementSeparator = '*';
    private componentSeparator = ':';

    constructor(config: EdiConfig) {
        this.config = config;
    }

    /**
     * Main entry point to generate an 837P file content
     */
    public generate837P(claim: EdiClaim): string {
        const segments: string[] = [];

        // 1. Interchange Control Header (ISA)
        segments.push(this.generateISA());

        // 2. Functional Group Header (GS)
        segments.push(this.generateGS());

        // 3. Transaction Set Header (ST)
        segments.push(this.generateST());

        // 4. Loop 1000A: Submitter Name
        segments.push(this.generateLoop1000A());

        // 5. Loop 1000B: Receiver Name
        segments.push(this.generateLoop1000B());

        // 6. Loop 2000A: Billing Provider Hierarchy
        segments.push(this.generateLoop2000A(claim.billingProvider));

        // 7. Loop 2000B: Subscriber Hierarchy
        segments.push(this.generateLoop2000B(claim.subscriber));

        // 8. Loop 2300: Claim Information
        segments.push(this.generateLoop2300(claim));

        // 9. Loop 2400: Service Lines
        claim.services.forEach((service, index) => {
            segments.push(this.generateLoop2400(service, index + 1));
        });

        // Transaction Set Trailer (SE)
        segments.push(this.generateSE(segments.length - 2)); // -2 for ISA/GS

        // Functional Group Trailer (GE)
        segments.push(this.generateGE());

        // Interchange Control Trailer (IEA)
        segments.push(this.generateIEA());

        return segments.join(this.segmentSeparator) + this.segmentSeparator;
    }

    // --- Segment Generators ---

    private generateISA(): string {
        const d = new Date();
        const date = d.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
        const time = d.toTimeString().slice(0, 5).replace(/:/g, ''); // HHMM
        const usage = this.config.isTest ? 'T' : 'P';
        const control = this.pad(this.config.controlNumber, 9);

        // ISA*00*          *00*          *ZZ*SENDERID       *ZZ*RECEIVERID     *231206*2124*^*00501*000000001*0*T*:
        return `ISA*00*          *00*          *ZZ*${this.pad(this.config.senderId, 15)}*ZZ*${this.pad(this.config.receiverId, 15)}*${date}*${time}*^*00501*${control}*0*${usage}*${this.componentSeparator}`;
    }

    private generateGS(): string {
        const d = new Date();
        const date = d.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
        const time = d.toTimeString().slice(0, 5).replace(/:/g, ''); // HHMM
        const control = this.config.controlNumber;

        // GS*HC*SENDERID*RECEIVERID*20231206*2124*1*X*005010X222A1
        return `GS*HC*${this.config.senderId}*${this.config.receiverId}*${date}*${time}*${control}*X*005010X222A1`;
    }

    private generateST(): string {
        // ST*837*0001*005010X222A1
        return `ST*837*${this.pad(this.config.controlNumber, 4, '0')}*005010X222A1`;
    }

    private generateLoop1000A(): string {
        // NM1*41*2*SUBMITTER NAME*****46*SUBMITTERID
        return `NM1*41*2*SERENITY CARE PARTNERS*****46*${this.config.senderId}*${this.componentSeparator}PER*IC*BILLING DEPT*TE*5555555555`;
    }

    private generateLoop1000B(): string {
        // NM1*40*2*RECEIVER NAME*****46*RECEIVERID
        return `NM1*40*2*CHANGE HEALTHCARE*****46*${this.config.receiverId}`;
    }

    private generateLoop2000A(provider: EdiProvider): string {
        // HL*1**20*1 (Hierarchy Level: Billing Provider, Child=Yes)
        // NM1*85*2*ORG NAME*****XX*NPI
        const hl = `HL*1**20*1`;
        const nm1 = `NM1*85*2*${provider.name}*****XX*${provider.npi}`;
        const n3 = `N3*${provider.address}`;
        const n4 = `N4*${provider.city}*${provider.state}*${provider.zip}`;
        const ref = `REF*EI*${provider.taxId}`; // Employer ID
        return [hl, nm1, n3, n4, ref].join(this.segmentSeparator);
    }

    private generateLoop2000B(subscriber: EdiSubscriber): string {
        // HL*2*1*22*0 (Hierarchy Level: Subscriber, Parent=1, Child=No)
        // SBR*P*18*******CI (P=Primary, CI=Commercial)
        const hl = `HL*2*1*22*0`;
        const sbr = `SBR*P*18*******CI`;
        const nm1 = `NM1*IL*1*${subscriber.lastName}*${subscriber.firstName}****MI*${subscriber.memberId}`;
        const n3 = `N3*${subscriber.address}`;
        const n4 = `N4*${subscriber.city}*${subscriber.state}*${subscriber.zip}`;
        const dmg = `DMG*D8*${subscriber.dob.replace(/-/g, '')}*${subscriber.gender}`;
        return [hl, sbr, nm1, n3, n4, dmg].join(this.segmentSeparator);
    }

    private generateLoop2300(claim: EdiClaim): string {
        // CLM*CLAIMID*100***11:B:1*Y*A*Y*Y
        const clm = `CLM*${claim.id}*${claim.totalCharge.toFixed(2)}***11:B:1*Y*A*Y*Y`;

        // HI*BK:ICD10*BF:ICD10...
        const diagnoses = claim.diagnoses
            .map((code, i) => `${i === 0 ? 'BK' : 'BF'}:${code.replace('.', '')}`)
            .join('*');
        const hi = `HI*${diagnoses}`;

        return [clm, hi].join(this.segmentSeparator);
    }

    private generateLoop2400(service: EdiServiceLine, lineParams: number): string {
        // LX*LINE_NUMBER
        const lx = `LX*${lineParams}`;

        // SV1*HC:PROC:MOD*CHARGE*UN*QTY***1
        const sv1 = `SV1*HC:${service.procedureCode}*${service.chargeAmount.toFixed(2)}*UN*${service.units}***1`;

        // DTP*472*D8*DATE
        const date = service.date.toISOString().slice(0, 10).replace(/-/g, '');
        const dtp = `DTP*472*D8*${date}`;

        // REF*6R*LINE_ID (Line Item Control Number)
        const ref = `REF*6R*${lineParams}`;

        return [lx, sv1, dtp, ref].join(this.segmentSeparator);
    }

    private generateSE(segmentCount: number): string {
        // SE*TOTAL_SEGMENTS*CONTROL_NUMBER
        return `SE*${segmentCount + 1}*${this.pad(this.config.controlNumber, 4, '0')}`; // +1 for SE itself
    }

    private generateGE(): string {
        // GE*1*CONTROL_NUMBER
        return `GE*1*${this.config.controlNumber}`;
    }

    private generateIEA(): string {
        // IEA*1*CONTROL_NUMBER
        return `IEA*1*${this.pad(this.config.controlNumber, 9, '0')}`;
    }

    // --- Helpers ---

    private pad(str: string | number, length: number, char: string = ' '): string {
        str = String(str);
        if (str.length > length) return str.slice(0, length);
        if (char === ' ') return str.padEnd(length, char); // Text left aligned
        return str.padStart(length, char); // Numbers right aligned
    }
}

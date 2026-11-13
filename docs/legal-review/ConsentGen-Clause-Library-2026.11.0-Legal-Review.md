# ConsentGen — Approved Clause Library

## Legal Review Pack for Counsel

Clause library version: 2026.11.0    |    Current status: PENDING LEGAL REVIEW    |    Prepared: 2026-11-13

ConsentGen generates informed-consent forms for doctors in India. The legally significant wording of every form is fixed text, reproduced in full in this pack. An AI model does not write that wording. This document is for a qualified lawyer to review, correct and approve it. It is not legal advice and nothing in it has been approved yet.


### 1. What we are asking you to do

- Check every statute and regulation citation in Section 2 and tell us the correct reference for each.
- Review the fixed wording in Section 4 (both reading levels) and mark changes.
- Review the complete sample forms in Section 5 as a patient and a court would read them.
- Answer the questions in Section 7, which cover gaps we believe exist for specific consent types.
- Sign off in Section 8, or return the pack with required changes. We will not mark the library 'approved' in the software until you have signed off.

### 2. Priority: statute citations to verify

The wording was originally drawn from a forensic-medicine textbook that cites the Indian Penal Code (IPC) sections 87–92. The software later expressed these as Bharatiya Nyaya Sanhita (BNS) section numbers. We believe several BNS numbers in the software are wrong. Our understanding is that IPC 87–92 correspond to BNS 25–30, but we are not lawyers and have not verified this against the Act. Please confirm.

- Adult (18+) can consent to risk of harm
  - Software currently says: BNS §§24–25 (and §§24–27 in the capacity line)
  - Our understanding: IPC §87 → BNS §25. We believe §24 concerns intoxication.
  - Question: Cite §25 only?
- Child under 12 / person of unsound mind: guardian consent
  - Software currently says: BNS §§26–27
  - Our understanding: IPC §89 → BNS §27.
  - Question: Cite §27? Also confirm the position for patients aged 12–18.
- Emergency treatment without consent / implied consent (also used for road-accident forms)
  - Software currently says: BNS §29
  - Our understanding: IPC §92 → BNS §30. We believe §29 is a different provision (IPC §91).
  - Question: Cite §30?
- Consent vitiated by fear or misconception
  - Software currently says: BNS §27 (internal clause note)
  - Our understanding: IPC §90 → BNS §28.
  - Question: Cite §28?
- Authority to extend the procedure for unforeseen findings
  - Software currently says: BNS §26
  - Our understanding: Textbook calls this the 'extension doctrine' and grounds it in good-faith benefit and necessity.
  - Question: Which BNS section(s) properly support this clause?
- Right to withdraw consent
  - Software currently says: BNS §§24–30; Consumer Protection Act 2019
  - Our understanding: The Consumer Protection Act 2019 concerns deficiency in service and negligence. We are unsure it is the right source for a right to withdraw.
  - Question: Is this citation appropriate? What is the correct basis?
- General range
  - Software currently says: BNS §§24–30
  - Our understanding: Probably §§25–30 if the mapping above is right.
  - Question: Confirm the range.
Verified correct (checked against the gazette in the project): the MoRTH Cashless Treatment of Road Accident Victims Scheme 2025, notification S.O. 2489(E) dated 4 June 2025 under section 162 of the Motor Vehicles Act 1988 — cover up to Rs. 1.5 lakh per victim for a maximum of 7 days from the date of the accident; victims first hospitalised after 24 hours are not eligible. Counsel should still confirm the wording used on the form.


### 3. Clauses the software requires on every form

A programmatic check runs on every form generated and refuses to release it if a required clause is missing. The list below is that check.


#### Authorization  (Part B — Clause 1)

- Stated legal basis: Standard legal precedent — treating without consent is assault in law
- Requirement: Patient authorizes the named doctor and team to perform the specific named procedure only.
- Required for: all consent types
- Locked (cannot be removed by the doctor): no

#### Disclosure & Comprehension  (Part B — Clause 2)

- Stated legal basis: Legal precedent — all disclosures must be in language the patient understands; IMC Regulation 3.1
- Requirement: Procedure explained in the patient's own language. Counseling language must be recorded.
- Required for: all consent types
- Locked (cannot be removed by the doctor): no

#### Risks & Complications  (Part B — Clause 3)

- Stated legal basis: Standard Informed Consent element 5 — risks and benefits of both proposed and alternative procedures
- Requirement: Specific and general risks disclosed including unforeseen events requiring additional interventions.
- Required for: all consent types
- Locked (cannot be removed by the doctor): no

#### Alternatives to Treatment  (Part B — Clause 4)

- Stated legal basis: Standard Informed Consent element 4 — details of alternative treatment courses
- Requirement: Available alternatives and consequences of declining all treatment explained.
- Required for: all consent types
- Locked (cannot be removed by the doctor): no

#### Anaesthesia & Blood Transfusion  (Part B — Clause 5)

- Stated legal basis: Legal Rule 3 — consent form must include specific consent to anaesthesia; Rule 4 — blood transfusion requires express consent
- Requirement: Consent for anaesthesia and blood products if clinically necessary.
- Required for: surgical, anaesthesia, minor procedure, obstetric, blood transfusion, road accident emergency
- Locked (cannot be removed by the doctor): no

#### Disposal of Tissues  (Part B — Clause 6)

- Stated legal basis: Standard legal practice — pathological examination requires consent
- Requirement: Consent for pathological examination and disposal of removed tissues or specimens.
- Required for: surgical, obstetric, diagnostic
- Locked (cannot be removed by the doctor): no

#### Photography / Academic Use  (Part B — Clause 7)

- Stated legal basis: IMC Ethics Regulations — patient identity must remain confidential; Legal Rule 23
- Requirement: Optional consent for photography or video for educational purposes with identity confidentiality.
- Required for: surgical, diagnostic, research
- Locked (cannot be removed by the doctor): no

#### Voluntariness & Right to Withdraw  (Part B — Clause 8)

- Stated legal basis: Legal Rule 7 — consent must be free, voluntary, clear, intelligent; BNS §27 (Bharatiya Nyaya Sanhita) — fear vitiates consent
- Requirement: Consent given freely without coercion. Right to withdraw before procedure begins.
- Required for: all consent types
- Locked (cannot be removed by the doctor): yes

#### Capacity Validation  (Part B — Clause 9)

- Stated legal basis: BNS §24 (Bharatiya Nyaya Sanhita) — valid consent requires person above 18; BNS §26 — minor or insane cannot consent; BNS §27 — intoxicated consent invalid
- Requirement: Patient is of sound mind, not intoxicated, above 18 years. Guardian block activated otherwise.
- Required for: all consent types
- Locked (cannot be removed by the doctor): yes

#### Information Receipt  (Part B — Clause 10)

- Stated legal basis: Legal precedent — physicians have legal and ethical duty to provide all relevant information
- Requirement: Patient confirms they received adequate information and had opportunity to ask questions.
- Required for: all consent types
- Locked (cannot be removed by the doctor): no

#### Road Accident Emergency Clause  (Part B — Clause 11)

- Stated legal basis: MoRTH Gazette S.O.2489(E) June 2025 — Cashless Treatment of Road Accident Victims Scheme 2025; MV Act 1988 §162; BNS §29 (Bharatiya Nyaya Sanhita) emergency implied consent
- Requirement: Emergency treatment under MoRTH Scheme 2025. Coverage: ₹1.5 lakh per victim, 7 days from accident date.
- Required for: road accident emergency
- Locked (cannot be removed by the doctor): no

#### Signatures (Parts C & D)  (Parts C & D)

- Stated legal basis: Legal precedent — missing timestamp is a common loophole in negligence cases; Rule 3 — written consent must be witnessed
- Requirement: Patient, witness, guardian (if minor), and doctor signatures with exact date and time.
- Required for: all consent types
- Locked (cannot be removed by the doctor): yes

### 4. The fixed wording — two reading levels

Every form uses one of two tones. 'Plain' is used when the doctor selects plain English; 'Professional' is used for 'standard' and 'formal legal'. Both are shown below. Square brackets mark values filled in from the doctor's input.


#### Declarations and signatures — Professional tone


### 4. Declarations & Signatures


#### 4.1 Patient / Authorized Representative Declaration

> "I confirm that the nature, purpose, clinical benefits, potential risks and alternatives of the proposed procedure have been fully explained to me in English, which I understand. I have had adequate opportunity to ask questions, and all my queries have been satisfactorily addressed. I confirm that I am competent to grant consent, and I give my voluntary consent without coercion. I retain the statutory right to withdraw this consent at any time prior to the procedure without affecting my ongoing care (BNS §§24–30)."

- **Signature / Left Thumb Impression:** ___________________________
- **Name of Signatory:** [Patient Name] (Self)
- **Date & Time:** ____/____/________  ____:____ IST

#### 4.2 Attending Clinician / Operating Surgeon Declaration

> "I certify that I have explained the diagnosis, nature, purpose, material risks, expected benefits and alternatives of the procedure to the patient/guardian in English. I have answered all questions and verified comprehension prior to obtaining this consent."

- **Doctor's Signature & Seal:** ___________________________
- **Doctor Name & Council Reg. No.:** Dr. [Doctor Name] (Reg: [Council Reg. No.])
- **Date & Time:** ____/____/________  ____:____ IST

#### 4.3 Hospital Witness / Interpreter Declaration

> "I declare that this informed consent was explained and executed in my presence, and that the patient/guardian voluntarily confirmed understanding and affixed their signature/thumb impression."

- **Witness Signature:** ___________________________
- **Witness Name & Designation / Contact:** ___________________________
- **Date & Time:** ____/____/________  ____:____ IST

#### Declarations and signatures — Plain tone


### 4. Declarations & Signatures


#### 4.1 Patient / Authorized Representative Declaration

> "I confirm that the doctor has explained, in English which I understand, what the procedure is, why it is advised, its benefits, its risks and the other options. I had the chance to ask questions and my questions were answered. I am able to give consent and I give it freely, without pressure. I know I can withdraw this consent at any time before the procedure without affecting my care (BNS §§24–30)."

- **Signature / Left Thumb Impression:** ___________________________
- **Name of Signatory:** [Patient Name] (Self)
- **Date & Time:** ____/____/________  ____:____ IST

#### 4.2 Attending Clinician / Operating Surgeon Declaration

> "I certify that I have explained the diagnosis, the procedure, its purpose, the main risks, the expected benefits and the alternatives to the patient or guardian in English. I answered all questions and checked that they understood before taking this consent."

- **Doctor's Signature & Seal:** ___________________________
- **Doctor Name & Council Reg. No.:** Dr. [Doctor Name] (Reg: [Council Reg. No.])
- **Date & Time:** ____/____/________  ____:____ IST

#### 4.3 Hospital Witness / Interpreter Declaration

> "I declare that this informed consent was explained and executed in my presence, and that the patient/guardian voluntarily confirmed understanding and affixed their signature/thumb impression."

- **Witness Signature:** ___________________________
- **Witness Name & Designation / Contact:** ___________________________
- **Date & Time:** ____/____/________  ____:____ IST
The foreseeable-complications list, the emergency-judgment clause and the voluntariness/right-to-withdraw clause also exist in both tones; they appear in full inside the sample forms in Section 5.


### 5. Complete sample forms

These are produced by the software with placeholders in place of real data. The doctor's own risk and alternative wording appears verbatim. The AI is not involved in producing these samples.


#### 5.1 Surgical consent — Professional tone, adult patient


### 1. Procedure & Purpose of Treatment

- **Primary Diagnosis / Clinical Indication:** [Diagnosis]
- **Proposed Procedure:** [Procedure Name] (Scheduled Date: [Date])
- **Nature & Purpose:** The attending clinician has explained the nature of the proposed procedure, why it is advised, how it is performed and the benefit that is expected.
- **Anaesthesia & Monitoring:** The type of anaesthesia and the monitoring during the procedure have been explained; the final choice will be confirmed by the anaesthetist.
- **Counselling:** The procedure was explained to the patient in English, and the patient confirmed that they understood it.

### 2. Disclosed Risks & Potential Complications

- **Procedure-Specific Risks (disclosed by the clinician):**
  - [Risk 1 as stated by the clinician]
  - [Risk 2]
  - [Risk 3]
- **Foreseeable Surgical & Anaesthetic Complications:**
  - Bleeding, haemorrhage or haematoma formation, which may require blood transfusion.
  - Surgical-site or deep-space infection requiring antibiotics or re-exploration.
  - Adverse reaction to anaesthetic agents, analgesics or sedation.
  - Accidental injury to adjacent structures, nerves or blood vessels.
  - Cardiopulmonary stress, deep vein thrombosis, or unexpected extension of the procedure.
- **Emergency Medical Judgment:** If unforeseen findings or an acute emergency arise during the procedure, the patient authorises the attending medical team to give the necessary life-saving or urgent treatment in accordance with professional medical ethics (BNS §26).

### 3. Alternatives & Specific Authorizations

- **Alternatives Discussed:**
  - [Alternative 1]
  - [Alternative 2]
  - The risks of refusing or delaying treatment were also explained.
- **Authorization:** The patient authorises Dr. [Doctor Name] and the treating team to perform the named procedure only — [Procedure Name]. This is not a blanket consent.
- **Capacity:** The patient is an adult of sound mind and was not under the influence of any intoxicant when consenting (BNS §§24–27).
- **Voluntariness & Right to Withdraw:** Consent is given voluntarily, without duress, undue influence or misrepresentation. The patient retains the absolute statutory right to withdraw consent at any time before the procedure begins, without affecting ongoing standard care (BNS §§24–30; Consumer Protection Act 2019).
- **Specific Clinical Consents:**
  - Anaesthesia: Consented, if clinically indicated for this procedure.
  - Blood Transfusion: Consented, if it becomes clinically necessary.
  - Tissue / Specimen Examination & Disposal: Consented for pathological examination and safe disposal per hospital guidelines.
  - Photography / Academic Use: Consented for medical records and scientific review, with the patient's identity kept confidential.

### 4. Declarations & Signatures


#### 4.1 Patient / Authorized Representative Declaration

> "I confirm that the nature, purpose, clinical benefits, potential risks and alternatives of the proposed procedure have been fully explained to me in English, which I understand. I have had adequate opportunity to ask questions, and all my queries have been satisfactorily addressed. I confirm that I am competent to grant consent, and I give my voluntary consent without coercion. I retain the statutory right to withdraw this consent at any time prior to the procedure without affecting my ongoing care (BNS §§24–30)."

- **Signature / Left Thumb Impression:** ___________________________
- **Name of Signatory:** [Patient Name] (Self)
- **Date & Time:** ____/____/________  ____:____ IST

#### 4.2 Attending Clinician / Operating Surgeon Declaration

> "I certify that I have explained the diagnosis, nature, purpose, material risks, expected benefits and alternatives of the procedure to the patient/guardian in English. I have answered all questions and verified comprehension prior to obtaining this consent."

- **Doctor's Signature & Seal:** ___________________________
- **Doctor Name & Council Reg. No.:** Dr. [Doctor Name] (Reg: [Council Reg. No.])
- **Date & Time:** ____/____/________  ____:____ IST

#### 4.3 Hospital Witness / Interpreter Declaration

> "I declare that this informed consent was explained and executed in my presence, and that the patient/guardian voluntarily confirmed understanding and affixed their signature/thumb impression."

- **Witness Signature:** ___________________________
- **Witness Name & Designation / Contact:** ___________________________
- **Date & Time:** ____/____/________  ____:____ IST

---


#### 5.2 Surgical consent — Plain English, minor patient with guardian


### 1. Procedure & Purpose of Treatment

- **Primary Diagnosis / Clinical Indication:** [Diagnosis]
- **Proposed Procedure:** [Procedure Name] (Scheduled Date: [Date])
- **Nature & Purpose:** The attending clinician has explained the nature of the proposed procedure, why it is advised, how it is performed and the benefit that is expected.
- **Anaesthesia & Monitoring:** The type of anaesthesia and the monitoring during the procedure have been explained; the final choice will be confirmed by the anaesthetist.
- **Counselling:** The procedure was explained to the patient in English, and the patient confirmed that they understood it.

### 2. Disclosed Risks & Potential Complications

- **Procedure-Specific Risks (disclosed by the clinician):**
  - [Risk 1 as stated by the clinician]
  - [Risk 2]
  - [Risk 3]
- **Foreseeable Surgical & Anaesthetic Complications:**
  - Bleeding, which may sometimes need a blood transfusion.
  - Infection of the wound or deeper tissues, which may need antibiotics or another operation.
  - A bad reaction to the anaesthesia, pain medicines or sedation.
  - Accidental injury to nearby organs, nerves or blood vessels.
  - Strain on the heart or lungs, blood clots in the legs, or the procedure having to be extended.
- **Emergency Medical Judgment:** If something unexpected happens during the procedure, or an emergency develops, I allow the medical team to give the urgent or life-saving treatment that is needed, in line with medical ethics (BNS §26).

### 3. Alternatives & Specific Authorizations

- **Alternatives Discussed:**
  - [Alternative 1]
  - [Alternative 2]
  - The risks of refusing or delaying treatment were also explained.
- **Authorization:** The patient authorises Dr. [Doctor Name] and the treating team to perform the named procedure only — [Procedure Name]. This is not a blanket consent.
- **Capacity:** The patient is a minor or is not competent to consent. Consent is given by the guardian, [Guardian Name] ([Relationship]) (BNS §§26–27).
- **Voluntariness & Right to Withdraw:** This consent is given freely, without pressure or false promises. The patient can change their mind and withdraw consent at any time before the procedure starts, and their ongoing care will not be affected (BNS §§24–30; Consumer Protection Act 2019).
- **Specific Clinical Consents:**
  - Anaesthesia: Consented, if clinically indicated for this procedure.
  - Blood Transfusion: Consented, if it becomes clinically necessary.
  - Tissue / Specimen Examination & Disposal: Consented for pathological examination and safe disposal per hospital guidelines.
  - Photography / Academic Use: Consented for medical records and scientific review, with the patient's identity kept confidential.

### 4. Declarations & Signatures


#### 4.1 Patient / Authorized Representative Declaration

> "I confirm that the doctor has explained, in English which I understand, what the procedure is, why it is advised, its benefits, its risks and the other options. I had the chance to ask questions and my questions were answered. I am able to give consent and I give it freely, without pressure. I know I can withdraw this consent at any time before the procedure without affecting my care (BNS §§24–30)."

- **Signature / Left Thumb Impression:** ___________________________
- **Name of Signatory:** [Patient Name] (Guardian: [Guardian Name], [Relationship])
- **Date & Time:** ____/____/________  ____:____ IST

#### 4.2 Attending Clinician / Operating Surgeon Declaration

> "I certify that I have explained the diagnosis, the procedure, its purpose, the main risks, the expected benefits and the alternatives to the patient or guardian in English. I answered all questions and checked that they understood before taking this consent."

- **Doctor's Signature & Seal:** ___________________________
- **Doctor Name & Council Reg. No.:** Dr. [Doctor Name] (Reg: [Council Reg. No.])
- **Date & Time:** ____/____/________  ____:____ IST

#### 4.3 Hospital Witness / Interpreter Declaration

> "I declare that this informed consent was explained and executed in my presence, and that the patient/guardian voluntarily confirmed understanding and affixed their signature/thumb impression."

- **Witness Signature:** ___________________________
- **Witness Name & Designation / Contact:** ___________________________
- **Date & Time:** ____/____/________  ____:____ IST

---


#### 5.3 Road-accident emergency consent


### 1. Procedure & Purpose of Treatment

- **Primary Diagnosis / Clinical Indication:** [Diagnosis]
- **Proposed Procedure:** [Procedure Name] (Scheduled Date: [Date])
- **Nature & Purpose:** The attending clinician has explained the nature of the proposed procedure, why it is advised, how it is performed and the benefit that is expected.
- **Anaesthesia & Monitoring:** The type of anaesthesia and the monitoring during the procedure have been explained; the final choice will be confirmed by the anaesthetist.
- **Counselling:** The procedure was explained to the patient in English, and the patient confirmed that they understood it.

### 2. Disclosed Risks & Potential Complications

- **Procedure-Specific Risks (disclosed by the clinician):**
  - [Risk 1 as stated by the clinician]
  - [Risk 2]
  - [Risk 3]
- **Foreseeable Surgical & Anaesthetic Complications:**
  - Bleeding, haemorrhage or haematoma formation, which may require blood transfusion.
  - Surgical-site or deep-space infection requiring antibiotics or re-exploration.
  - Adverse reaction to anaesthetic agents, analgesics or sedation.
  - Accidental injury to adjacent structures, nerves or blood vessels.
  - Cardiopulmonary stress, deep vein thrombosis, or unexpected extension of the procedure.
- **Emergency Medical Judgment:** If unforeseen findings or an acute emergency arise during the procedure, the patient authorises the attending medical team to give the necessary life-saving or urgent treatment in accordance with professional medical ethics (BNS §26).

### 3. Alternatives & Specific Authorizations

- **Alternatives Discussed:**
  - [Alternative 1]
  - [Alternative 2]
  - The risks of refusing or delaying treatment were also explained.
- **Authorization:** The patient authorises Dr. [Doctor Name] and the treating team to perform the named procedure only — [Procedure Name]. This is not a blanket consent.
- **Capacity:** The patient is an adult of sound mind and was not under the influence of any intoxicant when consenting (BNS §§24–27).
- **Voluntariness & Right to Withdraw:** Consent is given voluntarily, without duress, undue influence or misrepresentation. The patient retains the absolute statutory right to withdraw consent at any time before the procedure begins, without affecting ongoing standard care (BNS §§24–30; Consumer Protection Act 2019).
- **Specific Clinical Consents:**
  - Anaesthesia: Consented, if clinically indicated for this procedure.
  - Blood Transfusion: Consented, if it becomes clinically necessary.
  - Tissue / Specimen Examination & Disposal: Consented for pathological examination and safe disposal per hospital guidelines.
  - Photography / Academic Use: Consented for medical records and scientific review, with the patient's identity kept confidential.
- **Road Accident Emergency (MoRTH Gazette S.O. 2489(E), June 2025):** Emergency treatment is being provided under the Cashless Treatment of Road Accident Victims Scheme 2025 (cover up to Rs. 1,50,000 per victim for a maximum of 7 days from the date of the accident). eDAR Victim ID: Pending — police to generate on the eDAR application. NHA TMS Patient ID: Pending — hospital to generate on the TMS portal. Where the patient cannot consent, treatment proceeds on implied emergency consent to save life (BNS §29; Motor Vehicles Act 1988 §162).

### 4. Declarations & Signatures


#### 4.1 Patient / Authorized Representative Declaration

> "I confirm that the nature, purpose, clinical benefits, potential risks and alternatives of the proposed procedure have been fully explained to me in English, which I understand. I have had adequate opportunity to ask questions, and all my queries have been satisfactorily addressed. I confirm that I am competent to grant consent, and I give my voluntary consent without coercion. I retain the statutory right to withdraw this consent at any time prior to the procedure without affecting my ongoing care (BNS §§24–30)."

- **Signature / Left Thumb Impression:** ___________________________
- **Name of Signatory:** [Patient Name] (Self)
- **Date & Time:** ____/____/________  ____:____ IST

#### 4.2 Attending Clinician / Operating Surgeon Declaration

> "I certify that I have explained the diagnosis, nature, purpose, material risks, expected benefits and alternatives of the procedure to the patient/guardian in English. I have answered all questions and verified comprehension prior to obtaining this consent."

- **Doctor's Signature & Seal:** ___________________________
- **Doctor Name & Council Reg. No.:** Dr. [Doctor Name] (Reg: [Council Reg. No.])
- **Date & Time:** ____/____/________  ____:____ IST

#### 4.3 Hospital Witness / Interpreter Declaration

> "I declare that this informed consent was explained and executed in my presence, and that the patient/guardian voluntarily confirmed understanding and affixed their signature/thumb impression."

- **Witness Signature:** ___________________________
- **Witness Name & Designation / Contact:** ___________________________
- **Date & Time:** ____/____/________  ____:____ IST

---


#### 5.4 Research consent (ICMR)


### 1. Study Purpose & Procedures

- **Purpose of the study:** [Purpose as written by the investigator]
- **Procedures & data to be collected:** [Data and procedures as written by the investigator]
- **Estimated time required:** [Time]
- **Counselling:** The study was explained in English, and the participant confirmed that they understood it.

### 2. Disclosed Risks, Benefits & Data Confidentiality

- **Foreseeable risks:** [Risks as written by the investigator]
- **Anticipated benefits:** [Benefits] (Monetary: [Monetary benefits])
- **Confidentiality:** The participant's identity and research data will be kept strictly confidential, anonymised, and stored securely in line with the ICMR ethical guidelines (2018).

### 3. Voluntary Participation & Right to Withdraw

- **Capacity:** The participant is an adult of sound mind (BNS §§24–27).
- **Voluntariness:** Participation is entirely voluntary.
- **Right to withdraw:** The participant may withdraw consent and stop taking part at any stage, without penalty, prejudice, or loss of standard medical or institutional entitlements (ICMR 2018; BNS §§24–27).

### 4. Declarations & Signatures


#### 4.1 Participant / Authorized Representative Declaration

> "I have read and understood the study procedures, foreseeable risks, potential benefits and the voluntary nature of participation, in English. All my questions have been clarified satisfactorily. I voluntarily agree to participate in this study."

- **Participant Signature:** ___________________________
- **Name of Signatory:** [Participant Name] (Self)
- **Date & Time:** ____/____/________  ____:____ IST

#### 4.2 Principal Investigator / Researcher Declaration

> "I certify that I have explained the study purpose, procedures, foreseeable risks, benefits and data-confidentiality safeguards to the participant/guardian in English, and have answered all questions before obtaining voluntary written consent."

- **Researcher Signature:** ___________________________
- **Principal Investigator:** [Principal Investigator] ([Department])
- **Date & Time:** ____/____/________  ____:____ IST

#### 4.3 Independent Witness / Ethics Coordinator Declaration

> "I declare that this informed consent was explained and executed in my presence, and that the participant/guardian voluntarily confirmed understanding and affixed their signature/thumb impression."

- **Witness Signature:** ___________________________
- **Witness Name & Contact:** ___________________________
- **Date & Time:** ____/____/________  ____:____ IST

### 6. Exactly what the AI does

- It never writes the clause wording shown above.
- It restates the doctor's own typed risks and alternatives in clearer language, one item per line, and is instructed to add nothing. If it returns nothing usable, the doctor's own words are used unchanged.
- If the doctor gives no alternatives, standard ones are inserted and the form says 'standard alternatives — the attending clinician to confirm'.
- It writes a short plain-language explanation of the procedure (3–4 sentences) from the procedure name and diagnosis. QUESTION: is an AI-written description of a procedure acceptable on a consent form, or must the doctor supply or approve it?
- For patients counselled in another language it translates the finished English form into one of 12 languages: Hindi, Kannada, Tamil, Telugu, Marathi, Bengali, Gujarati, Malayalam, Punjabi, Odia, Urdu. The translation is machine-generated and has NOT been reviewed by a medical translator in any language. We tested one Hindi translation for structure only (headings, signature lines and dates preserved), not for meaning.
- Free text typed by doctors cannot add sections, change the headings or inject instructions: the software strips control tokens, HTML and heading syntax from every field before use.

### 7. Questions and suspected gaps

- Q1. Separate consents. Anaesthesia and blood transfusion are lines inside a single procedure consent. The textbook says the consent form should include specific consent to anaesthesia and that blood transfusion needs express consent. Is a line inside one form enough, or should these be separately signed?
- Q2. Psychiatric consent type. It uses generic wording. Does the Mental Healthcare Act 2017 (nominated representative, advance directive, capacity assessment) require specific wording we are missing?
- Q3. Obstetric consent. It uses generic wording. Are there requirements under the MTP Act or other law that must appear?
- Q4. Telemedicine consent. It uses generic wording. Do the Telemedicine Practice Guidelines 2020 require specific disclosures or records?
- Q5. Research consent. ICMR 2018 expects, among other things, ethics-committee details and contact, compensation for research-related injury, and (in some studies) audio-visual recording of consent. The research form currently has none of these. What must be added?
- Q6. Minors. The form treats anyone who is not 'competent' as needing a guardian. How should patients aged 12–18 be handled, and who may sign for an incapacitated adult with no guardian present?
- Q7. Emergency consent. Are the emergency and extension-of-procedure sentences adequate, and are they placed where a court would expect them?
- Q8. Thumb impression and witness. Is a left-thumb impression with one witness sufficient for patients who cannot sign? Should the interpreter be identified separately?
- Q9. Electronic signing. Before we add digital signing: what is needed for a signature, OTP confirmation or thumb capture on a phone to be legally sound and admissible?
- Q10. Data. Each form is stored with the patient's name, date of birth and procedure. What notice and consent does the Digital Personal Data Protection Act 2023 require, and for how long must we retain forms?
- Q11. Aadhaar. The form header shows only XXXX-XXXX plus the last four digits. Is collecting even the last four digits acceptable for a private hospital?
- Q12. Disclaimer. What notice should appear on or alongside the form to make clear that the treating doctor must review it before use?
- Q13. Claims. May the product describe forms as 'compliant' with IMC 2002, BNS, ICMR and DPDP? What wording is safe in marketing?

### 8. Sign-off

Reviewer name: ______________________________    Bar Council enrolment no.: ______________________

Date: ________________    Decision (circle):   APPROVED   /   APPROVED WITH CHANGES   /   NOT APPROVED

Changes required: ____________________________________________________________________________

Signature: ______________________________


#### Language reviewers (each language needs a medically literate native speaker)

- Hindi — reviewer: ______________________   date: ____________   result: ____________
- Kannada — reviewer: ______________________   date: ____________   result: ____________
- Tamil — reviewer: ______________________   date: ____________   result: ____________
- Telugu — reviewer: ______________________   date: ____________   result: ____________
- Marathi — reviewer: ______________________   date: ____________   result: ____________
- Bengali — reviewer: ______________________   date: ____________   result: ____________
- Gujarati — reviewer: ______________________   date: ____________   result: ____________
- Malayalam — reviewer: ______________________   date: ____________   result: ____________
- Punjabi — reviewer: ______________________   date: ____________   result: ____________
- Odia — reviewer: ______________________   date: ____________   result: ____________
- Urdu — reviewer: ______________________   date: ____________   result: ____________
After sign-off, the engineering team changes CLAUSE_LIBRARY_STATUS to "approved" and records the new version. Every saved form already stores the library version that produced it.


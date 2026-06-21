export interface ProcedureEntry {
  name: string;
  risks: string;
}

export const PROCEDURE_LIBRARY: ProcedureEntry[] = [
  {
    name: "Laparoscopic Cholecystectomy",
    risks: "Bleeding, infection, bile leak, injury to common bile duct, injury to adjacent organs (bowel, liver), conversion to open surgery, port-site hernia, anaesthetic risks, deep vein thrombosis, retained stones in bile duct, post-cholecystectomy syndrome.",
  },
  {
    name: "Appendicectomy (Open / Laparoscopic)",
    risks: "Bleeding, wound infection, intra-abdominal abscess, injury to adjacent structures (bowel, ureter, iliac vessels), conversion to open surgery (if laparoscopic), stump leak, adhesive bowel obstruction, anaesthetic risks.",
  },
  {
    name: "Hernia Repair (Inguinal / Umbilical)",
    risks: "Bleeding, wound infection, recurrence of hernia, injury to vas deferens or testicular vessels (inguinal), chronic groin pain, mesh migration or infection, injury to adjacent nerves, urinary retention, anaesthetic risks.",
  },
  {
    name: "Total Knee Replacement (TKR)",
    risks: "Deep vein thrombosis, pulmonary embolism, infection (superficial and deep including periprosthetic joint infection), implant loosening or failure, stiffness, nerve or vessel injury, leg length discrepancy, continued pain, need for revision surgery, anaesthetic risks.",
  },
  {
    name: "Total Hip Replacement (THR)",
    risks: "Deep vein thrombosis, pulmonary embolism, dislocation, infection (including periprosthetic), implant loosening, nerve injury (sciatic nerve palsy), leg length discrepancy, heterotopic ossification, need for revision, anaesthetic risks.",
  },
  {
    name: "Coronary Artery Bypass Graft (CABG)",
    risks: "Myocardial infarction, stroke, bleeding requiring re-exploration, arrhythmias, deep sternal wound infection, renal failure, pulmonary complications, graft failure, cognitive changes, death.",
  },
  {
    name: "Percutaneous Coronary Intervention (PCI / Angioplasty)",
    risks: "Contrast allergy or nephropathy, bleeding at access site, arteriovenous fistula or pseudoaneurysm, coronary dissection or perforation, stent thrombosis, restenosis, emergency CABG, stroke, cardiac arrhythmias, myocardial infarction, death.",
  },
  {
    name: "Cataract Surgery (Phacoemulsification)",
    risks: "Posterior capsule rupture, vitreous loss, dropped nucleus, retinal detachment, endophthalmitis, corneal decompensation, posterior capsule opacification, refractive error, cystoid macular oedema, worsening of pre-existing conditions.",
  },
  {
    name: "Caesarean Section (LSCS)",
    risks: "Bleeding requiring transfusion, infection (wound, uterine, urinary), injury to bladder or bowel, anaesthetic complications, thromboembolism, wound dehiscence, placenta praevia or accreta in future pregnancies, longer recovery, increased risk in subsequent deliveries.",
  },
  {
    name: "Hysterectomy (Total Abdominal / Laparoscopic)",
    risks: "Bleeding, infection, injury to ureter, bladder or bowel, vault prolapse, ovarian failure (if oophorectomy performed), early menopause, fistula formation, conversion to open surgery, anaesthetic risks, thromboembolism.",
  },
  {
    name: "Thyroidectomy (Total / Hemithyroidectomy)",
    risks: "Bleeding / haematoma (may cause airway compromise), hypocalcaemia (temporary or permanent), recurrent laryngeal nerve injury (hoarseness or voice change), hypothyroidism, wound infection, scar, rare risk of superior laryngeal nerve injury, anaesthetic risks.",
  },
  {
    name: "Mastectomy (Simple / Modified Radical)",
    risks: "Bleeding, wound infection, seroma, lymphoedema, nerve damage (numbness / altered sensation), shoulder stiffness, scar contracture, anaesthetic risks, psychological impact, skin flap necrosis.",
  },
  {
    name: "Colonoscopy (Diagnostic / Therapeutic)",
    risks: "Perforation of colon, bleeding (especially post-polypectomy), incomplete examination, missed lesions, post-procedure abdominal discomfort, sedation risks, aspiration, rare bacteraemia.",
  },
  {
    name: "Upper GI Endoscopy (OGD / UGIE)",
    risks: "Perforation of oesophagus or stomach (especially during therapeutic procedures), bleeding, aspiration, adverse reaction to sedation, missed lesions, sore throat, dental injury.",
  },
  {
    name: "Endoscopic Retrograde Cholangiopancreatography (ERCP)",
    risks: "Post-ERCP pancreatitis (most common), bleeding, perforation, cholangitis, basket impaction, anaesthetic risks, contrast allergy, incomplete bile duct clearance, stent migration.",
  },
  {
    name: "Coronary Angiography (Diagnostic)",
    risks: "Contrast nephropathy, allergic reaction, arterial access complications (haematoma, pseudoaneurysm), arrhythmias, stroke, myocardial infarction, coronary dissection, radiation exposure, rare risk of death.",
  },
  {
    name: "Lumbar Discectomy / Microdiscectomy",
    risks: "Infection (wound, discitis), dural tear and CSF leak, nerve root injury, recurrent disc prolapse, incomplete relief of symptoms, anaesthetic risks, deep vein thrombosis, post-operative haematoma, failed back surgery syndrome.",
  },
  {
    name: "Transurethral Resection of Prostate (TURP)",
    risks: "TURP syndrome (hyponatraemia), bleeding requiring transfusion, retrograde ejaculation (very common), urinary incontinence, urethral stricture, bladder neck contracture, erectile dysfunction, urinary tract infection, anaesthetic risks.",
  },
  {
    name: "Percutaneous Nephrolithotomy (PCNL)",
    risks: "Bleeding requiring transfusion or embolisation, injury to adjacent organs (pleura, bowel, spleen), infection / urosepsis, incomplete stone clearance, need for further procedures, urine leak, anaesthetic risks.",
  },
  {
    name: "Renal Transplantation",
    risks: "Surgical: bleeding, thrombosis of renal vessels, urine leak, lymphocele. Medical: acute rejection, chronic allograft nephropathy, opportunistic infections (CMV, fungal, TB), post-transplant malignancy, drug toxicity (calcineurin inhibitors), anaesthetic risks.",
  },
  {
    name: "Liver Transplantation",
    risks: "Primary non-function, hepatic artery or portal vein thrombosis, biliary complications (leak, stricture), acute and chronic rejection, opportunistic infections, post-transplant lymphoproliferative disorder, recurrence of original disease, anaesthetic and intensive care risks.",
  },
  {
    name: "Craniotomy (Brain Tumour Resection)",
    risks: "Neurological deficit (motor, sensory, speech, vision), bleeding / haematoma, infection (wound, meningitis, abscess), cerebral oedema, seizures, incomplete tumour removal, CSF leak, anaesthetic risks, deep vein thrombosis, death.",
  },
  {
    name: "Spinal Fusion (Cervical / Lumbar)",
    risks: "Infection, hardware failure or migration, adjacent segment disease, nerve root or spinal cord injury, pseudoarthrosis (non-union), dural tear, dysphagia (cervical), anaesthetic risks, deep vein thrombosis.",
  },
  {
    name: "Tonsillectomy (± Adenoidectomy)",
    risks: "Primary haemorrhage (within 24 hours), secondary haemorrhage (5–10 days), infection, pain, dehydration, anaesthetic risks, rare velopharyngeal insufficiency, dental injury.",
  },
  {
    name: "Myringotomy with Grommet Insertion",
    risks: "Anaesthetic risks (general anaesthesia in children), persistent perforation after grommet extrusion, early extrusion, blockage, otorrhoea, tympanosclerosis, hearing unchanged.",
  },
  {
    name: "Rhinoplasty / Septoplasty",
    risks: "Bleeding (epistaxis), infection, septal haematoma, septal perforation, altered sensation, asymmetry, unsatisfactory cosmetic result, anaesthetic risks.",
  },
  {
    name: "Tooth Extraction (Simple / Surgical)",
    risks: "Bleeding, infection, dry socket (alveolar osteitis), nerve injury (inferior alveolar nerve — numbness of lip / chin), damage to adjacent teeth, jaw fracture (rare), oro-antral fistula (upper molars), incomplete removal requiring repeat procedure.",
  },
  {
    name: "Bone Marrow Biopsy / Aspiration",
    risks: "Pain at biopsy site, bleeding, infection, injury to adjacent structures (rare), inadequate sample requiring repeat procedure.",
  },
  {
    name: "Liver Biopsy (Percutaneous)",
    risks: "Pain, bleeding (intrahepatic haematoma, haemoperitoneum), bile peritonitis, infection, pneumothorax (right-sided approach), inadequate sample, risk of tumour seeding (in malignancy).",
  },
  {
    name: "Renal Biopsy (Percutaneous)",
    risks: "Pain, perirenal haematoma, haematuria (usually self-limiting), arteriovenous fistula, infection, need for embolisation or nephrectomy in severe bleeding, inadequate sample.",
  },
  {
    name: "Central Venous Line Insertion",
    risks: "Arterial puncture, haematoma, pneumothorax (subclavian / internal jugular), haemothorax, air embolism, catheter malposition, catheter-related bloodstream infection, thrombosis.",
  },
  {
    name: "Endotracheal Intubation",
    risks: "Failed intubation, oesophageal intubation, dental / lip injury, laryngospasm, laryngeal oedema, aspiration, vocal cord injury, post-extubation hoarseness or stridor.",
  },
  {
    name: "Blood Transfusion",
    risks: "Febrile non-haemolytic reaction, allergic reaction (urticaria to anaphylaxis), acute or delayed haemolytic reaction (ABO incompatibility), transfusion-related acute lung injury (TRALI), transfusion-associated circulatory overload (TACO), infection transmission (extremely rare with modern screening), transfusion-associated graft-versus-host disease (rare).",
  },
  {
    name: "Chemotherapy (General)",
    risks: "Myelosuppression (anaemia, neutropenia, thrombocytopenia), nausea and vomiting, alopecia, mucositis, peripheral neuropathy, cardiotoxicity (anthracyclines), nephrotoxicity (cisplatin), infertility, secondary malignancy, fatigue, infection.",
  },
  {
    name: "Radiation Therapy",
    risks: "Acute: skin reaction, fatigue, mucositis, nausea. Late: fibrosis, lymphoedema, bowel complications, secondary malignancy, radiation pneumonitis (chest), cognitive effects (brain). Site-specific risks apply.",
  },
  {
    name: "Electroconvulsive Therapy (ECT)",
    risks: "Anaesthetic risks, memory impairment (short-term and rarely long-term), confusion post-procedure, headache, muscle aches, fractures (rare with adequate muscle relaxation), cardiovascular stress, dental injury.",
  },
  {
    name: "Caesarean Hysterectomy",
    risks: "Life-threatening haemorrhage, injury to bladder, ureter, or bowel, deep vein thrombosis, pulmonary embolism, infection, loss of fertility, anaesthetic risks, prolonged recovery, intensive care admission.",
  },
  {
    name: "Laparotomy (Exploratory)",
    risks: "Bleeding, wound infection, burst abdomen, adhesions and bowel obstruction, injury to adjacent organs, incisional hernia, prolonged ileus, anaesthetic risks, intensive care requirements.",
  },
  {
    name: "Skin Biopsy (Punch / Excisional)",
    risks: "Bleeding, infection, scarring, wound dehiscence, incomplete excision, local anaesthetic allergy (rare), failure to establish diagnosis.",
  },
  {
    name: "Lumbar Puncture (Spinal Tap)",
    risks: "Post-dural puncture headache (most common), back pain, bleeding (epidural haematoma — rare), infection (meningitis — very rare), herniation in raised intracranial pressure, unsuccessful procedure requiring repeat.",
  },
  {
    name: "Cardiac Pacemaker Implantation",
    risks: "Lead dislodgement, pocket haematoma or infection, pneumothorax, cardiac perforation (rare), pacemaker malfunction, venous thrombosis, pacemaker syndrome, skin erosion, need for generator change.",
  },
];

export function searchProcedures(query: string): ProcedureEntry[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return PROCEDURE_LIBRARY.filter((p) =>
    p.name.toLowerCase().includes(q)
  ).slice(0, 6);
}

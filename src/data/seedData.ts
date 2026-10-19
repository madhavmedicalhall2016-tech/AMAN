import { MedicineItem, User, ShopSettings, Order } from '../types';

export const INITIAL_SHOP_SETTINGS: ShopSettings = {
  shopName: 'MADHAV MEDICAL HALL',
  tagline: 'Your Trusted Health Companion',
  taglineHi: 'आपके स्वास्थ्य का भरोसेमंद साथी',
  address: 'Chanman, Baheri',
  locality: 'Baheri',
  city: 'Darbhanga',
  state: 'Bihar',
  pinCode: '847101',
  phone: '9122260360',
  whatsapp: '9122260360',
  email: 'madhavmedicalhall2016@gmail.com',
  openingHours: '7:00 AM - 10:00 PM (All 7 Days)',
  openingHoursHi: 'सुबह 7:00 बजे से रात 10:00 बजे तक (सातों दिन)',
  gstNumber: '10ABCDE1234F1Z5',
  dlNumber: 'BR-DAR-2016-104928',
  standardDeliveryFee: 30,
  freeDeliveryThreshold: 499,
  allowHomeDelivery: true,
  allowStorePickup: true,
  deliveryAreas: [
    'Baheri Bazar',
    'Chanman',
    'Paghari',
    'Athar',
    'Inai',
    'Gangdaha',
    'Haflaganj',
    'Shibrampur',
    'Shivaji Nagar border',
    'Benipur Link'
  ]
};

export const INITIAL_USERS: User[] = [
  {
    id: 'user_admin_owner',
    name: 'Madhav Medical Hall Owner (Single Admin)',
    email: 'madhavmedicalhall2016@gmail.com',
    phone: '9122260360',
    role: 'admin',
    isApproved: true,
    addedByAdmin: true,
    addresses: [],
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'user_del_1',
    name: 'Ramesh Kumar (Baheri Express)',
    email: 'delivery@madhavmedical.com',
    phone: '9876543210',
    role: 'delivery',
    isApproved: true,
    addedByAdmin: true,
    deliveryArea: 'Baheri Bazar & Chanman Local',
    addresses: [],
    createdAt: '2024-02-15T00:00:00.000Z'
  },
  {
    id: 'user_cust_1',
    name: 'Amit Sharma',
    email: 'customer@gmail.com',
    phone: '9801234567',
    role: 'customer',
    isApproved: true,
    addresses: [
      {
        id: 'addr_1',
        label: 'Home',
        fullAddress: 'Ward No. 04, Near Shiv Mandir, Main Road',
        locality: 'Chanman, Baheri',
        pinCode: '847101',
        landmark: 'Near Shiv Mandir',
        lat: 25.9612,
        lng: 85.9912,
        isDefault: true
      }
    ],
    createdAt: '2024-03-10T00:00:00.000Z'
  }
];

// Deduce medicine category, composition, prescription requirement
export function enrichMedicineData(
  code: string,
  rawName: string,
  rawCompany: string,
  stock: number,
  mrp: number,
  pur_rate: number,
  rate: number,
  unit: string,
  rackno: string,
  index: number
): MedicineItem {
  const nameUpper = rawName.toUpperCase();
  const companyUpper = (rawCompany || '').toUpperCase();
  
  let category = 'Syrups & Tonics';
  let genericComposition = 'Herbal / Multivitamin Formulation';
  let isPrescriptionRequired = false;

  // Categorization heuristics
  if (
    nameUpper.includes('PARAZET') ||
    nameUpper.includes('CALPOL') ||
    nameUpper.includes('DOLO') ||
    nameUpper.includes('BRUFEN') ||
    nameUpper.includes('COMBIFLAM') ||
    nameUpper.includes('ZERODOL') ||
    nameUpper.includes('FLEXON') ||
    nameUpper.includes('NISE') ||
    nameUpper.includes('NIMULID') ||
    nameUpper.includes('DART') ||
    nameUpper.includes('ANAFORTAN') ||
    nameUpper.includes('MEFTAL') ||
    nameUpper.includes('DILONA') ||
    nameUpper.includes('OXALGIN') ||
    nameUpper.includes('ACEFEN') ||
    nameUpper.includes('ACETATE P') ||
    nameUpper.includes('ACETATE SPAS') ||
    nameUpper.includes('ACYCLOSURE') ||
    nameUpper.includes('DICLO') ||
    nameUpper.includes('ACECLO') ||
    nameUpper.includes('NIMESULIDE') ||
    nameUpper.includes('TRAMADOL')
  ) {
    category = 'Fever & Pain Relief';
    if (nameUpper.includes('PARAZET') || nameUpper.includes('CALPOL') || nameUpper.includes('DOLO')) {
      genericComposition = 'Paracetamol IP (500mg/650mg)';
    } else if (nameUpper.includes('ZERODOL') || nameUpper.includes('FENAK') || nameUpper.includes('ALDIGESIC') || nameUpper.includes('ACYCLOSURE')) {
      genericComposition = 'Aceclofenac + Paracetamol / Serratiopeptidase';
    } else if (nameUpper.includes('COMBIFLAM') || nameUpper.includes('BRUFEN') || nameUpper.includes('FLEXON')) {
      genericComposition = 'Ibuprofen + Paracetamol';
    } else if (nameUpper.includes('ANAFORTAN') || nameUpper.includes('MEFTAL') || nameUpper.includes('SPAS')) {
      genericComposition = 'Mefenamic Acid + Dicyclomine HCl';
    } else if (nameUpper.includes('NISE') || nameUpper.includes('NIMULID')) {
      genericComposition = 'Nimesulide (100mg) Paracetamol';
    } else {
      genericComposition = 'Analgesic & Antipyretic Pain Relief Complex';
    }
  } else if (
    nameUpper.includes('AZITHRAL') ||
    nameUpper.includes('TAXIM') ||
    nameUpper.includes('MONOCEF') ||
    nameUpper.includes('CLAVAM') ||
    nameUpper.includes('MEGA CV') ||
    nameUpper.includes('ALMOX') ||
    nameUpper.includes('CIFRAN') ||
    nameUpper.includes('NORFLOX') ||
    nameUpper.includes('OFLER') ||
    nameUpper.includes('BACTRIM') ||
    nameUpper.includes('HIFEN') ||
    nameUpper.includes('OMCEF') ||
    nameUpper.includes('SWICH') ||
    nameUpper.includes('ZENTEL') ||
    nameUpper.includes('NOWORM') ||
    nameUpper.includes('BANDY') ||
    nameUpper.includes('METROGYL') ||
    nameUpper.includes('FLAGYL') ||
    nameUpper.includes('MIKACIN') ||
    nameUpper.includes('ADVENT') ||
    nameUpper.includes('CEFTUM') ||
    nameUpper.includes('ZIFI') ||
    nameUpper.includes('CIPRO') ||
    nameUpper.includes('OFLOX') ||
    nameUpper.includes('CEF')
  ) {
    category = 'Antibiotics & Anti-infectives';
    isPrescriptionRequired = true;
    if (nameUpper.includes('AZITHRAL')) {
      genericComposition = 'Azithromycin (250mg/500mg)';
    } else if (nameUpper.includes('CLAVAM') || nameUpper.includes('MEGA CV') || nameUpper.includes('ALMOX CV') || nameUpper.includes('ADVENT')) {
      genericComposition = 'Amoxicillin + Potassium Clavulanate (625mg)';
    } else if (nameUpper.includes('TAXIM') || nameUpper.includes('MONOCEF') || nameUpper.includes('ZIFI') || nameUpper.includes('CEF')) {
      genericComposition = 'Cefixime / Cefpodoxime / Ceftriaxone';
    } else if (nameUpper.includes('NORFLOX') || nameUpper.includes('CIFRAN') || nameUpper.includes('OFLER') || nameUpper.includes('CIPRO') || nameUpper.includes('OFLOX')) {
      genericComposition = 'Ofloxacin / Ciprofloxacin / Norfloxacin';
    } else if (nameUpper.includes('ZENTEL') || nameUpper.includes('BANDY') || nameUpper.includes('NOWORM')) {
      genericComposition = 'Albendazole (400mg) / Ivermectin';
    } else if (nameUpper.includes('METROGYL') || nameUpper.includes('FLAGYL')) {
      genericComposition = 'Metronidazole (400mg)';
    } else {
      genericComposition = 'Broad Spectrum Anti-infective / Antibiotic';
    }
  } else if (
    nameUpper.includes('COLD') ||
    nameUpper.includes('COUGH') ||
    nameUpper.includes('ACETATE COLD') ||
    nameUpper.includes('ALEX') ||
    nameUpper.includes('ASCORIL') ||
    nameUpper.includes('ASTHAKIND') ||
    nameUpper.includes('AMBRODIL') ||
    nameUpper.includes('BENADRYL') ||
    nameUpper.includes('COSCOPIN') ||
    nameUpper.includes('COREX') ||
    nameUpper.includes('GLYCODIN') ||
    nameUpper.includes('GRILINCTUS') ||
    nameUpper.includes('PIRITON') ||
    nameUpper.includes('ZEDEX') ||
    nameUpper.includes('TUSSMARK') ||
    nameUpper.includes('VICKS') ||
    nameUpper.includes('OTRIVIN') ||
    nameUpper.includes('NASIVION') ||
    nameUpper.includes('LEVOCET') ||
    nameUpper.includes('CETZINE') ||
    nameUpper.includes('MONTINA') ||
    nameUpper.includes('MONTAIR') ||
    nameUpper.includes('ALLEGRA') ||
    nameUpper.includes('CHESTON') ||
    nameUpper.includes('SINAREST')
  ) {
    category = 'Cough, Cold & Respiratory';
    if (nameUpper.includes('LEVOCET') || nameUpper.includes('MONTINA') || nameUpper.includes('MONTAIR')) {
      genericComposition = 'Levocetirizine HCl + Montelukast Sodium';
    } else if (nameUpper.includes('CETZINE') || nameUpper.includes('ALLEGRA')) {
      genericComposition = 'Cetirizine / Fexofenadine HCl';
    } else if (nameUpper.includes('AMBRODIL') || nameUpper.includes('ASCORIL') || nameUpper.includes('ASTHAKIND')) {
      genericComposition = 'Ambroxol + Levosalbutamol + Guaiphenesin';
    } else if (nameUpper.includes('OTRIVIN') || nameUpper.includes('NASIVION')) {
      genericComposition = 'Oxymetazoline / Xylometazoline HCl Nasal Solution';
    } else if (nameUpper.includes('COLD') || nameUpper.includes('SINAREST') || nameUpper.includes('CHESTON')) {
      genericComposition = 'Paracetamol + Phenylephrine HCl + Chlorpheniramine Maleate';
    } else {
      genericComposition = 'Antitussive / Decongestant / Expectorant';
    }
  } else if (
    nameUpper.includes('ACILOC') ||
    nameUpper.includes('PAN') ||
    nameUpper.includes('PANTOCID') ||
    nameUpper.includes('PANTOP') ||
    nameUpper.includes('RABEKIND') ||
    nameUpper.includes('RABITOP') ||
    nameUpper.includes('RABEZOL') ||
    nameUpper.includes('RABINAB') ||
    nameUpper.includes('DIGENE') ||
    nameUpper.includes('GELUSIL') ||
    nameUpper.includes('ENO') ||
    nameUpper.includes('LIV') ||
    nameUpper.includes('LIVETONE') ||
    nameUpper.includes('LIVCARE') ||
    nameUpper.includes('ADLIV') ||
    nameUpper.includes('STOMAFIT') ||
    nameUpper.includes('CREMAFFIN') ||
    nameUpper.includes('DULCOFLEX') ||
    nameUpper.includes('ENTROFLORA') ||
    nameUpper.includes('VIZYLAC') ||
    nameUpper.includes('UNIENZYME') ||
    nameUpper.includes('ARISTOZYME') ||
    nameUpper.includes('AGLOZYME') ||
    nameUpper.includes('ACERA') ||
    nameUpper.includes('ACINATE')
  ) {
    category = 'Digestive & Gastro Care';
    if (nameUpper.includes('ACILOC')) {
      genericComposition = 'Ranitidine HCl (150mg/300mg)';
    } else if (nameUpper.includes('PAN') || nameUpper.includes('PANTOCID') || nameUpper.includes('PANTOP')) {
      genericComposition = 'Pantoprazole Sodium (40mg) / Domperidone';
    } else if (nameUpper.includes('RABE') || nameUpper.includes('RABITOP')) {
      genericComposition = 'Rabeprazole Sodium (20mg) / Domperidone';
    } else if (nameUpper.includes('LIV') || nameUpper.includes('ADLIV')) {
      genericComposition = 'Ayurvedic Hepato-Protective Liver Complex';
    } else if (nameUpper.includes('DIGENE') || nameUpper.includes('ENO') || nameUpper.includes('STOMAFIT')) {
      genericComposition = 'Antacid & Antiflatulent Suspension';
    } else if (nameUpper.includes('VIZYLAC') || nameUpper.includes('ENTROFLORA')) {
      genericComposition = 'Lactic Acid Bacillus / Probiotics & Prebiotics';
    } else if (nameUpper.includes('AGLOZYME') || nameUpper.includes('UNIENZYME') || nameUpper.includes('ARISTOZYME')) {
      genericComposition = 'Fungal Diastase + Pepsin Digestive Enzyme';
    } else {
      genericComposition = 'Digestive Gastro & Gastrointestinal Care Formulation';
    }
  } else if (
    nameUpper.includes('SYRINGE') ||
    nameUpper.includes('NEEDLE') ||
    nameUpper.includes('COTTON') ||
    nameUpper.includes('BANDAGE') ||
    nameUpper.includes('TAPE') ||
    nameUpper.includes('GLOVES') ||
    nameUpper.includes('THERMOMETER') ||
    nameUpper.includes('CATHETER') ||
    nameUpper.includes('IV SET') ||
    nameUpper.includes('URIN BAG') ||
    nameUpper.includes('NEBULIZER') ||
    companyUpper.includes('HI-TECH') ||
    companyUpper.includes('HMD') ||
    companyUpper.includes('SHCPL')
  ) {
    category = 'Medical & Surgical Supplies';
    genericComposition = 'Sterilized Clinical & Surgical Device';
  } else if (
    nameUpper.includes('BETNOVATE') ||
    nameUpper.includes('BETADINE') ||
    nameUpper.includes('CIPLADINE') ||
    nameUpper.includes('FOURDERM') ||
    nameUpper.includes('CLOBETA') ||
    nameUpper.includes('SOFRAMYCIN') ||
    nameUpper.includes('BURNOL') ||
    nameUpper.includes('MOOV') ||
    nameUpper.includes('VOLINI') ||
    nameUpper.includes('OMNIGEL') ||
    nameUpper.includes('RING GUARD') ||
    nameUpper.includes('LULIDERM') ||
    nameUpper.includes('CANDID') ||
    nameUpper.includes('OIL') ||
    nameUpper.includes('OINT') ||
    nameUpper.includes('CREAM') ||
    nameUpper.includes('GEL')
  ) {
    category = 'Ointments, Creams & Skin';
    if (nameUpper.includes('BETADINE') || nameUpper.includes('CIPLADINE')) {
      genericComposition = 'Povidone Iodine (5% / 10%)';
    } else if (nameUpper.includes('MOOV') || nameUpper.includes('VOLINI') || nameUpper.includes('OMNIGEL')) {
      genericComposition = 'Diclofenac Diethylamine + Methyl Salicylate + Menthol';
    } else if (nameUpper.includes('CANDID') || nameUpper.includes('LULIDERM')) {
      genericComposition = 'Clotrimazole / Luliconazole Antifungal';
    } else {
      genericComposition = 'Antibacterial & Anti-inflammatory Topical Agent';
    }
  } else if (
    nameUpper.includes('VET') ||
    nameUpper.includes('BOLUS') ||
    nameUpper.includes('RUCHAMAX') ||
    nameUpper.includes('BROTONE') ||
    nameUpper.includes('OSTOVET') ||
    nameUpper.includes('BANMINTH') ||
    nameUpper.includes('BIOBOOST') ||
    nameUpper.includes('SHARKOFERROL') ||
    nameUpper.includes('VIRTRAZ') ||
    nameUpper.includes('ECOTAS')
  ) {
    category = 'Veterinary Medicines';
    genericComposition = 'Veterinary Animal Health & Feed Supplement';
  } else if (
    nameUpper.includes('BECOSULES') ||
    nameUpper.includes('ZINCOVIT') ||
    nameUpper.includes('A TO Z') ||
    nameUpper.includes('ATOZ') ||
    nameUpper.includes('REVITAL') ||
    nameUpper.includes('SUPRADYN') ||
    nameUpper.includes('SHELCAL') ||
    nameUpper.includes('OSTOCALCIUM') ||
    nameUpper.includes('EVION') ||
    nameUpper.includes('LIMCEE') ||
    nameUpper.includes('NEUROBION') ||
    nameUpper.includes('UPRISE D3') ||
    nameUpper.includes('FOLVITE') ||
    nameUpper.includes('DEXORANGE') ||
    nameUpper.includes('CALCIUM') ||
    nameUpper.includes('VITAMIN')
  ) {
    category = 'Vitamins & Supplements';
    if (nameUpper.includes('BECOSULES') || nameUpper.includes('NEUROBION')) {
      genericComposition = 'B-Complex Vitamins with Vitamin C & Zinc';
    } else if (nameUpper.includes('SHELCAL') || nameUpper.includes('OSTOCALCIUM') || nameUpper.includes('UPRISE')) {
      genericComposition = 'Calcium Carbonate + Vitamin D3 (Cholecalciferol)';
    } else if (nameUpper.includes('DEXORANGE')) {
      genericComposition = 'Ferric Ammonium Citrate + Folic Acid + Cyanocobalamin';
    } else {
      genericComposition = 'Multivitamin, Minerals & Antioxidants';
    }
  }

  // STRICT RULE: Sell ONLY at MRP price. No discount or less.
  const effectiveMrp = mrp > 0 ? mrp : rate > 0 ? rate : pur_rate > 0 ? Math.round(pur_rate * 1.25 * 100) / 100 : 50;
  const sellingPrice = effectiveMrp;

  // Expiry date generator (some within next 90 days for demoing the near-expiry alert, most 2026-2028)
  const isNearExpiry = index % 17 === 0;
  const expiryDate = isNearExpiry
    ? '2026-11' // within ~30-60 days
    : `202${7 + (index % 3)}-0${1 + (index % 9)}`;

  const batchNo = `MMH-${code || 'BAT'}-${100 + (index % 899)}`;

  return {
    id: `med_${code || 'item'}_${index}`,
    code: code || `MMH-${1000 + index}`,
    name: rawName,
    unit: unit || 'Pcs',
    stock: Math.max(0, stock || 0),
    deal: 0,
    free: 0,
    pur_deal: 0,
    pur_free: 0,
    value: 0,
    mrp: effectiveMrp,
    pur_rate: pur_rate || Math.round(effectiveMrp * 0.8 * 100) / 100,
    rate: effectiveMrp, // Strictly MRP only
    company: rawCompany || 'Generic Pharma',
    manufact: '',
    rackno: rackno || `R-${1 + (index % 12)}`,
    batchNo,
    expiryDate,
    genericComposition,
    category,
    isPrescriptionRequired
  };
}

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord_101',
    orderNumber: 'MMH-2026-001',
    customerId: 'user_cust_1',
    customerName: 'Amit Sharma',
    customerPhone: '9801234567',
    deliveryMode: 'home_delivery',
    deliveryAddress: {
      fullAddress: 'Ward No. 04, Near Shiv Mandir, Main Road',
      locality: 'Chanman, Baheri',
      pinCode: '847101',
      landmark: 'Near Shiv Mandir',
      lat: 25.9612,
      lng: 85.9912
    },
    deliveryInstructions: 'Please ring the doorbell or call on reaching Shiv Mandir gate.',
    items: [
      {
        medicineId: 'med_43083_0',
        medicineCode: '43083',
        name: 'DOLO 650 TAB 1X15',
        unit: 'TAB.',
        batchNo: 'MMH-43083-100',
        quantity: 2,
        rate: 24.59,
        mrp: 32.28,
        total: 49.18
      },
      {
        medicineId: 'med_A00616_1',
        medicineCode: 'A00616',
        name: 'AMBRODIL LS SYP 100ML',
        unit: 'SYP',
        batchNo: 'MMH-A00616-101',
        quantity: 1,
        rate: 77.5,
        mrp: 101.71,
        total: 77.5
      }
    ],
    subtotal: 126.68,
    deliveryFee: 30,
    discount: 0,
    totalAmount: 156.68,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    status: 'out_for_delivery',
    assignedDeliveryPersonId: 'user_del_1',
    assignedDeliveryPersonName: 'Ramesh Kumar (Baheri Express)',
    createdAt: '2026-10-19T06:15:00.000Z',
    updatedAt: '2026-10-19T06:45:00.000Z'
  },
  {
    id: 'ord_102',
    orderNumber: 'MMH-2026-002',
    customerId: 'user_cust_1',
    customerName: 'Sunita Devi',
    customerPhone: '9122334455',
    deliveryMode: 'home_delivery',
    deliveryAddress: {
      fullAddress: 'Hospital Road, Near Block Office',
      locality: 'Baheri Bazar',
      pinCode: '847101',
      landmark: 'Opposite State Bank ATM'
    },
    deliveryInstructions: 'Urgent fever medicines for elderly person',
    items: [
      {
        medicineId: 'med_43332_2',
        medicineCode: '43332',
        name: 'PAN 40 1X15',
        unit: '.TAB',
        batchNo: 'MMH-43332-102',
        quantity: 1,
        rate: 121.43,
        mrp: 170,
        total: 121.43
      },
      {
        medicineId: 'med_21649_3',
        medicineCode: '21649',
        name: 'CALPOL 500 TAB 1X15',
        unit: 'tab',
        batchNo: 'MMH-21649-103',
        quantity: 1,
        rate: 10.87,
        mrp: 14.26,
        total: 10.87
      }
    ],
    subtotal: 132.3,
    deliveryFee: 30,
    discount: 0,
    totalAmount: 162.3,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    status: 'assigned',
    assignedDeliveryPersonId: 'user_del_1',
    assignedDeliveryPersonName: 'Ramesh Kumar (Baheri Express)',
    createdAt: '2026-10-19T06:30:00.000Z',
    updatedAt: '2026-10-19T06:35:00.000Z'
  }
];

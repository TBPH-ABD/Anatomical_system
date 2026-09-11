import type {SystemId} from './anatomy';

/** How a structure moves when the model is shown alive. The numbers are read
 * by the vertex shader, so they must stay in step with `LIFE_VERTEX` in
 * `scene.tsx`. */
export const MOTION = {
  still: 0,
  /** Contracts with the cardiac cycle: chamber walls, valve leaflets. */
  beat: 1,
  /** Expands with inspiration: bronchial tree, ribs, chest wall. */
  breathe: 2,
  /** Descends and flattens with inspiration: the diaphragm. */
  descend: 3,
  /** Pressure wave arriving from the heart, delayed by distance. */
  arterial: 4,
  /** Slow filling, no pulse: venous return. */
  venous: 5,
  /** Travelling ring of contraction: peristalsis. */
  peristalsis: 6,
  /** Faint pulsation transmitted by the cerebrospinal fluid. */
  csf: 7,
} as const;
export type MotionKind = (typeof MOTION)[keyof typeof MOTION];

export interface Tissue {
  /** Surface colour of the living tissue, not a teaching colour. */
  color: string;
  /** 0 = wet serous sheen, 1 = dry bone. */
  roughness: number;
  /** Strength of the wet film highlight. */
  sheen: number;
  /** How much blood-lit light escapes through thin edges. */
  translucency: number;
  /** Surface unevenness: lobules, fibres, vessels on the capsule. */
  mottle: number;
  motion: MotionKind;
  /** Fraction of its own size the structure moves by. */
  amplitude: number;
  /** Brightness of the content travelling through a tube. */
  flow: number;
}

const base: Tissue = {color: '#b07a6c', roughness: 0.46, sheen: 0.3, translucency: 0.25, mottle: 0.35, motion: MOTION.still, amplitude: 0, flow: 0};

const make = (tissue: Partial<Tissue>): Tissue => ({...base, ...tissue});

/** Fallbacks by system, used when no name rule applies. */
const SYSTEM_TISSUE: Record<SystemId, Tissue> = {
  skeletal: make({color: '#e9dec6', roughness: 0.72, sheen: 0.12, translucency: 0.1, mottle: 0.22}),
  muscular: make({color: '#8f3a33', roughness: 0.5, sheen: 0.26, translucency: 0.34, mottle: 0.55}),
  cardiac: make({color: '#93352f', roughness: 0.34, sheen: 0.48, translucency: 0.3, mottle: 0.4, motion: MOTION.beat, amplitude: 0.085}),
  sensory: make({color: '#dcd3c6', roughness: 0.3, sheen: 0.5, translucency: 0.4, mottle: 0.2}),
  arterial: make({color: '#b2302a', roughness: 0.3, sheen: 0.42, translucency: 0.42, mottle: 0.2, motion: MOTION.arterial, amplitude: 0.05, flow: 0.5}),
  venous: make({color: '#3b4d6e', roughness: 0.34, sheen: 0.36, translucency: 0.3, mottle: 0.18, motion: MOTION.venous, amplitude: 0.022, flow: 0.3}),
  nervous: make({color: '#e2d6b4', roughness: 0.44, sheen: 0.3, translucency: 0.26, mottle: 0.25}),
  respiratory: make({color: '#c98b90', roughness: 0.42, sheen: 0.34, translucency: 0.45, mottle: 0.5, motion: MOTION.breathe, amplitude: 0.05}),
  digestive: make({color: '#bd8a74', roughness: 0.3, sheen: 0.5, translucency: 0.36, mottle: 0.42, motion: MOTION.peristalsis, amplitude: 0.03, flow: 0.18}),
  urinary: make({color: '#8f4538', roughness: 0.36, sheen: 0.42, translucency: 0.3, mottle: 0.38}),
  reproductive: make({color: '#c19484', roughness: 0.38, sheen: 0.4, translucency: 0.3, mottle: 0.3}),
  lymphatic: make({color: '#6c3340', roughness: 0.34, sheen: 0.44, translucency: 0.3, mottle: 0.3}),
  endocrine: make({color: '#a8564c', roughness: 0.32, sheen: 0.46, translucency: 0.34, mottle: 0.35}),
  integumentary: make({color: '#c89b78', roughness: 0.56, sheen: 0.2, translucency: 0.3, mottle: 0.3}),
  connective: make({color: '#e4dccb', roughness: 0.52, sheen: 0.22, translucency: 0.2, mottle: 0.3}),
};

/** Name rules, first match wins. Keyed on the lowercased source name, so they
 * also correct structures the source model files under a broad system. */
const RULES: [RegExp, Partial<Tissue>][] = [
  // Cardiac
  [/\b(wall of (left |right )?(atrium|ventricle))\b|myocard/, {color: '#99322c', roughness: 0.32, sheen: 0.5, translucency: 0.3, mottle: 0.45, motion: MOTION.beat, amplitude: 0.095}],
  [/cavity of (left|right) (atrium|ventricle)/, {color: '#8e201f', roughness: 0.22, sheen: 0.6, translucency: 0.5, mottle: 0.2, motion: MOTION.beat, amplitude: 0.1, flow: 0.45}],
  [/(cusp|leaflet) of .*(valve)|valve\b/, {color: '#dccdb6', roughness: 0.26, sheen: 0.6, translucency: 0.55, mottle: 0.16, motion: MOTION.beat, amplitude: 0.13}],
  // Brain and nerves
  [/(ventricle|interventricular foramen|central canal|choroid plexus|cerebrospinal)/, {color: '#cfd8dc', roughness: 0.18, sheen: 0.66, translucency: 0.6, mottle: 0.15, motion: MOTION.csf, amplitude: 0.012, flow: 0.22}],
  [/(gyrus|sulcus|lobe of (cerebrum|brain)|cerebral cortex|occipital lobe|temporal lobe|frontal lobe|parietal lobe|insula)/, {color: '#c6aba6', roughness: 0.4, sheen: 0.34, translucency: 0.3, mottle: 0.5, motion: MOTION.csf, amplitude: 0.008}],
  [/(cerebellum|vermis|culmen|declive|tonsil of cerebellum)/, {color: '#c3a49c', roughness: 0.4, sheen: 0.34, translucency: 0.28, mottle: 0.55, motion: MOTION.csf, amplitude: 0.008}],
  [/(spinal cord|medulla oblongata|pons|midbrain|thalamus|hypothalamus|corpus callosum|commissure|capsule|peduncle|colliculus|fornix|putamen|pallidum|caudate nucleus|amygdala|hippocampus)/, {color: '#ded1c6', roughness: 0.38, sheen: 0.36, translucency: 0.3, mottle: 0.3, motion: MOTION.csf, amplitude: 0.007}],
  [/(nerve|ganglion|plexus|trunk of|ramus)/, {color: '#e6dcb6', roughness: 0.42, sheen: 0.32, translucency: 0.26, mottle: 0.28}],
  // Eye
  [/cornea/, {color: '#e9f1f3', roughness: 0.05, sheen: 0.95, translucency: 0.85, mottle: 0.04}],
  [/\blens\b(?! suspensory)|vitreous body|anterior chamber/, {color: '#e4eef2', roughness: 0.07, sheen: 0.9, translucency: 0.9, mottle: 0.05}],
  [/sclera/, {color: '#f4f0e6', roughness: 0.24, sheen: 0.6, translucency: 0.3, mottle: 0.25}],
  [/\biris\b/, {color: '#6d6f56', roughness: 0.3, sheen: 0.5, translucency: 0.4, mottle: 0.6}],
  [/(choroid|retina|corona ciliaris)/, {color: '#8a3f3c', roughness: 0.3, sheen: 0.45, translucency: 0.5, mottle: 0.45}],
  [/(lacrimal gland|lacrimal sac|nasolacrimal|lacrimal canaliculus|lacrimal lake)/, {color: '#d9a69a', roughness: 0.3, sheen: 0.5, translucency: 0.4, mottle: 0.35}],
  [/(eyelid|tarsal plate|eyebrow|external ear)/, {color: '#c5916f', roughness: 0.5, sheen: 0.26, translucency: 0.34, mottle: 0.32}],
  // Abdominal organs
  [/liver|hepatic (duct|biliary)|cystic duct/, {color: '#6d362c', roughness: 0.3, sheen: 0.52, translucency: 0.3, mottle: 0.3}],
  [/gallbladder/, {color: '#5f7a3e', roughness: 0.26, sheen: 0.6, translucency: 0.55, mottle: 0.25}],
  [/(pancreas|parenchyma of pancreas|pancreatic duct)/, {color: '#d3a877', roughness: 0.44, sheen: 0.34, translucency: 0.3, mottle: 0.7}],
  [/spleen/, {color: '#5e2a35', roughness: 0.28, sheen: 0.54, translucency: 0.3, mottle: 0.3}],
  [/kidney/, {color: '#8d4133', roughness: 0.32, sheen: 0.5, translucency: 0.3, mottle: 0.4}],
  [/adrenal gland/, {color: '#d2b479', roughness: 0.4, sheen: 0.36, translucency: 0.3, mottle: 0.45}],
  [/(ureter|urethra)/, {color: '#cdb0a0', roughness: 0.34, sheen: 0.44, translucency: 0.3, mottle: 0.2, motion: MOTION.peristalsis, amplitude: 0.035, flow: 0.12}],
  [/urinary bladder/, {color: '#c19e8d', roughness: 0.34, sheen: 0.46, translucency: 0.32, mottle: 0.28}],
  [/stomach/, {color: '#bf8573', roughness: 0.26, sheen: 0.56, translucency: 0.34, mottle: 0.4, motion: MOTION.peristalsis, amplitude: 0.03, flow: 0.2}],
  [/(colon|caecum|cecum|appendix|rectum|taenia|ileocecal)/, {color: '#b98a72', roughness: 0.28, sheen: 0.54, translucency: 0.32, mottle: 0.45, motion: MOTION.peristalsis, amplitude: 0.028, flow: 0.16}],
  [/(ileum|jejunum|duodenum|small intestine)/, {color: '#c28d76', roughness: 0.26, sheen: 0.58, translucency: 0.38, mottle: 0.4, motion: MOTION.peristalsis, amplitude: 0.04, flow: 0.24}],
  [/(esophagus|oesophagus)/, {color: '#c49b8c', roughness: 0.3, sheen: 0.5, translucency: 0.3, mottle: 0.3, motion: MOTION.peristalsis, amplitude: 0.035, flow: 0.2}],
  [/(mesentery|mesocolon|mesoappendix|omentum)/, {color: '#dcc081', roughness: 0.34, sheen: 0.48, translucency: 0.6, mottle: 0.5}],
  [/tongue/, {color: '#b9655f', roughness: 0.34, sheen: 0.5, translucency: 0.34, mottle: 0.5}],
  [/(sublingual gland|submandibular gland|parotid)/, {color: '#d7a898', roughness: 0.36, sheen: 0.42, translucency: 0.32, mottle: 0.55}],
  // Airway and thorax
  [/(bronchial tree|bronchus|bronchiole)/, {color: '#cf979a', roughness: 0.36, sheen: 0.42, translucency: 0.5, mottle: 0.4, motion: MOTION.breathe, amplitude: 0.055}],
  [/trachea/, {color: '#ddd2c4', roughness: 0.38, sheen: 0.4, translucency: 0.35, mottle: 0.3, motion: MOTION.breathe, amplitude: 0.02}],
  [/(epiglottis|nasal cartilage|concha|conus elasticus|vocal ligament|thyrohyoid|cricothyroid ligament)/, {color: '#e2e6e4', roughness: 0.36, sheen: 0.42, translucency: 0.42, mottle: 0.18}],
  [/pharyngeal constrictor|palatopharyngeus|salpingopharyngeus|stylopharyngeus/, {color: '#9d4640', roughness: 0.46, sheen: 0.3, translucency: 0.32, mottle: 0.5}],
  [/diaphragm/, {color: '#a1564a', roughness: 0.4, sheen: 0.38, translucency: 0.36, mottle: 0.5, motion: MOTION.descend, amplitude: 0.07}],
  [/(\brib\b|ribs|costal cartilage|sternum|xiphoid|manubrium)/, {color: '#ece2ca', roughness: 0.7, sheen: 0.14, translucency: 0.12, mottle: 0.22, motion: MOTION.breathe, amplitude: 0.012}],
  [/thymus/, {color: '#d8bd92', roughness: 0.4, sheen: 0.36, translucency: 0.36, mottle: 0.45}],
  [/thyroid gland|parathyroid/, {color: '#9d4740', roughness: 0.3, sheen: 0.5, translucency: 0.34, mottle: 0.35}],
  [/(pineal body|pituitary gland)/, {color: '#b06a5e', roughness: 0.32, sheen: 0.46, translucency: 0.36, mottle: 0.3}],
  // Vessels
  [/(aorta|pulmonary trunk|arch of aorta)/, {color: '#ad3b33', roughness: 0.3, sheen: 0.46, translucency: 0.36, mottle: 0.22, motion: MOTION.arterial, amplitude: 0.04, flow: 0.55}],
  [/pulmonary artery|pulmonary branch/, {color: '#8d3f4a', roughness: 0.3, sheen: 0.44, translucency: 0.36, mottle: 0.2, motion: MOTION.arterial, amplitude: 0.045, flow: 0.4}],
  [/pulmonary vein/, {color: '#a23a36', roughness: 0.3, sheen: 0.44, translucency: 0.36, mottle: 0.2, motion: MOTION.venous, amplitude: 0.02, flow: 0.35}],
  [/(portal vein|hepatic portal)/, {color: '#4b4668', roughness: 0.32, sheen: 0.4, translucency: 0.3, mottle: 0.2, motion: MOTION.venous, amplitude: 0.02, flow: 0.3}],
  // Skeletal and soft support
  [/tooth|teeth/, {color: '#f6f2e6', roughness: 0.22, sheen: 0.6, translucency: 0.45, mottle: 0.12}],
  [/gingiva/, {color: '#bd6a68', roughness: 0.34, sheen: 0.48, translucency: 0.36, mottle: 0.3}],
  [/(cartilage|disc of|meniscus|labrum|symphysis)/, {color: '#e3e9e6', roughness: 0.3, sheen: 0.5, translucency: 0.42, mottle: 0.2}],
  [/(tendon|ligament|aponeurosis|retinaculum|raphe|linea alba|interosseous membrane|iliotibial tract|fascia|trochlea of|check ligament|tendinous)/, {color: '#e8e0cd', roughness: 0.46, sheen: 0.3, translucency: 0.24, mottle: 0.35}],
  [/(skin|lip\b)/, {color: '#c89b78', roughness: 0.54, sheen: 0.24, translucency: 0.36, mottle: 0.3}],
  [/hair/, {color: '#3c2f28', roughness: 0.42, sheen: 0.4, translucency: 0.12, mottle: 0.4}],
  // Muscles named without a system hint
  [/(fibularis|tibialis|gastrocnemius|soleus|biceps|triceps|rectus|oblique|lumbrical|interosseous of|abductor|adductor|flexor|extensor|levator|masseter|sartorius|gracilis|semitendinosus|semimembranosus|gluteus|psoas|iliacus|deltoid|trapezius|latissimus|pectoralis|sternothyroid|omohyoid|digastric|platysma|tensor)/, {color: '#8f3a33', roughness: 0.5, sheen: 0.26, translucency: 0.34, mottle: 0.58}],
];

const cache = new Map<string, Tissue>();

/** The living appearance of one structure. */
export function tissueFor(name: string, system: SystemId): Tissue {
  const key = `${system}|${name}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const lower = name.toLowerCase();
  const rule = RULES.find(([test]) => test.test(lower));
  const tissue = rule ? {...SYSTEM_TISSUE[system], ...rule[1]} : SYSTEM_TISSUE[system];
  cache.set(key, tissue);
  return tissue;
}

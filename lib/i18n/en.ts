/** English UI strings. This file is the source of truth for the message key set;
 * every other locale is typed against it so a missing key is a build error. */
export const en = {
  meta: {
    title: '3D Anatomy System',
    description:
      'An interactive 3D model of the human body. Explore named anatomical structures, reveal organ systems, and inspect individual parts in 3D.',
    languageName: 'English',
    switchTo: 'العربية',
    switchLabel: 'Switch language',
  },
  identity: {
    eyebrow: 'INTERACTIVE ANATOMY',
    title: '3D Anatomy System',
    edition: '3D',
    meta: '{count} modeled pieces',
    source: 'BodyParts3D',
  },
  actions: {
    search: 'Find a structure',
    searchAria: 'Search anatomy',
    about: 'About this model',
    panels: 'Explorer panels',
    close: 'Close',
    quiz: 'Quiz mode',
    flashcards: 'Flashcards',
    favorites: 'Favorites',
    labels: 'Labels',
    share: 'Share view',
    shortcuts: 'Keyboard shortcuts',
  },
  alive: {
    toggle: 'Living tissue',
    on: 'Living tissue: on. Structures carry their real colours and move with the heartbeat and breathing.',
    off: 'Living tissue: off. Structures carry flat teaching colours and stand still.',
  },
  activity: {
    heading: 'Working now',
    beat: 'Contracting and relaxing about 70 times a minute, on a full cardiac cycle.',
    breathe: 'Widening with every breath in, about 14 times a minute.',
    descend: 'Descending and flattening on inspiration, then rising again.',
    arterial: 'Carrying the pressure wave that leaves the heart with every beat.',
    venous: 'Returning blood toward the heart in a slow, steady flow.',
    peristalsis: 'Running a ring of contraction along its length to move its contents on.',
    csf: 'Pulsing faintly with the cerebrospinal fluid around it.',
  },
  systemsPanel: {
    heading: 'Systems',
    closeAria: 'Close systems',
    ariaLabel: 'Anatomical layers',
    presetAll: 'All',
    presetSkeleton: 'Skeleton',
    presetOrgans: 'Organs',
    showOnly: 'Show only {name}',
    show: 'Show {name}',
    visible: '{count} pieces visible',
    hideAll: 'Hide all',
  },
  search: {
    heading: 'Find a structure',
    ariaLabel: 'Find anatomy',
    closeAria: 'Close search',
    placeholder: 'Heart, femur, cranial nerve…',
    inputAria: 'Search named anatomical structures',
    empty: 'No structures match your search.',
    piece: 'piece',
    pieces: 'pieces',
    noteIdle: 'Start with a major organ, or search every named structure.',
    noteQuery: 'Showing up to 80 matches. Refine your search to find smaller structures.',
  },
  view: {
    ariaLabel: 'Camera controls',
    'three-quarter': 'Three-quarter view',
    front: 'Front view',
    side: 'Side view',
    back: 'Back view',
    abbrThreeQuarter: '¾',
    abbrFront: 'F',
    abbrSide: 'S',
    abbrBack: 'B',
    rotate: 'Rotate body',
    rotateOn: 'Pause rotation',
    rotateOff: 'Rotate body',
    reset: 'Reset',
    resetAria: 'Reset view and layers',
  },
  caption: {
    selected: 'SELECTED STRUCTURE',
    inventory: 'ANATOMICAL INVENTORY',
    separated: 'SEPARATED STRUCTURES',
    assembled: 'ADULT HUMAN · MALE',
  },
  dock: {
    layers: 'Systems',
    layersAria: 'Open system layers',
    explode: 'Explode anatomy',
    assembled: 'Assembled',
    everyPiece: 'Every piece',
    reset: 'Reset',
    resetAria: 'Assemble and reset',
  },
  footer: {
    orbit: 'Drag to orbit',
    pan: 'Drag to pan',
    zoom: 'Pinch to zoom',
    inspect: 'Tap to inspect',
    credits: 'Source & credits',
  },
  loading: {
    title: 'Preparing the anatomy',
    detail: '{percent}% · Loading {count} pieces',
    downloaded: '{done} of {total} MB',
    reload: 'Reload viewer',
  },
  detail: {
    fallbackSystem: 'ANATOMY',
    contextNote: 'System overview · structure identified from source anatomy',
    reference: 'Model reference',
    selectedPieces: 'Selected pieces',
    system: 'System',
    included: 'Included structures',
    andMore: 'And {count} more modeled pieces.',
    sourceLink: 'View anatomical source',
    isolate: 'Isolate structure',
    unisolate: 'Show surrounding anatomy',
    clear: 'Clear selection',
    addFavorite: 'Add to favorites',
    removeFavorite: 'Remove from favorites',
    addFlashcard: 'Add flashcard',
    latin: 'Latin term',
    english: 'English term',
    arabic: 'Arabic term',
  },
  about: {
    eyebrow: 'SOURCE & SCOPE',
    title: 'A body, revealed.',
    lead: 'Explore the adult male reference anatomy from BodyParts3D.',
    scopeTitle: 'Male · BodyParts3D',
    scopeBody: '2,234 individual meshes and 3,432 named concepts from an adult male reference anatomy.',
    caveat:
      'This reference does not contain every human structure or variation. Named concepts can contain multiple pieces; each source mesh is rendered once.',
    disclaimer:
      'Colors and system groupings are designed for exploration. The geometry is simplified for the web, and short explanations provide general educational context. This is an anatomical reference, not a diagnostic or surgical tool.',
    sourceHeading: 'Source',
    sourceBody: 'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.',
    licenseLink: 'Dataset license',
    geometryLink: 'Original geometry & metadata',
    paperLink: 'Read the source publication',
    termsHeading: 'Arabic terminology',
    termsBody:
      'Arabic names follow the Terminologia Anatomica equivalents used in Arabic medical curricula. Where no verified Arabic term exists, the English or Latin name is shown instead.',
  },
  credit: {
    title: 'نظام تشريح ثلاثي الأبعاد — مساعد لطلاب الطب البشري في جامعة العلوم والتكنولوجيا',
    line1: 'مقدم من د. سمية عبد الله عبد',
    line2: 'بمساعدة أخيها المهندس صلاح عبد الله عبد',
  },
  explain: {
    action: 'Explain this structure',
    title: 'AI explanation',
    noticeTitle: 'You need to be online',
    offlineBody: 'The explanation is written by an AI model over the internet. Connect to a network and press the button again.',
    ok: 'Got it',
    disclaimer: 'AI-generated educational context — check it against your course material. Not a clinical reference.',
    noticeBody:
      'The explanation is generated by an AI model, so this sends the name of the selected structure over the internet. It is general educational context, not a clinical reference, and it can be wrong — check it against your course material.',
    confirm: 'Continue and explain',
    cancel: 'Not now',
    loading: 'Writing the explanation…',
    retry: 'Try again',
    close: 'Close explanation',
    errorOffline: 'No internet connection. Connect and try again.',
    errorUnavailable: 'The explanation service is not set up on this server yet.',
    errorBusy: 'The service is busy right now. Try again in a moment.',
    errorRefused: 'The model declined to answer this one.',
    errorModel: 'The configured model is unavailable. Check the model name or the provider quota.',
    errorSlow: 'The model took too long to answer. Try again.',
    errorGeneric: 'The explanation could not be produced. Try again.',
  },
  scene: {
    canvasLabel: 'Interactive human anatomy. Drag to orbit, pinch or scroll to zoom, and tap a structure to inspect it.',
  },
  splash: {
    logoAlt: 'University of Science and Technology emblem',
    enter: 'Enter the system',
    smallScreen: 'A tablet or a laptop shows the model in far more detail. The phone works, but fine structures are hard to tell apart on it.',
    preparing: 'Preparing…',
  },
  quiz: {
    title: 'Quiz mode',
    ariaLabel: 'Anatomy quiz',
    start: 'Start quiz',
    exit: 'Exit quiz',
    prompt: 'Find this structure on the model',
    hidden: 'Name hidden',
    correct: 'Correct',
    wrong: 'Not quite — that is {name}',
    reveal: 'Reveal answer',
    revealed: 'The answer was {name}',
    skip: 'Skip',
    next: 'Next question',
    score: 'Score {correct} / {asked}',
    streak: 'Streak {count}',
    finished: 'Quiz complete',
    scopeLabel: 'Question pool',
    scopeVisible: 'Visible systems',
    scopeFavorites: 'Favorites',
    scopeAll: 'Whole model',
    empty: 'No structures available for this pool. Turn on a system or add favorites first.',
    restart: 'Restart',
    tapPrompt: 'Tap the structure in the 3D view.',
  },
  flashcards: {
    title: 'Flashcards',
    ariaLabel: 'Flashcards',
    empty: 'No cards yet. Open a structure and add it as a flashcard.',
    count: '{count} cards',
    show: 'Show answer',
    hide: 'Hide answer',
    next: 'Next',
    previous: 'Previous',
    remove: 'Remove card',
    export: 'Export CSV',
    exportAnki: 'Export for Anki',
    clear: 'Clear all',
    added: 'Added to flashcards',
  },
  favorites: {
    title: 'Favorites',
    ariaLabel: 'Favorites and lists',
    empty: 'No favorites yet. Open a structure and add it.',
    newList: 'New list',
    listName: 'List name',
    listPlaceholder: 'Upper limb exam',
    create: 'Create',
    delete: 'Delete list',
    addTo: 'Add to list',
    all: 'All favorites',
    remove: 'Remove',
    count: '{count} structures',
  },
  labels: {
    toggle: 'Show labels',
    ariaLabel: 'Structure labels',
    limit: 'Labels shown for the {count} largest visible structures.',
  },
  share: {
    title: 'Share this view',
    copy: 'Copy link',
    copied: 'Link copied',
    body: 'The link restores the visible systems, the selected structure, and the camera angle.',
  },
  shortcuts: {
    title: 'Keyboard shortcuts',
    search: 'Open search',
    layers: 'Toggle systems panel',
    reset: 'Reset view',
    rotate: 'Toggle auto rotation',
    isolate: 'Isolate the selected structure',
    labels: 'Toggle labels',
    alive: 'Toggle living tissue',
    quiz: 'Toggle quiz mode',
    favorite: 'Favorite the selected structure',
    escape: 'Close panels',
    help: 'Show this list',
    about: 'Source, license and credits',
    views: 'Front / side / back / three-quarter view',
  },
  errors: {
    model: 'The anatomy catalogue could not be loaded.',
    chunk: 'An anatomy file could not be loaded.',
    incomplete: 'An anatomy file was incomplete. Please reload the viewer.',
    assemble: 'Could not assemble anatomy geometry.',
    webgl: 'This browser could not start the 3D viewer. Please try a browser with WebGL enabled.',
    contextLost: 'The 3D session was paused by your device. Reload to continue.',
    generic: 'Could not load the anatomy.',
  },
  systems: {
    skeletal: {
      name: 'Skeleton',
      description:
        'Bones form the supporting framework of the body, protect organs, and provide attachment points for muscles. Their internal tissue also stores minerals and produces blood cells.',
    },
    muscular: {
      name: 'Muscles',
      description:
        'Skeletal muscles generate movement by pulling on their attachments. Together with tendons, they move joints, stabilize posture, and produce heat.',
    },
    cardiac: {
      name: 'Heart',
      description:
        'The heart is a muscular pump with four chambers. Its valves direct blood forward through the pulmonary and systemic circuits.',
    },
    sensory: {
      name: 'Sensory organs',
      description:
        'These structures contribute to special senses, including sight, hearing, and balance. Their specialized tissues detect stimuli and work with the nervous system to convey information.',
    },
    arterial: {
      name: 'Arteries',
      description:
        'The heart drives blood through the circulation. Arteries carry blood away from the heart to supply tissues or, in the pulmonary circuit, to the lungs.',
    },
    venous: {
      name: 'Veins',
      description:
        'Veins return blood toward the heart. Superficial and deep networks collect blood from the tissues; the pulmonary veins bring oxygenated blood back from the lungs.',
    },
    nervous: {
      name: 'Nervous system',
      description:
        'The brain, spinal cord, and peripheral nerves carry and process signals. They support sensation, movement, coordination, and automatic regulation of body functions.',
    },
    respiratory: {
      name: 'Respiratory',
      description:
        'The airways conduct air to the lungs, where oxygen and carbon dioxide move between air and blood. Breathing depends on pressure changes produced by respiratory muscles.',
    },
    digestive: {
      name: 'Digestive',
      description:
        'The digestive tract breaks down food, absorbs nutrients and water, and moves waste onward. Accessory organs contribute bile and digestive enzymes.',
    },
    urinary: {
      name: 'Urinary',
      description:
        'The kidneys filter blood and regulate fluid, electrolyte, and acid–base balance. Urine travels through the ureters to the bladder and exits through the urethra.',
    },
    lymphatic: {
      name: 'Lymphatic',
      description:
        'Lymphatic vessels return excess tissue fluid to the circulation. Lymph nodes and other lymphoid organs support immune surveillance and responses.',
    },
    endocrine: {
      name: 'Endocrine',
      description:
        'Endocrine organs release hormones into the blood to coordinate processes such as metabolism, growth, stress responses, and reproduction.',
    },
    reproductive: {
      name: 'Reproductive',
      description:
        'The male reproductive structures represented here contribute to sperm production, maturation, transport, and the production of sex hormones.',
    },
    integumentary: {
      name: 'Body surface',
      description:
        'The body surface provides an outer anatomical reference. The integumentary system forms a protective barrier and contributes to sensation and temperature regulation.',
    },
    connective: {
      name: 'Connective tissue',
      description:
        'Cartilage, ligaments, and other connective tissues support, connect, and separate structures. Their roles include stabilizing joints and distributing mechanical loads.',
    },
  },
  explanations: {
    heart:
      'A muscular pump in the chest. Its right side sends blood to the lungs; its left side sends blood through the systemic circulation.',
    liver:
      'A large organ beneath the right side of the diaphragm. It processes absorbed nutrients, produces bile, and synthesizes many proteins carried in the blood.',
    brain:
      'The central organ of the nervous system. Its interconnected regions support perception, movement, memory, language, and the regulation of bodily functions.',
    stomach:
      'A muscular chamber between the esophagus and small intestine. It stores and mixes food with acid and enzymes before releasing it into the duodenum.',
    spleen:
      'A lymphoid organ in the upper left abdomen. It filters blood, removes aging blood cells, and participates in immune responses.',
    pancreas:
      'An abdominal organ with digestive and endocrine roles. It supplies enzymes to the small intestine and releases hormones including insulin and glucagon.',
    'urinary bladder':
      'A muscular reservoir in the pelvis that stores urine arriving from the kidneys through the ureters.',
    trachea:
      'The main airway connecting the larynx to the bronchi. Its cartilage supports keep the airway open during breathing.',
    diaphragm:
      'A broad muscle separating the chest and abdomen. When it contracts, it increases chest volume and helps draw air into the lungs.',
  },
} as const;

export type Messages = typeof en;

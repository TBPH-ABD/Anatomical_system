import {flushSync} from 'react-dom';
import {registerAtlasTools} from './agent-tools';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Activity,
  ArrowUpRight,
  ChevronLeft,
  Focus,
  Keyboard,
  Languages,
  Layers3,
  Link2,
  Pause,
  RotateCcw,
  RotateCw,
  Search,
  Star,
  Tag,
  Layers,
  GraduationCap,
  X,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Slider} from '@/components/ui/slider';
import {Switch} from '@/components/ui/switch';
import {Sheet, SheetContent, SheetTitle, SheetDescription} from '@/components/ui/sheet';
import {Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty} from '@/components/ui/combobox';
import AnatomyScene, {type SceneLabel} from './scene';
import {DEFAULT_VISIBLE, SYSTEMS, type Atlas, type Concept, type SceneState, type SystemId, type View} from './anatomy';
import {useI18n} from '@/lib/i18n';
import type {MessageKey} from '@/lib/i18n';
import {normalizeTerm, useAnatomyTerms} from '@/lib/anatomy-terms';
import {useStudy, type Flashcard, type SavedStructure} from '@/lib/study';
import {applyShareState, decodeShareState, shareUrl, type CameraPose} from '@/lib/share-state';
import {filterAtlas} from '@/lib/hidden-structures';
import {useExplainer} from '@/lib/explain';
import {Credit} from './ui/credit';
import {LabelLayer} from './ui/labels';
import {QuizPanel, type QuizPool, type QuizStatus} from './ui/quiz-panel';
import {FlashcardsPanel} from './ui/flashcards-panel';
import {FavoritesPanel} from './ui/favorites-panel';
import {ShortcutsSheet} from './ui/shortcuts-sheet';
import {ExplainButton, ExplainWindow} from './ui/explain-panel';

const initial: SceneState = {explode: 0, visible: DEFAULT_VISIBLE, selected: [], isolate: false, view: 'three-quarter', rotate: false, reset: 0};
type Panel = 'layers' | 'search' | 'quiz' | 'cards' | 'favorites' | null;
const ORGAN_SYSTEMS: SystemId[] = ['cardiac', 'respiratory', 'digestive', 'urinary', 'endocrine', 'reproductive'];
const STARTERS = ['heart', 'brain', 'liver', 'stomach', 'spleen', 'pancreas', 'urinary bladder', 'trachea'];

export default function Home() {
  const {t, n, locale, setLocale, dir} = useI18n();
  const arabic = locale === 'ar';
  const detailTitle = useRef<HTMLHeadingElement>(null);
  const aboutTitle = useRef<HTMLHeadingElement>(null);
  const terms = useAnatomyTerms();
  const study = useStudy();
  const explainer = useExplainer();

  const [atlas, setAtlas] = useState<Atlas | null>(null);
  const [state, setState] = useState(initial);
  const [progress, setProgress] = useState(0);
  const [bytes, setBytes] = useState({done: 0, total: 0});
  const [error, setError] = useState('');
  const [panel, setPanel] = useState<Panel>(null);
  const [details, setDetails] = useState(false);
  const [about, setAbout] = useState(false);
  const [shortcuts, setShortcuts] = useState(false);
  const [query, setQuery] = useState('');
  const [chosen, setChosen] = useState<Concept | null>(null);
  const [labels, setLabels] = useState(false);
  const [sceneLabels, setSceneLabels] = useState<SceneLabel[]>([]);
  const [viewport, setViewport] = useState({width: 0, height: 0});
  const [copied, setCopied] = useState(false);
  const [splash, setSplash] = useState(true);
  const camera = useRef<CameraPose | null>(null);
  const [startCamera] = useState<CameraPose | null>(() => decodeShareState(location.search)?.camera ?? null);

  useEffect(() => {
    const abort = new AbortController();
    const shared = decodeShareState(location.search);
    setProgress(0);
    setError('');
    setAtlas(null);
    setChosen(null);
    setDetails(false);
    setState(applyShareState({...initial, visible: DEFAULT_VISIBLE}, shared ?? {}));
    fetch('/models/atlas.json', {signal: abort.signal})
      .then((response) => {
        if (!response.ok) throw new Error('errors.atlas');
        return response.json();
      })
      .then((data) => {
        const loaded = filterAtlas(data as Atlas);
        setAtlas(loaded);
        const concept = shared?.concept ? loaded.concepts.find((c) => c.id === shared.concept) : undefined;
        if (concept) {
          setChosen(concept);
          setDetails(true);
        }
      })
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setError(e.message);
      });
    return () => abort.abort();
    // The atlas is fetched once; translated error text is resolved at render.
  }, []);

  useEffect(() => {
    const measure = () => setViewport({width: innerWidth, height: innerHeight});
    measure();
    addEventListener('resize', measure);
    return () => removeEventListener('resize', measure);
  }, []);

  const parts = useMemo(() => new Map(atlas?.parts.map((p) => [p.id, p])), [atlas]);
  const counts = useMemo(
    () => Object.fromEntries(SYSTEMS.map((s) => [s.id, atlas?.parts.filter((p) => p.system === s.id).length ?? 0])),
    [atlas],
  );
  const activeSystems = SYSTEMS.filter((s) => counts[s.id] > 0);
  const selectedParts = state.selected.map((id) => parts.get(id)).filter((p) => !!p);
  const selected = selectedParts[0];
  const system = SYSTEMS.find((s) => s.id === selected?.system);
  const visibleCount =
    atlas?.parts.filter((p) => (state.isolate ? state.selected.includes(p.id) : state.visible.includes(p.system) || state.selected.includes(p.id))).length ?? 0;

  /** One naming rule for the whole interface: Arabic when verified, otherwise
   * the source name, never a blank and never an invented term. */
  const conceptName = useCallback((concept: {id: string; name: string}) => terms.display(concept.id, concept.name, arabic), [terms, arabic]);
  const partName = useCallback(
    (id: string) => {
      const part = parts.get(id);
      if (!part) return '';
      return terms.display(part.id, part.name, arabic, part.conceptId);
    },
    [parts, terms, arabic],
  );
  const systemName = useCallback((id: SystemId) => t(`systems.${id}.name` as MessageKey), [t]);
  const explanationFor = useCallback(
    (name: string, id: SystemId) => {
      const key = `explanations.${name.toLowerCase()}` as MessageKey;
      const explained = t(key);
      return explained === key ? t(`systems.${id}.description` as MessageKey) : explained;
    },
    [t],
  );
  const hasExplanation = useCallback((name: string) => t(`explanations.${name.toLowerCase()}` as MessageKey) !== `explanations.${name.toLowerCase()}`, [t]);

  const results = useMemo(() => {
    if (!atlas) return [];
    const term = normalizeTerm(query);
    if (!term) return STARTERS.map((name) => atlas.concepts.find((c) => c.name.toLowerCase() === name)).filter((x): x is Concept => !!x);
    return atlas.concepts
      .filter((c) => terms.haystack(c.id, c.name).includes(term))
      .sort((a, b) => a.name.length - b.name.length)
      .slice(0, 80);
  }, [atlas, query, terms]);

  const choose = useCallback((c: Concept) => {
    setChosen(c);
    setState((s) => ({...s, selected: c.elements, isolate: false, rotate: false}));
    setDetails(true);
    setPanel(null);
  }, []);

  useEffect(() => {
    if (!atlas) return;
    return registerAtlasTools(atlas, (c) => flushSync(() => choose(c)));
  }, [atlas, choose]);

  // ---- Quiz -------------------------------------------------------------
  const [quizOn, setQuizOn] = useState(false);
  const [pool, setPool] = useState<QuizPool>('visible');
  const [question, setQuestion] = useState<Concept | null>(null);
  const [status, setStatus] = useState<QuizStatus>('asking');
  const [wrongName, setWrongName] = useState('');
  const [score, setScore] = useState({asked: 0, correct: 0, streak: 0});

  const questionPool = useMemo(() => {
    if (!atlas) return [];
    const usable = atlas.concepts.filter((c) => c.elements.length > 0 && c.elements.length <= 40);
    if (pool === 'favorites') return usable.filter((c) => study.favorites.some((f) => f.id === c.id));
    if (pool === 'all') return usable;
    const visible = new Set(state.visible);
    return usable.filter((c) => c.elements.some((id) => visible.has(parts.get(id)?.system as SystemId)));
  }, [atlas, pool, state.visible, parts, study.favorites]);

  const nextQuestion = useCallback(() => {
    if (!questionPool.length) {
      setQuestion(null);
      return;
    }
    setQuestion(questionPool[Math.floor(Math.random() * questionPool.length)]);
    setStatus('asking');
    setWrongName('');
  }, [questionPool]);

  useEffect(() => {
    if (quizOn) nextQuestion();
  }, [quizOn, pool, nextQuestion]);

  const answer = useCallback(
    (partId: string) => {
      if (!question) return;
      const part = parts.get(partId);
      const right = question.elements.includes(partId) || part?.conceptId === question.id;
      setScore((s) => ({asked: s.asked + 1, correct: s.correct + (right ? 1 : 0), streak: right ? s.streak + 1 : 0}));
      if (right) {
        setStatus('right');
        setState((s) => ({...s, selected: question.elements, isolate: false, rotate: false}));
      } else {
        setStatus('wrong');
        setWrongName(partName(partId));
      }
    },
    [question, parts, partName],
  );

  // ---- Selection --------------------------------------------------------
  const choosePart = useCallback(
    (id: string) => {
      if (quizOn) {
        answer(id);
        return;
      }
      const p = parts.get(id);
      if (!p) return;
      setChosen({id: p.conceptId, name: p.name, elements: [id]});
      setState((s) => ({...s, selected: [id], isolate: false, rotate: false}));
      setDetails(true);
      setPanel(null);
    },
    [quizOn, answer, parts],
  );

  const toggle = (id: SystemId) => {
    setDetails(false);
    setState((s) => ({...s, selected: [], isolate: false, visible: s.visible.includes(id) ? s.visible.filter((x) => x !== id) : [...s.visible, id]}));
  };
  const reset = useCallback(() => {
    setState((s) => ({...initial, visible: DEFAULT_VISIBLE, reset: s.reset + 1}));
    setChosen(null);
    setDetails(false);
    setPanel(null);
  }, []);
  const openPanel = useCallback((next: Exclude<Panel, null>) => {
    setDetails(false);
    setPanel((p) => (p === next ? null : next));
  }, []);

  const savedEntry: SavedStructure | null = chosen ? {id: chosen.id, name: conceptName(chosen), elements: chosen.elements} : null;
  const openSaved = useCallback(
    (entry: SavedStructure) => {
      const concept = atlas?.concepts.find((c) => c.id === entry.id);
      choose(concept ?? {id: entry.id, name: entry.name, elements: entry.elements});
    },
    [atlas, choose],
  );

  const copyShare = useCallback(() => {
    const url = shareUrl(
      {
        visible: state.visible,
        selected: state.selected,
        isolate: state.isolate,
        explode: state.explode,
        view: state.view,
        concept: chosen?.id,
        camera: camera.current ?? undefined,
      },
      locale,
    );
    void navigator.clipboard?.writeText(url).catch(() => {});
    // The address bar is deliberately left alone: rewriting it would make every
    // later reload reopen this selection instead of starting clean.
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }, [state, chosen, locale]);

  // ---- Keyboard ---------------------------------------------------------
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.metaKey || e.ctrlKey || e.altKey) return;
      const views: View[] = ['three-quarter', 'front', 'side', 'back'];
      const press = e.key.toLowerCase();
      if (press === '/') {
        e.preventDefault();
        setPanel('search');
        setDetails(false);
      } else if (press === 'escape') {
        setPanel(null);
        setDetails(false);
        setAbout(false);
        setShortcuts(false);
      } else if (press === 'l') openPanel('layers');
      else if (press === 'q') setQuizOn((value) => !value);
      else if (press === 'n') setLabels((value) => !value);
      else if (press === 'r') setState((s) => ({...s, rotate: !s.rotate}));
      else if (press === 'i' && state.selected.length) setState((s) => ({...s, isolate: !s.isolate, explode: 0}));
      else if (press === 'f' && savedEntry) study.toggleFavorite(savedEntry);
      else if (press === '0') reset();
      else if (press === '?') setShortcuts(true);
      else if (press === 'a') setAbout(true);
      else if (['1', '2', '3', '4'].includes(press)) {
        const view = views[Number(press) - 1];
        setState((s) => ({...s, view, reset: s.reset + 1, rotate: false}));
      }
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, [openPanel, reset, savedEntry, state.selected.length, study]);

  const labelName = useCallback((index: number) => (atlas ? partName(atlas.parts[index].id) : ''), [atlas, partName]);
  const hoverName = useCallback(
    (index: number) => (quizOn || !atlas ? null : partName(atlas.parts[index].id)),
    [quizOn, atlas, partName],
  );

  const explainInput = useCallback(
    (concept: Concept) => ({
      id: concept.id,
      en: concept.name,
      ar: terms.arabic(concept.id),
      la: terms.latin(concept.id),
      system: selected ? t(`systems.${selected.system}.name` as MessageKey) : undefined,
      locale,
    }),
    [terms, selected, t, locale],
  );
  useEffect(() => {
    explainer.reset();
    // Each structure gets its own explanation; a stale one must not linger.
  }, [chosen?.id, locale, explainer.reset]);

  const title = chosen ? conceptName(chosen) : '';
  const englishTitle = chosen?.name ?? '';
  const latin = chosen ? terms.latin(chosen.id) : undefined;
  const megabytes = (value: number) => (value / 1e6).toFixed(1);

  return (
    <main className="studio" dir={dir}>
      {atlas && (
        <AnatomyScene
          atlas={atlas}
          state={{...state, inspectorOpen: details && selectedParts.length > 0}}
          onSelect={choosePart}
          onProgress={(value, size) => {
            setProgress(value);
            setBytes(size);
            if (value === 100) setError('');
          }}
          onError={setError}
          nameFor={hoverName}
          labels={labels}
          onLabels={setSceneLabels}
          onCamera={(pose) => {
            camera.current = pose;
          }}
          initialCamera={startCamera}
          canvasLabel={t('scene.canvasLabel')}
        />
      )}
      <div className="vignette" />
      {labels && <LabelLayer labels={sceneLabels} nameFor={labelName} width={viewport.width} height={viewport.height} />}

      <header className="identity">
        <div className="eyebrow">
          <span className="status-dot" /> {t('identity.eyebrow')}
        </div>
        <Credit variant="header" />
        <div className="identity-meta">
          {t('identity.meta', {count: atlas?.parts.length ?? 2234})} <span>·</span> {t('identity.source')}
        </div>
      </header>

      <nav className="top-actions" aria-label={t('actions.panels')}>
        <Button variant="ghost" className={panel === 'search' ? 'active' : ''} onClick={() => openPanel('search')} aria-label={t('actions.searchAria')}>
          <Search size={18} />
          <span>{t('actions.search')}</span>
          <kbd>/</kbd>
        </Button>
        <Button
          variant="ghost"
          className={`icon-button ${quizOn ? 'active' : ''}`}
          aria-pressed={quizOn}
          onClick={() => {
            setQuizOn((value) => !value);
            setPanel(null);
            setDetails(false);
          }}
          aria-label={t('actions.quiz')}
          title={t('actions.quiz')}
        >
          <GraduationCap size={18} />
        </Button>
        <Button variant="ghost" className={`icon-button ${panel === 'cards' ? 'active' : ''}`} onClick={() => openPanel('cards')} aria-label={t('actions.flashcards')} title={t('actions.flashcards')}>
          <Layers size={18} />
        </Button>
        <Button variant="ghost" className={`icon-button ${panel === 'favorites' ? 'active' : ''}`} onClick={() => openPanel('favorites')} aria-label={t('actions.favorites')} title={t('actions.favorites')}>
          <Star size={18} />
        </Button>
        <Button variant="ghost" className={`icon-button ${labels ? 'active' : ''}`} aria-pressed={labels} onClick={() => setLabels((value) => !value)} aria-label={t('labels.toggle')} title={t('labels.toggle')}>
          <Tag size={18} />
        </Button>
        <Button variant="ghost" className="icon-button" onClick={copyShare} aria-label={t('actions.share')} title={t('actions.share')}>
          <Link2 size={18} />
        </Button>
        <Button variant="ghost" className="icon-button desktop-only" onClick={() => setShortcuts(true)} aria-label={t('actions.shortcuts')} title={t('actions.shortcuts')}>
          <Keyboard size={18} />
        </Button>
        <Button variant="ghost" className="icon-button" onClick={() => setLocale(arabic ? 'en' : 'ar')} aria-label={t('meta.switchLabel')} title={t('meta.switchTo')}>
          <Languages size={18} />
        </Button>
      </nav>

      <section className={`layers-panel glass ${panel === 'layers' ? 'mobile-open' : ''}`} aria-label={t('systemsPanel.ariaLabel')}>
        <div className="panel-heading">
          <span>{t('systemsPanel.heading')}</span>
          <Button variant="ghost" className="mobile-only icon-button" onClick={() => setPanel(null)} aria-label={t('systemsPanel.closeAria')}>
            <X size={18} />
          </Button>
          <Badge variant="secondary" className="desktop-only small-number">
            {n(activeSystems.length)}
          </Badge>
        </div>
        <div className="layer-presets">
          <Button
            variant="ghost"
            aria-pressed={activeSystems.every((x) => state.visible.includes(x.id))}
            onClick={() => setState((s) => ({...s, selected: [], isolate: false, visible: activeSystems.map((x) => x.id)}))}
          >
            {t('systemsPanel.presetAll')}
          </Button>
          <Button
            variant="ghost"
            aria-pressed={state.visible.length === 1 && state.visible[0] === 'skeletal'}
            onClick={() => setState((s) => ({...s, selected: [], isolate: false, visible: ['skeletal']}))}
          >
            {t('systemsPanel.presetSkeleton')}
          </Button>
          <Button
            variant="ghost"
            aria-pressed={state.visible.length === ORGAN_SYSTEMS.length && ORGAN_SYSTEMS.every((id) => state.visible.includes(id))}
            onClick={() => setState((s) => ({...s, selected: [], isolate: false, visible: [...ORGAN_SYSTEMS]}))}
          >
            {t('systemsPanel.presetOrgans')}
          </Button>
        </div>
        <div className="system-list">
          {activeSystems.map((s) => (
            <div className={`system-row ${state.visible.includes(s.id) ? 'enabled' : ''}`} key={s.id}>
              <Button
                variant="ghost"
                className="system-name"
                title={t('systemsPanel.showOnly', {name: systemName(s.id)})}
                onClick={() => setState((v) => ({...v, visible: [s.id], isolate: false, selected: []}))}
              >
                <span className="system-dot" style={{background: s.color}} />
                {systemName(s.id)}
                <span className="system-count">{n(counts[s.id])}</span>
              </Button>
              <Switch checked={state.visible.includes(s.id)} onCheckedChange={() => toggle(s.id)} aria-label={t('systemsPanel.show', {name: systemName(s.id)})} />
            </div>
          ))}
        </div>
        <div className="panel-foot">
          <span>{t('systemsPanel.visible', {count: visibleCount})}</span>
          <Button variant="ghost" onClick={() => setState((s) => ({...s, visible: [], selected: [], isolate: false}))}>
            {t('systemsPanel.hideAll')}
          </Button>
        </div>
      </section>

      {panel === 'search' && (
        <section className="search-panel glass" aria-label={t('search.ariaLabel')}>
          <div className="panel-heading">
            <span>{t('search.heading')}</span>
            <Button variant="ghost" className="icon-button" onClick={() => setPanel(null)} aria-label={t('search.closeAria')}>
              <X size={18} />
            </Button>
          </div>
          <Combobox<Concept>
            items={results}
            value={null}
            onValueChange={(value) => {
              if (value) choose(value);
            }}
            inputValue={query}
            onInputValueChange={setQuery}
            itemToStringLabel={conceptName}
            filter={null}
            open
            onOpenChange={(open) => {
              if (!open) setPanel(null);
            }}
          >
            <ComboboxInput autoFocus placeholder={t('search.placeholder')} aria-label={t('search.inputAria')} showTrigger={false} />
            <ComboboxContent className="anatomy-search-results">
              <ComboboxEmpty>{t('search.empty')}</ComboboxEmpty>
              <ComboboxList>
                {(c: Concept) => (
                  <ComboboxItem key={c.id} value={c}>
                    <span className="search-result-name">
                      {conceptName(c)}
                      {arabic && conceptName(c) !== c.name && <em className="search-result-en">{c.name}</em>}
                    </span>
                    <span className="small-number">
                      {n(c.elements.length)} {c.elements.length === 1 ? t('search.piece') : t('search.pieces')}
                    </span>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          <p className="search-note">{query ? t('search.noteQuery') : t('search.noteIdle')}</p>
        </section>
      )}

      {quizOn && (
        <QuizPanel
          quiz={{
            pool,
            status: questionPool.length ? status : 'empty',
            question: question ? `${systemName((parts.get(question.elements[0])?.system ?? 'skeletal') as SystemId)} · ${n(question.elements.length)} ${t('search.pieces')}` : '',
            answer: question ? conceptName(question) : '',
            wrongName,
            asked: score.asked,
            correct: score.correct,
            streak: score.streak,
          }}
          onPool={setPool}
          onReveal={() => {
            setStatus('revealed');
            if (question) setState((s) => ({...s, selected: question.elements, isolate: false}));
          }}
          onSkip={nextQuestion}
          onNext={() => {
            setState((s) => ({...s, selected: []}));
            nextQuestion();
          }}
          onExit={() => {
            setQuizOn(false);
            setState((s) => ({...s, selected: []}));
          }}
        />
      )}

      {panel === 'cards' && (
        <FlashcardsPanel
          cards={study.cards}
          onRemove={study.removeCard}
          onClear={study.clearCards}
          onClose={() => setPanel(null)}
          onOpen={(card: Flashcard) => openSaved(card)}
        />
      )}

      {panel === 'favorites' && (
        <FavoritesPanel
          favorites={study.favorites}
          lists={study.lists}
          nameFor={(entry) => {
            const concept = atlas?.concepts.find((c) => c.id === entry.id);
            return concept ? conceptName(concept) : entry.name;
          }}
          onOpen={openSaved}
          onRemove={study.toggleFavorite}
          onCreateList={study.createList}
          onDeleteList={study.deleteList}
          onToggleMember={study.toggleMember}
          onClose={() => setPanel(null)}
        />
      )}

      <nav className="view-controls glass" aria-label={t('view.ariaLabel')}>
        {(['three-quarter', 'front', 'side', 'back'] as View[]).map((v) => (
          <Button
            variant="ghost"
            key={v}
            className={state.view === v ? 'active' : ''}
            aria-pressed={state.view === v}
            disabled={state.explode > 0.8 && v !== 'front'}
            onClick={() => setState((s) => ({...s, view: v, reset: s.reset + 1, rotate: false}))}
            title={t(`view.${v}` as MessageKey)}
            aria-label={t(`view.${v}` as MessageKey)}
          >
            <span>
              {t(
                (v === 'three-quarter'
                  ? 'view.abbrThreeQuarter'
                  : v === 'front'
                    ? 'view.abbrFront'
                    : v === 'side'
                      ? 'view.abbrSide'
                      : 'view.abbrBack') as MessageKey,
              )}
            </span>
          </Button>
        ))}
        <i />
        <Button
          variant="ghost"
          disabled={state.explode >= 0.4}
          aria-label={state.rotate ? t('view.rotateOn') : t('view.rotateOff')}
          title={t('view.rotate')}
          className={state.rotate ? 'active' : ''}
          onClick={() => setState((s) => ({...s, rotate: !s.rotate}))}
        >
          {state.rotate ? <Pause size={17} /> : <RotateCw size={18} />}
        </Button>
        <Button variant="ghost" aria-label={t('view.resetAria')} title={t('view.reset')} onClick={reset}>
          <RotateCcw size={17} />
        </Button>
      </nav>

      <div className="scene-caption">
        <span className="caption-line" />
        <span>
          {state.isolate
            ? (title || t('caption.selected'))
            : state.explode > 0.95
              ? t('caption.inventory')
              : state.explode > 0.05
                ? t('caption.separated')
                : t('caption.assembled')}
        </span>
        <span className="caption-line" />
      </div>

      <div className="bottom-dock glass">
        <Button variant="ghost" className="mobile-only dock-layers" onClick={() => openPanel('layers')} aria-label={t('dock.layersAria')}>
          <Layers3 size={20} />
          <span>{t('dock.layers')}</span>
        </Button>
        <div className="explode-control">
          <div className="explode-label">
            <label id="explode-label">{t('dock.explode')}</label>
            <output>
              {n(Math.round(state.explode * 100))}
              <span>%</span>
            </output>
          </div>
          <Slider
            aria-labelledby="explode-label"
            min={0}
            max={100}
            step={1}
            value={[state.explode * 100]}
            onValueChange={(v) =>
              setState((s) => ({
                ...s,
                explode: (Array.isArray(v) ? v[0] : v) / 100,
                view: (Array.isArray(v) ? v[0] : v) > 80 ? 'front' : s.view,
                rotate: false,
              }))
            }
          />
          <div className="slider-endpoints">
            <span>{t('dock.assembled')}</span>
            <span>{t('dock.everyPiece')}</span>
          </div>
        </div>
        <Button variant="ghost" className="dock-reset" onClick={reset} aria-label={t('dock.resetAria')}>
          <RotateCcw size={18} />
          <span>{t('dock.reset')}</span>
        </Button>
      </div>

      <footer className="studio-footer">
        <span className="footer-hints">
          {state.explode > 0.8 ? t('footer.pan') : t('footer.orbit')} <b>·</b> {t('footer.zoom')} <b>·</b> {t('footer.inspect')}
        </span>
      </footer>

      {copied && (
        <div className="toast glass" role="status">
          {t('share.copied')}
        </div>
      )}

      {progress < 100 && !error && (
        <div className="loading glass" role="status">
          <Activity size={18} />
          <div>
            <strong>{t('loading.title')}</strong>
            <span>
              {t('loading.detail', {percent: n(progress), count: atlas?.parts.length ?? 2234})}
              {bytes.total > 0 && ` · ${t('loading.downloaded', {done: megabytes(bytes.done), total: megabytes(bytes.total)})}`}
            </span>
            <div className="loading-track">
              <i style={{width: `${progress}%`}} />
            </div>
          </div>
        </div>
      )}
      {error && (
        <div className="loading glass error" role="alert">
          <p>{error.startsWith('errors.') ? t(error as MessageKey) : error}</p>
          <Button variant="ghost" onClick={() => location.reload()}>
            {t('loading.reload')}
          </Button>
        </div>
      )}

      {splash && !error && (
        <div className="splash" role="dialog" aria-modal="false" aria-label={t('identity.title')}>
          <div className="splash-card glass">
            <Credit variant="splash" />
            <Button className="primary-action" onClick={() => setSplash(false)} disabled={!atlas}>
              {atlas ? t('splash.enter') : t('splash.preparing')}
            </Button>
          </div>
        </div>
      )}

      <Sheet open={details && selectedParts.length > 0 && !quizOn} modal={false} disablePointerDismissal onOpenChange={setDetails}>
        <SheetContent initialFocus={detailTitle} className={`detail-sheet glass ${state.isolate ? 'is-isolated' : ''}`} showCloseButton>
          <div className="detail-header">
            <div className="detail-accent" style={{background: system?.color}} />
            <div className="eyebrow">{system ? systemName(system.id) : t('detail.fallbackSystem')}</div>
            <SheetTitle ref={detailTitle} tabIndex={-1} className="structure-title">
              {title}
            </SheetTitle>
            {/* Exams are written in English, so the source term stays visible. */}
            {englishTitle !== title && <p className="structure-alt">{englishTitle}</p>}
            {latin && <p className="structure-latin">{latin}</p>}
          </div>
          <div className="detail-scroll" key={`${chosen?.id}-${state.isolate}`}>
            <SheetDescription className="structure-description">
              {chosen && selected ? explanationFor(chosen.name, selected.system) : ''}
            </SheetDescription>
            {chosen && !hasExplanation(chosen.name) && <span className="context-note">{t('detail.contextNote')}</span>}
            <div className="structure-meta">
              <span>
                {t('detail.selectedPieces')}
                <strong>{n(state.selected.length)}</strong>
              </span>
              <span>
                {t('detail.system')}
                <strong>{system ? systemName(system.id) : t('detail.fallbackSystem')}</strong>
              </span>
            </div>
            {selectedParts.length > 1 && (
              <div className="member-list">
                <h3>{t('detail.included')}</h3>
                {selectedParts.slice(0, 50).map((p) => (
                  <Button variant="ghost" key={p.id} onClick={() => choosePart(p.id)}>
                    <span>{partName(p.id)}</span>
                    <ChevronLeft size={14} className="flip-inline" />
                  </Button>
                ))}
                {selectedParts.length > 50 && <p>{t('detail.andMore', {count: selectedParts.length - 50})}</p>}
              </div>
            )}
          </div>
          <div className="detail-actions">
            <ExplainButton onStart={() => chosen && void explainer.start(explainInput(chosen))} />
            <Button className={`primary-action ${state.isolate ? 'active' : ''}`} onClick={() => setState((s) => ({...s, isolate: !s.isolate, explode: 0}))}>
              <Focus size={18} />
              {state.isolate ? t('detail.unisolate') : t('detail.isolate')}
              <ChevronLeft size={16} className="flip-inline" />
            </Button>
            <div className="detail-saves">
              <Button
                variant="ghost"
                className="secondary-action"
                aria-pressed={!!savedEntry && study.isFavorite(savedEntry.id)}
                onClick={() => savedEntry && study.toggleFavorite(savedEntry)}
              >
                <Star size={14} />
                {savedEntry && study.isFavorite(savedEntry.id) ? t('detail.removeFavorite') : t('detail.addFavorite')}
              </Button>
              <Button
                variant="ghost"
                className="secondary-action"
                disabled={!chosen || study.hasCard(chosen.id)}
                onClick={() =>
                  chosen &&
                  study.addCard({
                    id: chosen.id,
                    name: conceptName(chosen),
                    en: chosen.name,
                    ar: terms.arabic(chosen.id),
                    elements: chosen.elements,
                    system: selected?.system,
                  })
                }
              >
                <Layers size={14} />
                {chosen && study.hasCard(chosen.id) ? t('flashcards.added') : t('detail.addFlashcard')}
              </Button>
            </div>
            <Button
              variant="ghost"
              className="secondary-action"
              onClick={() => {
                setState((s) => ({...s, selected: [], isolate: false}));
                setDetails(false);
              }}
            >
              {t('detail.clear')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <ExplainWindow
        phase={explainer.phase}
        title={title}
        text={explainer.text}
        error={explainer.error}
        onRetry={() => chosen && void explainer.confirm(explainInput(chosen))}
        onClose={explainer.reset}
      />

      <ShortcutsSheet open={shortcuts} onOpenChange={setShortcuts} />

      <Sheet open={about} onOpenChange={setAbout}>
        {/* The side sheet enters from the inline end, which mirrors with the page. */}
        <SheetContent className="about-sheet glass" side={dir === 'rtl' ? 'left' : 'right'} initialFocus={aboutTitle}>
          <div className="eyebrow">{t('about.eyebrow')}</div>
          <SheetTitle ref={aboutTitle} tabIndex={-1} className="structure-title">
            {t('about.title')}
          </SheetTitle>
          <SheetDescription>{t('about.lead')}</SheetDescription>
          <div className="about-copy">
            <p>
              <strong>{t('about.scopeTitle')}</strong>
              <br />
              {t('about.scopeBody')}
            </p>
            <p>{t('about.caveat')}</p>
            <p>{t('about.disclaimer')}</p>
            <h3>{t('about.termsHeading')}</h3>
            <p>{t('about.termsBody')}</p>
            <h3>{t('about.sourceHeading')}</h3>
            <p>{t('about.sourceBody')}</p>
            <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html" target="_blank" rel="noreferrer">
              {t('about.licenseLink')} <ArrowUpRight size={14} />
            </a>
            <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html" target="_blank" rel="noreferrer">
              {t('about.geometryLink')} <ArrowUpRight size={14} />
            </a>
            <a href="https://academic.oup.com/nar/article/37/suppl_1/D782/1000752" target="_blank" rel="noreferrer">
              {t('about.paperLink')} <ArrowUpRight size={14} />
            </a>
            <Credit variant="splash" />
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}

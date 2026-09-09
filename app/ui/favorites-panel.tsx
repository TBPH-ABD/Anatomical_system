import {useState} from 'react';
import {ChevronLeft, Plus, Star, Trash2, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useI18n} from '@/lib/i18n';
import type {SavedStructure, StudyList} from '@/lib/study';

interface Props {
  favorites: SavedStructure[];
  lists: StudyList[];
  nameFor: (entry: SavedStructure) => string;
  onOpen: (entry: SavedStructure) => void;
  onRemove: (entry: SavedStructure) => void;
  onCreateList: (name: string) => void;
  onDeleteList: (id: string) => void;
  onToggleMember: (listId: string, structureId: string) => void;
  onClose: () => void;
}

export function FavoritesPanel({favorites, lists, nameFor, onOpen, onRemove, onCreateList, onDeleteList, onToggleMember, onClose}: Props) {
  const {t} = useI18n();
  const [draft, setDraft] = useState('');
  const [active, setActive] = useState<string>('all');
  const list = lists.find((entry) => entry.id === active);
  const shown = list ? favorites.filter((entry) => list.members.includes(entry.id)) : favorites;

  return (
    <section className="favorites-panel glass" aria-label={t('favorites.ariaLabel')}>
      <div className="panel-heading">
        <span>{t('favorites.title')}</span>
        <Button variant="ghost" className="icon-button" onClick={onClose} aria-label={t('actions.close')}>
          <X size={18} />
        </Button>
      </div>
      <div className="list-tabs" role="tablist" aria-label={t('favorites.title')}>
        <Button variant="ghost" role="tab" aria-selected={active === 'all'} onClick={() => setActive('all')}>
          {t('favorites.all')}
        </Button>
        {lists.map((entry) => (
          <Button key={entry.id} variant="ghost" role="tab" aria-selected={active === entry.id} onClick={() => setActive(entry.id)}>
            {entry.name}
          </Button>
        ))}
      </div>
      <form
        className="list-create"
        onSubmit={(event) => {
          event.preventDefault();
          const name = draft.trim();
          if (!name) return;
          onCreateList(name);
          setDraft('');
        }}
      >
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={t('favorites.listPlaceholder')} aria-label={t('favorites.listName')} />
        <Button variant="ghost" type="submit" aria-label={t('favorites.create')}>
          <Plus size={16} />
        </Button>
      </form>
      {!shown.length ? (
        <p className="panel-empty">{t('favorites.empty')}</p>
      ) : (
        <ul className="favorite-list">
          {shown.map((entry) => (
            <li key={entry.id}>
              <Button variant="ghost" className="favorite-name" onClick={() => onOpen(entry)}>
                <Star size={13} />
                <span>{nameFor(entry)}</span>
                <ChevronLeft size={14} className="flip-inline" />
              </Button>
              {list ? (
                <Button variant="ghost" className="icon-button" onClick={() => onToggleMember(list.id, entry.id)} aria-label={t('favorites.remove')}>
                  <X size={14} />
                </Button>
              ) : (
                <>
                  {lists.map((target) => (
                    <Button
                      key={target.id}
                      variant="ghost"
                      className="list-chip"
                      aria-pressed={target.members.includes(entry.id)}
                      onClick={() => onToggleMember(target.id, entry.id)}
                      title={`${t('favorites.addTo')}: ${target.name}`}
                    >
                      {target.name.slice(0, 2)}
                    </Button>
                  ))}
                  <Button variant="ghost" className="icon-button" onClick={() => onRemove(entry)} aria-label={t('detail.removeFavorite')}>
                    <Trash2 size={14} />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="panel-foot">
        <span>{t('favorites.count', {count: shown.length})}</span>
        {list && (
          <Button variant="ghost" onClick={() => { onDeleteList(list.id); setActive('all'); }}>
            {t('favorites.delete')}
          </Button>
        )}
      </div>
    </section>
  );
}

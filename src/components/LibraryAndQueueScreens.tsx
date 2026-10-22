import React, { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Clock,
  Disc,
  Folder,
  Heart,
  ListMusic,
  Music,
  Play,
  Plus,
  Search,
  Trash2,
  Upload,
  User,
} from 'lucide-react';
import { ColorPalette, Playlist, Track } from '../types/audio';

interface LibraryScreenProps {
  tracks: Track[];
  currentTrackId: string;
  isPlaying: boolean;
  palette: ColorPalette;
  onSelectTrack: (track: Track) => void;
  onToggleFavorite: (trackId: string) => void;
  onImportFiles: (files: FileList) => void;
  onDeleteTrack?: (trackId: string) => void;
}

export const MusicLibraryScreen: React.FC<LibraryScreenProps> = ({
  tracks,
  currentTrackId,
  isPlaying,
  palette,
  onSelectTrack,
  onToggleFavorite,
  onImportFiles,
  onDeleteTrack,
}) => {
  const [subTab, setSubTab] = useState<
    'songs' | 'albums' | 'artists' | 'folders' | 'favorites' | 'recent'
  >('songs');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const tabs: Array<{
    id: 'songs' | 'albums' | 'artists' | 'folders' | 'favorites' | 'recent';
    label: string;
  }> = [
    { id: 'songs', label: 'Songs' },
    { id: 'albums', label: 'Albums' },
    { id: 'artists', label: 'Artists' },
    { id: 'folders', label: 'Folders' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'recent', label: 'Recent' },
  ];

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Grouping logic for Albums / Artists / Folders
  const getGroupedItems = (field: 'album' | 'artist' | 'folder') => {
    const map = new Map<string, Track[]>();
    tracks.forEach((t) => {
      const key = t[field];
      const list = map.get(key) || [];
      list.push(t);
      map.set(key, list);
    });
    return Array.from(map.entries());
  };

  const displayedTracks = (() => {
    if (selectedGroup) {
      if (subTab === 'albums') return tracks.filter((t) => t.album === selectedGroup);
      if (subTab === 'artists') return tracks.filter((t) => t.artist === selectedGroup);
      if (subTab === 'folders') return tracks.filter((t) => t.folder === selectedGroup);
    }
    if (subTab === 'favorites') return tracks.filter((t) => t.isFavorite);
    if (subTab === 'recent') {
      return [...tracks]
        .filter((t) => t.lastPlayedAt)
        .sort((a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0));
    }
    return tracks;
  })();

  const showGroupCards =
    !selectedGroup && (subTab === 'albums' || subTab === 'artists' || subTab === 'folders');

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Top Sub-Navigation & Local File Import */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
          {tabs.map((t) => {
            const active = subTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSubTab(t.id);
                  setSelectedGroup(null);
                }}
                className={`px-2 py-1 rounded-xl text-[10px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'r2-card-cyan text-white font-semibold'
                    : 'r2-card-violet text-cyan-200/75 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onImportFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Import Local MP3/WAV/FLAC Audio Files"
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl r2-card-cyan text-[10px] font-semibold text-white shrink-0 hover:scale-105 transition-transform cursor-pointer"
        >
          <Upload className="w-3 h-3 text-cyan-300" />
          <span>Import</span>
        </button>
      </div>

      {selectedGroup && (
        <div className="flex items-center justify-between px-2.5 py-1 rounded-xl r2-card-violet text-xs">
          <span className="truncate font-semibold text-cyan-200">{selectedGroup}</span>
          <button
            type="button"
            onClick={() => setSelectedGroup(null)}
            className="text-[10px] text-cyan-300 hover:underline ml-2 shrink-0 cursor-pointer"
          >
            Back to {subTab}
          </button>
        </div>
      )}

      {/* Group Cards View (Albums / Artists / Folders) */}
      {showGroupCards ? (
        <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2 pr-0.5">
          {getGroupedItems(
            subTab === 'albums' ? 'album' : subTab === 'artists' ? 'artist' : 'folder'
          ).map(([groupName, groupTracks]) => (
            <button
              key={groupName}
              type="button"
              onClick={() => setSelectedGroup(groupName)}
              className="rounded-2xl r2-card-violet p-2.5 flex flex-col items-start gap-1.5 text-left hover:border-cyan-400/70 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 w-full">
                <img
                  src={groupTracks[0].coverArt}
                  alt={groupName}
                  className="w-10 h-10 rounded-xl object-cover border border-cyan-300/40 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white truncate">
                    {groupName}
                  </div>
                  <div className="text-[10px] text-cyan-200/75">
                    {groupTracks.length} {groupTracks.length === 1 ? 'track' : 'tracks'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-purple-200/70 font-mono-tech">
                {subTab === 'albums' && <Disc className="w-3 h-3 text-cyan-300" />}
                {subTab === 'artists' && <User className="w-3 h-3 text-cyan-300" />}
                {subTab === 'folders' && <Folder className="w-3 h-3 text-cyan-300" />}
                <span className="truncate">{groupTracks[0].sampleRate}</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* Track List View */
        <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-0.5">
          {displayedTracks.length === 0 ? (
            <div className="flex-1 rounded-2xl r2-card-violet p-6 flex flex-col items-center justify-center text-center">
              <Music className="w-6 h-6 text-cyan-300/60 mb-2" />
              <p className="text-xs text-cyan-100/80">No tracks in this view yet.</p>
            </div>
          ) : (
            displayedTracks.map((track) => {
              const isCurrent = track.id === currentTrackId;
              return (
                <div
                  key={track.id}
                  onClick={() => onSelectTrack(track)}
                  className={`group rounded-2xl p-2 flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                    isCurrent ? 'r2-card-cyan' : 'r2-card-violet hover:border-cyan-400/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-cyan-300/50">
                      <img
                        src={track.coverArt}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                      {isCurrent && (
                        <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
                          <Play
                            className="w-4 h-4 text-cyan-300 fill-cyan-300"
                            style={{
                              filter: `drop-shadow(0 0 6px ${palette.primary})`,
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white truncate">
                        {track.title}
                      </div>
                      <div className="text-[10px] text-cyan-200/75 truncate">
                        {track.artist} · {track.album}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="font-mono-tech text-[10px] text-cyan-200/80 mr-1">
                      {formatTime(track.duration)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(track.id);
                      }}
                      title="Toggle Favorite"
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          track.isFavorite
                            ? 'text-pink-400 fill-pink-400'
                            : 'text-cyan-200/60'
                        }`}
                      />
                    </button>
                    {track.isLocalFile && onDeleteTrack && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTrack(track.id);
                        }}
                        title="Delete Stored Audio File"
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-pink-400/80 hover:text-pink-300 hover:bg-pink-500/10 active:scale-95 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

interface SearchScreenProps {
  tracks: Track[];
  currentTrackId: string;
  onSelectTrack: (track: Track) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({
  tracks,
  currentTrackId,
  onSelectTrack,
}) => {
  const [query, setQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'fav' | 'fast' | 'local'>('all');

  const filtered = tracks.filter((t) => {
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q) ||
      t.folder.toLowerCase().includes(q);

    if (!matchesQuery) return false;
    if (filterMode === 'fav') return t.isFavorite;
    if (filterMode === 'fast') return t.bpm >= 124;
    if (filterMode === 'local') return Boolean(t.isLocalFile);
    return true;
  });

  return (
    <div className="flex flex-col h-full gap-2.5">
      {/* Holographic Search Input Bar */}
      <div className="r2-command-capsule rounded-2xl px-3 py-2 flex items-center gap-2">
        <Search className="w-4 h-4 text-cyan-300 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs, artists, albums, folders..."
          className="bg-transparent text-xs text-white placeholder-cyan-200/50 focus:outline-none w-full"
        />
      </div>

      {/* Filter buttons */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { id: 'all', label: 'All Tracks' },
          { id: 'fav', label: 'Favorites' },
          { id: 'fast', label: '124+ BPM' },
          { id: 'local', label: 'Imported' },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilterMode(f.id as 'all' | 'fav' | 'fast' | 'local')}
            className={`py-1 px-2 rounded-xl text-[10px] font-medium cursor-pointer truncate ${
              filterMode === f.id
                ? 'r2-card-cyan text-white font-semibold'
                : 'r2-card-violet text-cyan-200/75 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-0.5">
        {filtered.map((t) => {
          const isCurrent = t.id === currentTrackId;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectTrack(t)}
              className={`rounded-2xl p-2 flex items-center justify-between gap-2 text-left transition-all cursor-pointer ${
                isCurrent ? 'r2-card-cyan' : 'r2-card-violet hover:border-cyan-400/50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={t.coverArt}
                  alt={t.title}
                  className="w-9 h-9 rounded-xl object-cover border border-cyan-300/40 shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">
                    {t.title}
                  </div>
                  <div className="text-[10px] text-cyan-200/75 truncate">
                    {t.artist} · {t.bpm} BPM
                  </div>
                </div>
              </div>
              <span className="font-mono-tech text-[10px] text-cyan-300 shrink-0">
                PLAY
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface QueueScreenProps {
  queueIds: string[];
  tracks: Track[];
  currentTrackId: string;
  playlists: Playlist[];
  onSelectTrack: (track: Track) => void;
  onMoveInQueue: (index: number, direction: -1 | 1) => void;
  onRemoveFromQueue: (index: number) => void;
  onCreatePlaylist: (name: string) => void;
  onLoadPlaylist: (playlist: Playlist) => void;
}

export const QueueAndPlaylistScreen: React.FC<QueueScreenProps> = ({
  queueIds,
  tracks,
  currentTrackId,
  playlists,
  onSelectTrack,
  onMoveInQueue,
  onRemoveFromQueue,
  onCreatePlaylist,
  onLoadPlaylist,
}) => {
  const [view, setView] = useState<'queue' | 'playlists'>('queue');
  const [playlistName, setPlaylistName] = useState('');

  const queueTracks = queueIds
    .map((id) => tracks.find((t) => t.id === id))
    .filter((t): t is Track => Boolean(t));

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistName.trim()) return;
    onCreatePlaylist(playlistName.trim());
    setPlaylistName('');
  };

  return (
    <div className="flex flex-col h-full gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="grid grid-cols-2 gap-1.5 flex-1">
          <button
            type="button"
            onClick={() => setView('queue')}
            className={`py-1.5 px-3 rounded-xl text-xs font-medium cursor-pointer flex items-center justify-center gap-1.5 ${
              view === 'queue'
                ? 'r2-card-cyan text-white font-semibold'
                : 'r2-card-violet text-cyan-200/75'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" /> Active Queue ({queueTracks.length})
          </button>
          <button
            type="button"
            onClick={() => setView('playlists')}
            className={`py-1.5 px-3 rounded-xl text-xs font-medium cursor-pointer flex items-center justify-center gap-1.5 ${
              view === 'playlists'
                ? 'r2-card-cyan text-white font-semibold'
                : 'r2-card-violet text-cyan-200/75'
            }`}
          >
            <Disc className="w-3.5 h-3.5" /> Playlists ({playlists.length})
          </button>
        </div>
      </div>

      {view === 'queue' ? (
        <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-0.5">
          {queueTracks.map((track, idx) => {
            const isCurrent = track.id === currentTrackId;
            return (
              <div
                key={`${track.id}-${idx}`}
                className={`rounded-2xl p-2 flex items-center justify-between gap-2 ${
                  isCurrent ? 'r2-card-cyan' : 'r2-card-violet'
                }`}
              >
                <div
                  onClick={() => onSelectTrack(track)}
                  className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                >
                  <span className="font-mono-tech text-[10px] text-cyan-300/80 w-4">
                    {(idx + 1).toString().padStart(2, '0')}
                  </span>
                  <img
                    src={track.coverArt}
                    alt={track.title}
                    className="w-8 h-8 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white truncate">
                      {track.title}
                    </div>
                    <div className="text-[10px] text-cyan-200/70 truncate">
                      {track.artist}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => onMoveInQueue(idx, -1)}
                    title="Move Up"
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-white/10 disabled:opacity-30 active:scale-95 transition-all cursor-pointer"
                  >
                    <ArrowUp className="w-4 h-4 text-cyan-200" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === queueTracks.length - 1}
                    onClick={() => onMoveInQueue(idx, 1)}
                    title="Move Down"
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-white/10 disabled:opacity-30 active:scale-95 transition-all cursor-pointer"
                  >
                    <ArrowDown className="w-4 h-4 text-cyan-200" />
                  </button>
                  <button
                    type="button"
                    disabled={queueTracks.length <= 1}
                    onClick={() => onRemoveFromQueue(idx)}
                    title="Remove From Queue"
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-pink-500/15 disabled:opacity-30 active:scale-95 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-pink-300" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-0.5">
          <form onSubmit={handleCreate} className="flex items-center gap-1.5">
            <input
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="Save current queue as playlist..."
              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-cyan-400/50 text-xs text-white focus:outline-none"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl r2-card-cyan text-xs font-semibold text-white flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Save
            </button>
          </form>

          {playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => onLoadPlaylist(pl)}
              className="rounded-2xl r2-card-violet p-3 flex items-center justify-between cursor-pointer hover:border-cyan-400/60 transition-all"
            >
              <div>
                <div className="text-xs font-semibold text-white">{pl.name}</div>
                <div className="text-[10px] text-cyan-200/75">
                  {pl.description} · {pl.trackIds.length} tracks
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl r2-card-cyan text-[10px] font-semibold text-white">
                Load
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

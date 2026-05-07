'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type VideoData = {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnail: string | null;
};

type State = { status: 'loading' } | { status: 'ready'; video: VideoData } | { status: 'empty' };

type Props = {
  watched: boolean;
  onWatched: () => void;
};

export function YoutubePlayer({ watched, onWatched }: Props) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    fetch('/api/youtube/latest')
      .then((r) => r.json())
      .then((data) => {
        if (data.videoId) {
          setState({ status: 'ready', video: data });
        } else {
          setState({ status: 'empty' });
        }
      })
      .catch(() => setState({ status: 'empty' }));
  }, []);

  useEffect(() => {
    if (state.status === 'empty' && !watched) {
      onWatched();
    }
  }, [state.status, watched, onWatched]);

  if (state.status === 'loading') {
    return (
      <div className="border-border bg-surface rounded-2xl border p-4">
        <div className="mb-3 h-5 w-40 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
        <div className="aspect-video w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="mt-2 h-4 w-3/4 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  if (state.status === 'empty') return null;

  const { video } = state;
  return (
    <div className="border-border bg-surface rounded-2xl border p-4">
      <h2 className="mb-3 font-bold">📺 Video devocional de hoy</h2>
      <iframe
        src={`https://www.youtube.com/embed/${video.videoId}`}
        title={video.title}
        className="aspect-video w-full rounded-xl"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
      <p className="mt-2 text-xs leading-snug text-gray-500 dark:text-gray-400">{video.title}</p>
      <button
        type="button"
        onClick={watched ? undefined : onWatched}
        className={cn(
          'mt-3 w-full rounded-xl py-2.5 text-sm font-semibold transition-colors',
          watched
            ? 'cursor-default bg-green-500 text-white'
            : 'border-2 border-blue-500 text-blue-600 dark:text-blue-400',
        )}
      >
        {watched ? '✓ Video visto' : 'Marcar video como visto ✓'}
      </button>
    </div>
  );
}

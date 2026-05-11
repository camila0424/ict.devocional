'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement,
        options: {
          videoId: string;
          width?: string;
          height?: string;
          events: {
            onStateChange?: (event: { data: number }) => void;
          };
        },
      ) => { destroy: () => void };
      PlayerState: { ENDED: number };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

type VideoData = { videoId: string; title: string; publishedAt: string; thumbnail: string | null };
type State = { status: 'loading' } | { status: 'ready'; video: VideoData } | { status: 'empty' };

type Props = {
  dayNumber: number;
  month: number;
  watched: boolean;
  onWatched: () => void;
  onAvailabilityChange: (available: boolean) => void;
};

export function YoutubePlayer({
  dayNumber,
  month,
  watched,
  onWatched,
  onAvailabilityChange,
}: Props) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [completed, setCompleted] = useState(watched);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const onWatchedRef = useRef(onWatched);
  useEffect(() => {
    onWatchedRef.current = onWatched;
  }, [onWatched]);

  useEffect(() => {
    fetch(`/api/youtube/latest?day=${dayNumber}&month=${month}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.videoId) {
          setState({ status: 'ready', video: data });
          onAvailabilityChange(true);
        } else {
          setState({ status: 'empty' });
          onAvailabilityChange(false);
        }
      })
      .catch(() => {
        setState({ status: 'empty' });
        onAvailabilityChange(false);
      });
  }, [dayNumber, month, onAvailabilityChange]);

  useEffect(() => {
    if (state.status !== 'ready') return;
    const videoId = state.video.videoId;
    let player: { destroy: () => void } | null = null;

    const initPlayer = () => {
      if (!playerContainerRef.current) return;
      player = new window.YT.Player(playerContainerRef.current, {
        videoId,
        width: '100%',
        height: '100%',
        events: {
          onStateChange: (event) => {
            if (event.data === 0) {
              setCompleted(true);
              onWatchedRef.current();
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        initPlayer();
      };
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(script);
      }
    }

    return () => {
      player?.destroy();
    };
  }, [state]);

  if (state.status === 'loading') {
    return (
      <div className="border-border bg-surface rounded-2xl border p-4">
        <div className="mb-3 h-5 w-40 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
        <div className="aspect-video w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="mt-2 h-4 w-3/4 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  if (state.status === 'empty') {
    return (
      <div className="border-border bg-surface rounded-2xl border p-5 text-center">
        <div className="mb-2 text-4xl">🙏</div>
        <p className="text-sm font-semibold">El video de hoy aún no se ha publicado</p>
        <p className="text-muted mt-1 text-xs">
          Mientras tanto, medita en la Palabra de Dios y permite que Su voz hable a tu corazón.
        </p>
      </div>
    );
  }

  const { video } = state;
  return (
    <div className="border-border bg-surface rounded-2xl border p-4">
      <h2 className="mb-3 font-bold">📺 Video devocional de hoy</h2>
      <div className="aspect-video w-full overflow-hidden rounded-xl [&>iframe]:h-full [&>iframe]:w-full">
        <div ref={playerContainerRef} className="h-full w-full" />
      </div>
      <p className="text-muted mt-2 text-xs leading-snug">{video.title}</p>
      {completed ? (
        <p className="mt-3 text-center text-sm font-semibold text-green-600 dark:text-green-400">
          ✓ Video completado
        </p>
      ) : (
        <p className="text-muted mt-3 text-center text-sm">
          ▶ Mira el video completo para continuar
        </p>
      )}
    </div>
  );
}

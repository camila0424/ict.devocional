'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { ArrowLeft, ImagePlus, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BibleVersion } from '@/lib/bible-reader';

const VERSE_FONT_FAMILY = '"Playfair Display", Georgia, serif';

type Props = {
  bookName: string;
  chapter: number;
  verseLabel: string;
  version: BibleVersion;
  verses: { number: number; text: string }[];
};

const BACKGROUNDS = [
  { file: 'bg-01.jpg' },
  { file: 'bg-02.png' },
  { file: 'bg-03.png' },
  { file: 'bg-04.png' },
  { file: 'bg-05.png' },
  { file: 'bg-06.png' },
  { file: 'bg-07.png' },
  { file: 'bg-08.png' },
  { file: 'bg-09.png' },
  { file: 'bg-10.jpg' },
  { file: 'bg-11.jpg' },
  { file: 'bg-12.jpg' },
  { file: 'bg-13.jpg' },
  { file: 'bg-14.jpg' },
  { file: 'bg-15.jpg' },
  { file: 'bg-16.jpg' },
  { file: 'bg-17.jpg' },
  { file: 'bg-18.jpg' },
  { file: 'bg-19.jpg' },
  { file: 'bg-20.jpg' },
];

// Ajusta tamaño de letra y padding al largo del texto para que quepa dentro de la imagen
function getVerseTextStyle(charCount: number): { fontSize: string; padding: string } {
  if (charCount <= 80) return { fontSize: '1.5rem', padding: '1.5rem' };
  if (charCount <= 150) return { fontSize: '1.25rem', padding: '1.75rem' };
  if (charCount <= 250) return { fontSize: '1.05rem', padding: '2rem' };
  if (charCount <= 400) return { fontSize: '0.9rem', padding: '2.25rem' };
  return { fontSize: '0.8rem', padding: '2.5rem' };
}

export function VerseImageClient({ bookName, chapter, verseLabel, version, verses }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedBg, setSelectedBg] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const reference = `${bookName} ${chapter}:${verseLabel} — ${version}`;
  const verseText =
    verses.length === 1 && verses[0]
      ? verses[0].text
      : verses.map((v) => `${v.number} ${v.text}`).join(' ');
  const previewUrl = uploadedImage ?? (selectedBg ? `/bible-backgrounds/${selectedBg}` : null);
  const verseTextStyle = getVerseTextStyle(verseText.length);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
      setSelectedBg(null);
    };
    reader.readAsDataURL(file);
  }

  function selectBackground(file: string) {
    setSelectedBg(file);
    setUploadedImage(null);
  }

  function waitForPreviewImage() {
    return new Promise<void>((resolve) => {
      const img = document.getElementById('verse-image-preview-img') as HTMLImageElement | null;
      if (!img || img.complete) {
        resolve();
        return;
      }
      img.addEventListener('load', () => resolve(), { once: true });
      img.addEventListener('error', () => resolve(), { once: true });
    });
  }

  async function handleShare() {
    setSharing(true);
    try {
      await waitForPreviewImage();
      await document.fonts.ready;

      const html2canvas = (await import('html2canvas')).default;
      const node = document.getElementById('verse-image-preview');
      if (!node) throw new Error('No se encontró la preview');

      const canvas = await html2canvas(node, {
        useCORS: true,
        backgroundColor: null,
        imageTimeout: 15000,
      });

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('No se pudo generar la imagen');

      const fileName = `${bookName}-${chapter}-${verseLabel}.png`
        .toLowerCase()
        .replace(/\s+/g, '-');
      const file = new File([blob], fileName, { type: 'image/png' });
      const shareText = `${reference}\n\nDescarga nuestra aplicación:\nhttps://ict-devocional.vercel.app`;

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text: shareText });
        } catch {
          // usuario canceló el share, no hacer nada
        }
        return;
      }

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.info('Tu navegador no permite compartir directamente — se descargó la imagen');
    } catch {
      toast.error('No se pudo generar la imagen');
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,600;1,700&display=swap"
      />
      <div className="border-border bg-background/95 sticky top-0 z-10 flex items-center gap-3 border-b px-4 py-3 backdrop-blur-lg">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Volver"
          className="flex h-9 w-9 items-center justify-center rounded-full"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-bold">Escoger imagen</h1>
      </div>

      <div className="flex-1 px-5 py-4">
        {previewUrl && (
          <div className="mb-6 flex flex-col items-center gap-4">
            <div
              id="verse-image-preview"
              className="relative aspect-[4/5] w-full max-w-sm overflow-hidden rounded-2xl"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                id="verse-image-preview-img"
                src={previewUrl}
                alt=""
                crossOrigin="anonymous"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} />
              <div
                className="absolute inset-0 flex flex-col items-center justify-center text-center"
                style={{ padding: verseTextStyle.padding }}
              >
                <p
                  className="leading-snug font-semibold text-white italic"
                  style={{
                    fontFamily: VERSE_FONT_FAMILY,
                    fontSize: verseTextStyle.fontSize,
                    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  }}
                >
                  {verseText}
                </p>
                <p
                  className="mt-4 text-sm"
                  style={{
                    color: 'rgba(255,255,255,0.9)',
                    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                  }}
                >
                  {reference}
                </p>
              </div>
              <div
                className="absolute right-3 bottom-3 text-[11px]"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                ICT Devocional
              </div>
            </div>

            <button
              type="button"
              onClick={handleShare}
              disabled={sharing}
              className="bg-primary flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Share2 size={18} />
              {sharing ? 'Generando…' : 'Compartir imagen'}
            </button>
          </div>
        )}

        <p className="text-muted mb-4 text-sm">Crear imagen — Elige tu imagen de fondo</p>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-border bg-surface flex aspect-[4/5] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed',
              uploadedImage && 'border-[var(--color-primary)]',
            )}
          >
            <ImagePlus size={22} className="text-muted" />
            <span className="text-muted text-[11px] font-medium">Subir foto</span>
          </button>

          {BACKGROUNDS.map((bg) => (
            <button
              key={bg.file}
              type="button"
              onClick={() => selectBackground(bg.file)}
              className={cn(
                'relative aspect-[4/5] overflow-hidden rounded-xl border-2',
                selectedBg === bg.file ? 'border-[var(--color-primary)]' : 'border-transparent',
              )}
            >
              <Image
                src={`/bible-backgrounds/${bg.file}`}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

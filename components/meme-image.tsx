const textClass =
  "pointer-events-none absolute inset-x-2 break-words text-center font-black uppercase leading-tight text-white text-2xl [text-shadow:_2px_2px_0_#000,_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000]";

// An image with classic top/bottom meme text on it. Used by the feed and by
// the live preview while making a meme.
export function MemeImage({
  src,
  alt,
  topText,
  bottomText,
}: {
  src: string;
  alt: string;
  topText: string | null;
  bottomText: string | null;
}) {
  return (
    <div className="relative min-h-48 bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" className="mx-auto max-h-[32rem] w-full object-contain" />
      {topText && <p className={`${textClass} top-2`}>{topText}</p>}
      {bottomText && <p className={`${textClass} bottom-2`}>{bottomText}</p>}
    </div>
  );
}

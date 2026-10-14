import { ImageBackdrop } from "@/components/image-backdrop";

const textClass =
  "pointer-events-none absolute inset-x-2 break-words text-center font-black uppercase leading-tight text-white [text-shadow:_2px_2px_0_#000,_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000]";

const variants = {
  // The feed and the live preview: as tall as the image needs, up to a limit.
  full: {
    box: "relative min-h-48 overflow-hidden bg-zinc-900",
    img: "relative mx-auto max-h-[32rem] w-full object-contain",
    text: "text-2xl",
  },
  // Grids of several memes: every tile the same shape.
  thumb: {
    box: "relative aspect-[4/3] overflow-hidden bg-zinc-900",
    img: "relative h-full w-full object-contain",
    text: "text-lg",
  },
};

// An image with classic top/bottom meme text on it. Used by the feed, the
// home page grid, the meme page, and the live preview while making a meme.
export function MemeImage({
  src,
  alt,
  topText,
  bottomText,
  variant = "full",
}: {
  src: string;
  alt: string;
  topText: string | null;
  bottomText: string | null;
  variant?: keyof typeof variants;
}) {
  const style = variants[variant];
  return (
    <div className={style.box}>
      <ImageBackdrop src={src} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" className={style.img} />
      {topText && <p className={`${textClass} ${style.text} top-2`}>{topText}</p>}
      {bottomText && <p className={`${textClass} ${style.text} bottom-2`}>{bottomText}</p>}
    </div>
  );
}

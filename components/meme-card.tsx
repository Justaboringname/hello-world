const captionClass =
  "absolute inset-x-2 text-center font-black uppercase leading-tight text-white text-2xl [text-shadow:_2px_2px_0_#000,_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000]";

export function MemeCard({
  title,
  imageUrl,
  topText,
  bottomText,
}: {
  title: string;
  imageUrl: string;
  topText: string | null;
  bottomText: string | null;
}) {
  return (
    <li className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="relative bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={title} className="w-full" />
        {topText && <p className={`${captionClass} top-2`}>{topText}</p>}
        {bottomText && <p className={`${captionClass} bottom-2`}>{bottomText}</p>}
      </div>
      <p className="p-3 font-medium">{title}</p>
    </li>
  );
}

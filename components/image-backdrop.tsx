// A blurred, zoomed copy of the image behind it, so a tall or wide picture
// sits on its own colors instead of grey or black bars. Put it first inside a
// `relative overflow-hidden` box and give the real image `relative`.
export function ImageBackdrop({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden
      loading="lazy"
      className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl"
    />
  );
}

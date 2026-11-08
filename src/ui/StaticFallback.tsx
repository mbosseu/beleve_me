/* eslint-disable @next/next/no-img-element */

/** Shown when WebGL is unavailable: the drawing itself, lit like a print. */
export default function StaticFallback() {
  return (
    <div className="fixed inset-0 z-0 flex items-center justify-center bg-ink">
      <div className="relative w-[min(86vw,900px)] shadow-[0_40px_120px_rgba(0,0,0,0.8)]">
        <img
          src="/textures/illustration-original-mobile.jpg"
          alt="Le premier dessin botanique de BELIEVE ME"
          className="block w-full"
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(9,9,9,0.65))]" />
      </div>
    </div>
  );
}

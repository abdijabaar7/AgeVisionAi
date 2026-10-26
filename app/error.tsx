"use client";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="legal"><h1>Something went wrong</h1><p>Waxbaa khaldamay. Try again / Mar kale isku day.</p><button className="btn btn-primary" onClick={() => reset()}>Try again / Mar kale isku day</button></main>;
}

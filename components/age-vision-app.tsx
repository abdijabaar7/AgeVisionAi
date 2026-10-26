"use client";
/* eslint @next/next/no-img-element: "off" -- preview images are local object URLs and must not be sent through the image optimizer. */

import { ChangeEvent, DragEvent, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowRight, Camera, Check, Clock3, ImagePlus, LockKeyhole, ScanFace, ShieldCheck, Sparkles, Upload, X } from "lucide-react";
import { Locale, MessageKey, translate } from "@/lib/translations";

const ERROR_KEYS: Record<string, MessageKey> = {
  NO_FACE: "errNoFace", MULTIPLE_FACES: "errMultipleFaces", INVALID_IMAGE: "errInvalidType", FILE_TOO_LARGE: "errTooLarge",
  RATE_LIMIT: "errRateLimit", PROVIDER_UNAVAILABLE: "errProvider",
  CONFIGURATION: "errConfig", UNKNOWN: "errUnknown",
  REQUEST_TIMEOUT: "errTimeout",
};
type Result = { ageRange: { low: number; high: number }; approximateMidpoint: number };
const subscribeLocale = (callback: () => void) => {
  window.addEventListener("agevision-locale-change", callback);
  return () => window.removeEventListener("agevision-locale-change", callback);
};
const getLocaleSnapshot = (): Locale => localStorage.getItem("agevision-locale") === "en" ? "en" : "so";
const getLocaleServerSnapshot = (): Locale => "so";

export default function AgeVisionApp({ maxUploadMb }: { maxUploadMb: number }) {
  const locale = useSyncExternalStore(subscribeLocale, getLocaleSnapshot, getLocaleServerSnapshot);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [dragging, setDragging] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [captured, setCaptured] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const t = (key: MessageKey, vars?: Record<string, string | number>) => translate(locale, key, vars);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
  }
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
  }, [preview]);

  function resetResult() { setResult(null); setError(""); }
  function chooseFile(next: File | undefined) {
    if (!next) return;
    resetResult(); setConsent(false);
    if (!(["image/jpeg", "image/png", "image/webp"].includes(next.type))) {
      setFile(null); setPreview((old) => { if (old.startsWith("blob:")) URL.revokeObjectURL(old); return ""; });
      setError(t("errInvalidType")); return;
    }
    if (next.size > maxUploadMb * 1024 * 1024) {
      setFile(null); setPreview((old) => { if (old.startsWith("blob:")) URL.revokeObjectURL(old); return ""; });
      setError(t("errTooLarge", { size: maxUploadMb })); return;
    }
    setError(""); setFile(next);
    const url = URL.createObjectURL(next); setPreview((old) => { if (old.startsWith("blob:")) URL.revokeObjectURL(old); return url; });
  }
  function clearPhoto() {
    setFile(null); setPreview((old) => { if (old.startsWith("blob:")) URL.revokeObjectURL(old); return ""; });
    setConsent(false); resetResult(); if (fileRef.current) fileRef.current.value = "";
  }
  function onDrop(event: DragEvent<HTMLDivElement>) { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files[0]); }
  function changeLocale(next: Locale) { localStorage.setItem("agevision-locale", next); window.dispatchEvent(new Event("agevision-locale-change")); setError(""); }

  async function openCamera() {
    setCameraOpen(true); setCameraError(""); setCaptured("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("UNAVAILABLE");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); setCameraReady(true); }
    } catch (cause) {
      const name = cause instanceof Error ? cause.name : "";
      setCameraError(name === "NotAllowedError" || name === "SecurityError" ? t("errCameraDenied") : t("errCameraUnavailable"));
      stopCamera();
    }
  }
  function closeCamera() { stopCamera(); setCameraOpen(false); setCaptured(""); }
  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas"); canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setCaptured(canvas.toDataURL("image/jpeg", .92)); stopCamera();
  }
  async function useCapture() {
    if (!captured) return;
    const response = await fetch(captured); const blob = await response.blob();
    chooseFile(new File([blob], "camera-capture.jpg", { type: "image/jpeg" })); closeCamera();
  }
  async function analyze() {
    if (!file) { setError(t("errNoImage")); return; }
    if (!consent) return;
    setBusy(true); setError(""); setResult(null);
    try {
      let upload = file;
      // Rekognition accepts JPEG/PNG; WebP is converted locally after explicit submit.
      if (file.type === "image/webp") {
        const bitmap = await createImageBitmap(file);
        const canvas = document.createElement("canvas"); canvas.width = bitmap.width; canvas.height = bitmap.height;
        canvas.getContext("2d")?.drawImage(bitmap, 0, 0); bitmap.close();
        const jpeg = await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("CONVERSION")), "image/jpeg", .92));
        upload = new File([jpeg], "photo.jpg", { type: "image/jpeg" });
      }
      const body = new FormData(); body.append("image", upload);
      const response = await fetch("/api/estimate-age", { method: "POST", body });
      const data = await response.json();
      if (!response.ok || !data.success) {
        const key = ERROR_KEYS[String(data?.error?.code)] ?? "errUnknown";
        throw new Error(key);
      }
      setResult(data.result as Result);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      setError(message in messagesProxy ? t(message as MessageKey, { size: maxUploadMb }) : message === "Failed to fetch" ? t("errNetwork") : t("errUnknown"));
    } finally { setBusy(false); }
  }
  async function shareResult() {
    if (!result) return;
    const text = `${t("resultTitle")}: ${result.ageRange.low}–${result.ageRange.high} ${t("years")}. ${t("disclaimer")}`;
    try {
      if (navigator.share) await navigator.share({ title: "AgeVision AI", text });
      else { await navigator.clipboard.writeText(text); setError(t("copied")); }
    } catch { /* Share sheet cancellation is not an error. */ }
  }

  return <>
    <header className="shell topbar">
      <a className="brand" href="#top" aria-label="AgeVision AI"><span className="brandmark"><ScanFace size={21}/></span>AgeVision <span style={{color:"#0f9fa8", marginLeft:-8}}>AI</span></a>
      <nav className="nav" aria-label={locale === "so" ? "Navigation" : "Navigation"}>
        <a className="nav-link" href="#how">{t("navHow")}</a><a className="nav-link" href="#privacy">{t("navPrivacy")}</a>
        <button className="lang" onClick={() => changeLocale(locale === "so" ? "en" : "so")} aria-label={locale === "so" ? "Switch language to English" : "U beddel Af-Soomaali"}>{locale === "so" ? "EN" : "SO"}</button>
      </nav>
    </header>

    <main id="top">
      <section className="hero"><div className="shell hero-grid">
        <div><span className="eyebrow"><Sparkles size={14}/>{t("badge")}</span><h1>{t("title")}</h1><p className="hero-copy">{t("subtitle")}</p>
          <div className="proof"><span><ShieldCheck size={16}/>{locale === "so" ? "Asturnaan mudnaan leh" : "Privacy first"}</span><span><Clock3 size={16}/>{locale === "so" ? "Natiijo degdeg ah" : "Quick estimate"}</span></div>
        </div>
        <div className="panel" aria-live="polite">
          <div className="panel-head"><div><h2>{result ? t("resultTitle") : t("uploadTitle")}</h2></div><span className="secure"><LockKeyhole size={14}/>{locale === "so" ? "Ammaan" : "Secure"}</span></div>
          {result ? <div className="result"><span className="result-icon"><Check size={28}/></span><h3>{t("resultTitle")}</h3><div className="big-age">{result.approximateMidpoint}<small> {t("years")}</small></div><p className="range">{t("range")}: <strong>{result.ageRange.low}–{result.ageRange.high} {t("years")}</strong></p><p className="disclaimer">{t("disclaimer")}</p><div className="actions"><button className="btn btn-primary" onClick={shareResult}>{t("share")}</button><button className="btn btn-outline" onClick={clearPhoto}>{t("tryAgain")}</button></div></div> : <>
            {preview ? <div className="preview-wrap"><img className="preview" src={preview} alt={t("preview")}/><button className="remove-btn" onClick={clearPhoto} aria-label={t("remove")}><X size={16}/></button></div> : <div className={`dropzone ${dragging ? "drag" : ""}`} onDragOver={(e) => {e.preventDefault();setDragging(true);}} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
              <span className="drop-icon"><ImagePlus size={25}/></span><strong>{t("uploadHint")}</strong><p>{t("formats", { size: maxUploadMb })}</p><button className="btn btn-outline" onClick={() => fileRef.current?.click()}><Upload size={15} style={{verticalAlign:"middle",marginRight:7}}/>{t("browse")}</button>
            </div>}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden aria-label={t("browse")} onChange={(e: ChangeEvent<HTMLInputElement>) => chooseFile(e.target.files?.[0])}/>
            {!preview && <button className="btn btn-teal" style={{width:"100%",marginTop:10}} onClick={openCamera}><Camera size={15} style={{verticalAlign:"middle",marginRight:7}}/>{t("camera")}</button>}
            {preview && <><label className="consent"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}/><span>{t("consent")}</span></label><button className="btn btn-primary submit" onClick={analyze} disabled={!consent || busy}>{busy ? <><span className="spinner"/>{t("analyzing")}</> : <>{t("analyze")}<ArrowRight size={16}/></>}</button></>}
          </>}
          {error && <p className="error" role="alert">{error}</p>}
        </div>
      </div></section>

      <section className="section" id="how"><div className="shell"><h2 className="section-title">{t("howTitle")}</h2><div className="steps">
        {([[Upload,"step1","step1d"],[Sparkles,"step2","step2d"],[ScanFace,"step3","step3d"]] as const).map(([Icon,title,desc],i)=><article className="step" key={title}><span className="step-icon"><Icon size={21}/></span><h3><span style={{color:"#0f9fa8",marginRight:8}}>0{i+1}</span>{t(title)}</h3><p>{t(desc)}</p></article>)}
      </div></div></section>

      <section className="section" id="privacy" style={{paddingTop:0}}><div className="shell"><div className="privacy-band"><span className="step-icon"><LockKeyhole size={23}/></span><div><h2>{t("privacyTitle")}</h2><p>{t("privacyText")}</p><a href="/privacy">{t("learnPrivacy")} →</a></div></div></div></section>
    </main>

    <footer className="footer"><div className="shell footer-inner"><span>© {new Date().getFullYear()} AgeVision AI · {t("footer")}</span><div className="footer-links"><a href="/privacy">{t("privacy")}</a><a href="/terms">{t("terms")}</a></div></div></footer>

    {cameraOpen && <div role="dialog" aria-modal="true" aria-labelledby="camera-title" style={{position:"fixed",inset:0,zIndex:10,background:"#102a43b8",display:"grid",placeItems:"center",padding:18}}><div className="panel" style={{width:"min(100%,520px)"}}><div className="panel-head"><h2 id="camera-title">{t("cameraTitle")}</h2><button className="btn btn-outline" onClick={closeCamera} aria-label={t("close")}><X size={17}/></button></div>
      {cameraError ? <p className="error" role="alert">{cameraError}</p> : captured ? <img src={captured} alt={t("preview")} className="preview"/> : <video ref={videoRef} autoPlay playsInline muted className="preview" aria-label={t("cameraTitle")}/>}
      <div className="actions">{captured ? <><button className="btn btn-outline" onClick={openCamera}>{t("retake")}</button><button className="btn btn-primary" onClick={useCapture}>{t("usePhoto")}</button></> : <button className="btn btn-primary" onClick={capture} disabled={!cameraReady}>{t("capture")}</button>}</div>
    </div></div>}
  </>;
}

const messagesProxy: Record<string, true> = Object.fromEntries(["errNoImage","errInvalidType","errTooLarge","errNoFace","errMultipleFaces","errPoorImage","errCameraDenied","errCameraUnavailable","errRateLimit","errProvider","errConfig","errTimeout","errNetwork","errUnknown","copied"].map((key) => [key,true]));

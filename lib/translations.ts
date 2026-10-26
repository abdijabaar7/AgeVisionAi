export type Locale = "so" | "en";

export const messages = {
  so: {
    navHow: "Sida ay u shaqayso", navPrivacy: "Asturnaanta", badge: "Falanqaynta wejiga ee AI",
    title: "Immisa jir ayaad u muuqataa?", subtitle: "Soo geli sawir ama kamaradda isticmaal si aad u hesho qiyaas muuqaal ah oo da'da wejiga ah.",
    uploadTitle: "Sawirkaaga ku bilow", uploadHint: "Jiid oo dhig sawirkaaga, ama dooro faylka", browse: "Dooro sawir", camera: "Isticmaal kamaradda",
    formats: "JPG, PNG ama WebP · Ugu badnaan {size} MB", preview: "Horudhaca sawirka", remove: "Ka saar sawirka", replace: "Beddel sawirka",
    consent: "Waan fahmay in sawirkayga loo diri doono Amazon Rekognition si loo qiyaaso da'da muuqaalka.", analyze: "Qiyaas da'dayda", analyzing: "Sawirka waa la falanqaynayaa…",
    howTitle: "Saddex tallaabo oo fudud", step1: "Soo geli sawir", step1d: "Dooro sawir cad oo hal weji leh.", step2: "AI ayaa falanqaynaysa", step2d: "Sawirka si ku-meel-gaar ah ayaa loogu diraa Amazon Rekognition.", step3: "Hel qiyaasta", step3d: "Waxaad aragtaa xadka da'da ee AI-gu qiyaasay.",
    privacyTitle: "Sawirkaagu waa kuu gaar", privacyText: "Sawirka looma kaydiyo si joogto ah mana geli doono database. Waxaa loo diraa Amazon Rekognition si falanqayn loo sameeyo.", learnPrivacy: "Akhri siyaasadda asturnaanta",
    resultTitle: "Qiyaasta da'da muuqaalka", approx: "Qiyaasta dhexe", range: "Xadka la qiyaasay", years: "jir", disclaimer: "Tani waa qiyaas muuqaal ah oo AI samaysay, ma aha da'da dhabta ah ama xaqiijin sharci.", tryAgain: "Isku day sawir kale", share: "La wadaag natiijada", copied: "Natiijada waa la koobiyeeyay",
    errNoImage: "Marka hore dooro sawir.", errInvalidType: "Fadlan dooro sawir JPG, PNG ama WebP ah.", errTooLarge: "Sawirku wuu ka weyn yahay xadka {size} MB.", errNoFace: "Weji lagama helin sawirka. Isku day sawir kale oo cad.", errMultipleFaces: "Waxaa la helay wajiyo badan. Fadlan isticmaal sawir hal qof ah.", errPoorImage: "Sawirka lama akhrin karin. Isku day sawir tayo fiican leh.", errCameraDenied: "Oggolaanshaha kamaradda waa la diiday. Waxaad beddelkeeda soo gelin kartaa sawir.", errCameraUnavailable: "Kamarad lama heli karo qalabkan ama browser-kan.", errRateLimit: "Codsiyo badan ayaa la diray. Sug daqiiqad oo mar kale isku day.", errProvider: "Adeegga AI hadda lama heli karo. Mar kale isku day goor dambe.", errConfig: "Adeegga wali lama habayn. Fadlan la xiriir maamulaha.", errTimeout: "Codsigu waqti badan ayuu qaatay. Mar kale isku day.", errNetwork: "Xiriirku wuu go'ay. Hubi internetka oo mar kale isku day.", errUnknown: "Waxbaa khaldamay. Mar kale isku day.",
    cameraTitle: "Sawir qaado", capture: "Qaado sawir", retake: "Mar kale qaado", usePhoto: "Isticmaal sawirkan", close: "Xir", loading: "Kamaradda waa la furayaa…",
    privacy: "Siyaasadda Asturnaanta", terms: "Shuruudaha Isticmaalka", footer: "Qalab waxbarasho iyo madadaalo oo keliya.", noLegal: "Qiyaasta wejigu ma xaqiijin karto da'da qofka.",
  },
  en: {
    navHow: "How it works", navPrivacy: "Privacy", badge: "AI face analysis",
    title: "How old do you look?", subtitle: "Upload a photo or use your camera to get an apparent-age estimate from a face.",
    uploadTitle: "Start with your photo", uploadHint: "Drag and drop your photo, or choose a file", browse: "Choose a photo", camera: "Use camera",
    formats: "JPG, PNG or WebP · Up to {size} MB", preview: "Photo preview", remove: "Remove photo", replace: "Replace photo",
    consent: "I understand my photo will be sent to Amazon Rekognition to estimate apparent age.", analyze: "Estimate my age", analyzing: "Analyzing photo…",
    howTitle: "Three simple steps", step1: "Upload a photo", step1d: "Choose a clear photo with one face.", step2: "AI analyzes it", step2d: "The photo is temporarily sent to Amazon Rekognition.", step3: "See your estimate", step3d: "View the age range estimated by AI.",
    privacyTitle: "Your photo stays yours", privacyText: "Your photo is not permanently stored or added to a database. It is sent to Amazon Rekognition for analysis.", learnPrivacy: "Read the privacy policy",
    resultTitle: "Apparent age estimate", approx: "Approximate midpoint", range: "Estimated range", years: "years", disclaimer: "This is an AI estimate of appearance, not actual age or legal verification.", tryAgain: "Try another photo", share: "Share result", copied: "Result copied",
    errNoImage: "Choose a photo first.", errInvalidType: "Choose a JPG, PNG, or WebP image.", errTooLarge: "The photo exceeds the {size} MB limit.", errNoFace: "No face found. Try a clear photo with a visible face.", errMultipleFaces: "Multiple faces found. Please use a photo with one person.", errPoorImage: "The image could not be read. Try a higher-quality photo.", errCameraDenied: "Camera permission was denied. You can upload a photo instead.", errCameraUnavailable: "A camera is unavailable in this device or browser.", errRateLimit: "Too many requests. Wait a minute and try again.", errProvider: "The AI service is unavailable right now. Please try again later.", errConfig: "The service is not configured yet. Please contact the operator.", errTimeout: "The request took too long. Please try again.", errNetwork: "Connection lost. Check your internet and try again.", errUnknown: "Something went wrong. Please try again.",
    cameraTitle: "Take a photo", capture: "Take photo", retake: "Retake", usePhoto: "Use this photo", close: "Close", loading: "Opening camera…",
    privacy: "Privacy Policy", terms: "Terms of Use", footer: "For educational and entertainment use only.", noLegal: "Face estimation cannot verify a person's age.",
  },
} as const;

export type MessageKey = keyof typeof messages.en;
export function translate(locale: Locale, key: MessageKey, vars: Record<string, string | number> = {}): string {
  let value: string = messages[locale][key] ?? messages.en[key];
  for (const [name, replacement] of Object.entries(vars)) value = value.replaceAll(`{${name}}`, String(replacement));
  return value;
}

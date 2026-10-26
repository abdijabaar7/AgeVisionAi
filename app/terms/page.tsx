import Link from "next/link";

export const metadata = { title: "Terms of Use — AgeVision AI", robots: { index: true, follow: true } };
export default function TermsPage() {
  return <main className="legal"><Link href="/">← AgeVision AI</Link><h1>Shuruudaha Isticmaalka / Terms of Use</h1>
    <p>AgeVision AI waxaa loogu talagalay waxbarasho iyo madadaalo oo keliya. Qiyaasta da&apos;da muuqaalka waa mid aan hubanti lahayn, mana xaqiijiso da&apos;da dhabta ah.</p>
    <p>Ha u adeegsan natiijada xaqiijinta da&apos;da sharciga, aqoonsiga, shaqaaleysiinta, ama go&apos;aanada caafimaad, dhaqaale, iyo go&apos;aanada kale ee saamaynta weyn leh. Isticmaal sawir aad xaq u leedahay inaad dirto, kana hel oggolaanshaha qofka sawirka ku jira.</p>
    <p>Helitaanka adeeggu wuxuu ku xiran yahay dejimaha AWS iyo rate limiter-ka hawlwadeenka. Farsamaynta adeeg-bixiyeyaasha kale waxay raacdaa shuruudahooda. Lama dammaanad qaadayo saxnaanta ama joogtaynta adeegga.</p>
    <p>Service availability depends on the operator&apos;s AWS and rate-limiter configuration. Third-party processing is subject to the relevant provider terms. No accuracy or availability guarantee is made.</p>
  </main>;
}

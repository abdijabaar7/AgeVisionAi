import AgeVisionApp from "@/components/age-vision-app";
import { maxFileBytes } from "@/lib/image-validation";

export default function Home() { return <AgeVisionApp maxUploadMb={maxFileBytes() / (1024 * 1024)} />; }

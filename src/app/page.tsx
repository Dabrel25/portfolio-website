import { Suspense } from "react";
import LandingExperience from "@/components/landing/LandingExperience";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <LandingExperience />
    </Suspense>
  );
}

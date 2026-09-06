import { Suspense } from "react";
import ResumeContent from "@/components/resume/ResumeContent";

export default function ResumePage() {
  return (
    <Suspense fallback={null}>
      <ResumeContent />
    </Suspense>
  );
}

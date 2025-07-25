import { Suspense } from "react";
import FormPRContent from "./form-pr-content";

export default function FormPR() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FormPRContent />
    </Suspense>
  );
}

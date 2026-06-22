import { redirect } from "next/navigation";

/** Prompt Studio was replaced by the Infographics tool. */
export default function PromptStudioRedirect() {
  redirect("/infographics");
}

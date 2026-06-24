import { ConsolePageLoading } from "@/components/console/console-page-loading";

export default function ConsoleProfileLoading() {
  return (
    <ConsolePageLoading
      title="Profile"
      description="Your account details and chat preferences."
      label="Loading profile…"
    />
  );
}

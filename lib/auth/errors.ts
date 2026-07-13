import { ACCOUNT_DISABLED_MESSAGE } from "@/lib/auth/ban";

type AuthErrorLike = {
  message?: string;
  code?: string;
};

export function getAuthErrorMessage(error: AuthErrorLike): string {
  switch (error.code) {
    case "over_email_send_rate_limit":
      return "Too many attempts. Please wait about 60 seconds before trying again.";
    case "user_already_exists":
      return "This email is already registered. Please sign in instead.";
    case "email_address_invalid":
      return "Invalid email address. Please check and try again.";
    case "weak_password":
      return "Password is too weak. Use at least 6 characters.";
    case "invalid_credentials":
      return "Incorrect email or password. Please try again.";
    case "email_not_confirmed":
      return "Email not confirmed yet. Check your inbox for the confirmation link.";
    case "user_banned":
      return ACCOUNT_DISABLED_MESSAGE;
    default:
      return error.message ?? "Something went wrong. Please try again.";
  }
}

// Check if reCAPTCHA is disabled using a single env var
export function isRecaptchaDisabled(): boolean {
  // Only check for DISABLE_RECAPTCHA env var
  return process.env.DISABLE_RECAPTCHA === "true"
}

/**
 * Verifies a reCAPTCHA token with Google's API
 * @param token The reCAPTCHA token to verify
 * @param action The expected action name (optional)
 * @returns Object containing success status and score if successful
 */
export async function verifyRecaptchaToken(
  token: string,
  action?: string,
): Promise<{
  success: boolean
  score?: number
  hostname?: string
  action?: string
  errorCodes?: string[]
  challengeTimestamp?: string
}> {
  try {
    // If reCAPTCHA is disabled, return success
    if (isRecaptchaDisabled()) {
      console.log("reCAPTCHA verification skipped (disabled)")
      return {
        success: true,
        score: 1.0,
        action: action || "disabled",
      }
    }

    // Ensure we have the secret key
    const secretKey = process.env.RECAPTCHA_SECRET_KEY
    if (!secretKey) {
      console.error("reCAPTCHA secret key is not configured")
      return { success: false, errorCodes: ["missing-input-secret"] }
    }

    // Make the verification request to Google
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    })

    // Parse the response
    const data = await response.json()

    // Check if the verification was successful
    if (!data.success) {
      console.error("reCAPTCHA verification failed:", data["error-codes"])
      return {
        success: false,
        errorCodes: data["error-codes"],
      }
    }

    // If an action was specified, verify it matches
    if (action && data.action !== action) {
      console.error(`reCAPTCHA action mismatch: expected ${action}, got ${data.action}`)
      return {
        success: false,
        score: data.score,
        action: data.action,
        errorCodes: ["action-mismatch"],
      }
    }

    // Return the verification result
    return {
      success: true,
      score: data.score,
      hostname: data.hostname,
      action: data.action,
      challengeTimestamp: data.challenge_ts,
    }
  } catch (error) {
    console.error("Error verifying reCAPTCHA token:", error)
    return {
      success: false,
      errorCodes: ["verification-error"],
    }
  }
}

/**
 * Determines if a reCAPTCHA verification result indicates the request is likely from a human
 * @param result The verification result from verifyRecaptchaToken
 * @param minimumScore The minimum score to consider human (0.0 to 1.0, default 0.5)
 * @returns Boolean indicating if the request is likely from a human
 */
export function isHuman(result: { success: boolean; score?: number }, minimumScore = 0.5): boolean {
  return result.success && typeof result.score === "number" && result.score >= minimumScore
}

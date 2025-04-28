/**
 * Safely parses JSON from a response, with error handling
 */
export async function safeParseJSON(response: Response) {
  try {
    // First check if the response is ok
    if (!response.ok) {
      // Try to get error details from the response
      const errorText = await response.text()

      // Try to parse the error as JSON
      try {
        const errorData = JSON.parse(errorText)
        throw new Error(errorData.error || `API error: ${response.status}`)
      } catch (parseError) {
        // If parsing fails, use the raw text (truncated if too long)
        const truncatedError = errorText.length > 100 ? `${errorText.substring(0, 100)}...` : errorText
        throw new Error(`API error: ${truncatedError}`)
      }
    }

    // If response is ok, parse the JSON
    return await response.json()
  } catch (error) {
    console.error("Error parsing API response:", error)
    throw error
  }
}

/**
 * Handles API errors consistently
 */
export function handleAPIError(error: unknown): string {
  console.error("API error:", error)

  if (error instanceof Error) {
    return error.message
  }

  return "An unexpected error occurred. Please try again."
}

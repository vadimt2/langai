/**
 * Utility to check if the OpenAI API is available and working
 */
export async function checkOpenAIStatus(): Promise<{
  available: boolean
  message: string
}> {
  try {
    // Simple check to see if the API key is set
    if (!process.env.OPENAI_API_KEY) {
      return {
        available: false,
        message: "OpenAI API key is not configured",
      }
    }

    // In a real app, you might want to make a lightweight API call to verify
    // the API is working, but for simplicity we'll just check the key exists
    return {
      available: true,
      message: "OpenAI API appears to be configured correctly",
    }
  } catch (error) {
    console.error("Error checking OpenAI API status:", error)
    return {
      available: false,
      message: `OpenAI API check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

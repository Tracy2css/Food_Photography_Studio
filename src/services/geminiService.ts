export async function generateFoodImage(
  referenceImageBase64: string,
  mimeType: string,
  angleDescription: string,
  userText: string,
  style: string,
  tone: string,
  appetisingMode: boolean,
  apiKey?: string
): Promise<string> {
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      referenceImageBase64,
      mimeType,
      angleDescription,
      userText,
      style,
      tone,
      appetisingMode,
      apiKey
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  const data = await response.json();
  return data.url;
}

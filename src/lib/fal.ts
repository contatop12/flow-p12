export interface FalInput {
  prompt: string;
  model: string;
  params: Record<string, unknown>;
  falKey: string;
}

export interface FalResult {
  imageUrl: string;
}

export async function callFal({ prompt, model, params, falKey }: FalInput): Promise<FalResult> {
  const response = await fetch(`https://fal.run/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${falKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, ...params }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Fal.ai error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as { images?: Array<{ url: string }> };
  const imageUrl = data.images?.[0]?.url;
  if (!imageUrl) throw new Error("Fal.ai returned no images");

  return { imageUrl };
}

export async function downloadImage(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image from Fal.ai: ${res.status}`);
  return res.arrayBuffer();
}

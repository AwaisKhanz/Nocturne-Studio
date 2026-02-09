import { NextResponse } from "next/server";

type Provider = "openai" | "google";

type ModelConfig = {
  provider: Provider;
  apiModel: string;
};

const MODEL_MAP: Record<string, ModelConfig> = {
  "openai-gpt-image-1": { provider: "openai", apiModel: "gpt-image-1" },
  "gemini-2.5-flash-image": {
    provider: "google",
    apiModel: "gemini-2.5-flash-image",
  },
  "gemini-3-pro-image-preview": {
    provider: "google",
    apiModel: "gemini-3-pro-image-preview",
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

async function generateWithOpenAI({
  prompt,
  count,
  apiKey,
  model,
}: {
  prompt: string;
  count: number;
  apiKey: string;
  model: string;
}) {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      n: count,
      size: "1024x1024",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "OpenAI image generation failed.");
  }

  const data = (await response.json()) as {
    data?: { b64_json?: string; url?: string }[];
  };

  return (data.data || []).map((item, index) => {
    const src = item.b64_json
      ? `data:image/png;base64,${item.b64_json}`
      : item.url || "";
    return {
      id: `${Date.now()}-${index}`,
      src,
      alt: `${prompt} image ${index + 1}`,
    };
  });
}

async function generateWithGemini({
  prompt,
  count,
  apiKey,
  model,
}: {
  prompt: string;
  count: number;
  apiKey: string;
  model: string;
}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const makeRequest = async () => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Gemini image generation failed.");
    }

    const data = (await response.json()) as {
      candidates?: {
        content?: {
          parts?: {
            inlineData?: { data?: string; mimeType?: string };
            inline_data?: { data?: string; mime_type?: string };
          }[];
        };
      }[];
    };

    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(
      (part) => part.inlineData?.data || part.inline_data?.data
    );
    const inline = imagePart?.inlineData || imagePart?.inline_data;

    if (!inline?.data) {
      throw new Error("Gemini did not return image data.");
    }

    const mimeType = inline.mimeType || inline.mime_type || "image/png";
    return `data:${mimeType};base64,${inline.data}`;
  };

  const images = await Promise.all(
    Array.from({ length: count }, () => makeRequest())
  );

  return images.map((src, index) => ({
    id: `${Date.now()}-${index}`,
    src,
    alt: `${prompt} image ${index + 1}`,
  }));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      prompt?: string;
      model?: string;
      count?: number;
      apiKey?: string;
    };

    const prompt = body.prompt?.trim();
    const modelId = body.model?.trim() || "";
    const config = MODEL_MAP[modelId];
    const count = clamp(body.count || 4, 1, 20);

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    if (!config) {
      return NextResponse.json(
        { error: "Selected model is not supported yet." },
        { status: 400 }
      );
    }

    const apiKey = body.apiKey?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required for this model." },
        { status: 401 }
      );
    }

    const images =
      config.provider === "openai"
        ? await generateWithOpenAI({
            prompt,
            count,
            apiKey,
            model: config.apiModel,
          })
        : await generateWithGemini({
            prompt,
            count,
            apiKey,
            model: config.apiModel,
          });

    return NextResponse.json({ model: modelId, images });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { useState, ChangeEvent } from "react";
import {
  Camera,
  Image as ImageIcon,
  Upload,
  Settings2,
  Sparkles,
  RefreshCw,
  X,
  Download,
} from "lucide-react";
import { generateFoodImage } from "./services/geminiService";
import { GeneratedImage, GenerationSettings } from "./types";

const ANGLES = [
  {
    id: "top-down",
    angle: "Top-down (90° flat lay)",
    description: "clean geometry, editorial look",
  },
  {
    id: "hero",
    angle: "45° hero angle",
    description: "natural dining perspective, appetising depth",
  },
  {
    id: "close-up",
    angle: "Low angle close-up",
    description: "texture-forward macro feel (steam, gloss, crisp edges)",
  },
];

export default function App() {
  const [referenceImage, setReferenceImage] = useState<{
    url: string;
    base64: string;
    mimeType: string;
  } | null>(null);
  const [settings, setSettings] = useState<GenerationSettings>({
    userText: "",
    style: "Natural",
    tone: "Warm",
    appetisingMode: true,
  });
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const base64 = result.split(",")[1];
      setReferenceImage({
        url: result,
        base64,
        mimeType: file.type,
      });
      setResults([]);
    };
    reader.readAsDataURL(file);
  };

  const generateImages = async () => {
    if (!referenceImage) return;

    setIsGenerating(true);

    const initialResults: GeneratedImage[] = ANGLES.map((a) => ({
      id: a.id,
      angle: a.angle,
      description: a.description,
      url: null,
      loading: true,
      error: null,
    }));

    setResults(initialResults);

    await Promise.allSettled(
      initialResults.map(async (img, index) => {
        try {
          const url = await generateFoodImage(
            referenceImage.base64,
            referenceImage.mimeType,
            `${img.angle} - ${img.description}`,
            settings.userText,
            settings.style,
            settings.tone,
            settings.appetisingMode,
          );

          setResults((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], url, loading: false };
            return next;
          });
        } catch (error) {
          console.error(`Failed to generate ${img.angle}:`, error);
          setResults((prev) => {
            const next = [...prev];
            next[index] = {
              ...next[index],
              error:
                error instanceof Error ? error.message : "Failed to generate",
              loading: false,
            };
            return next;
          });
        }
      }),
    );

    setIsGenerating(false);
  };

  const regenerateSingle = async (index: number) => {
    if (!referenceImage) return;

    setResults((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], loading: true, error: null };
      return next;
    });

    try {
      const img = results[index];
      const url = await generateFoodImage(
        referenceImage.base64,
        referenceImage.mimeType,
        `${img.angle} - ${img.description}`,
        settings.userText,
        settings.style,
        settings.tone,
        settings.appetisingMode,
      );

      setResults((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], url, loading: false };
        return next;
      });
    } catch (error) {
      setResults((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          error: error instanceof Error ? error.message : "Failed to generate",
          loading: false,
        };
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-6 h-6 text-orange-600" />
            <h1 className="text-xl font-semibold tracking-tight">Plated</h1>
          </div>
          <div className="text-sm text-stone-500 font-medium">
            AI Food Studio
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Controls */}
          <div className="lg:col-span-4 space-y-6">
            {/* Upload Section */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500 mb-4">
                1. Reference Dish
              </h2>

              {!referenceImage ? (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-stone-300 border-dashed rounded-xl cursor-pointer bg-stone-50 hover:bg-stone-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-stone-400 mb-3" />
                    <p className="mb-2 text-sm text-stone-600">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-stone-500">
                      JPEG, PNG (Max 5MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg, image/png"
                    onChange={handleImageUpload}
                  />
                </label>
              ) : (
                <div className="relative rounded-xl overflow-hidden group">
                  <img
                    src={referenceImage.url}
                    alt="Reference"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer bg-white text-stone-900 px-4 py-2 rounded-full text-sm font-medium hover:bg-stone-100 transition-colors">
                      Change Photo
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg, image/png"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                </div>
              )}
            </section>

            {/* Settings Section */}
            <section
              className={`bg-white rounded-2xl p-6 shadow-sm border border-stone-200 transition-opacity duration-300 ${!referenceImage ? "opacity-50 pointer-events-none" : ""}`}
            >
              <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500 mb-4 flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                2. Camera & Style
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Text Prompt (Optional)
                  </label>
                  <textarea
                    value={settings.userText}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, userText: e.target.value }))
                    }
                    placeholder="e.g., Soft window light, 50mm lens, add steam, make greens fresher..."
                    className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none h-24"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Style
                    </label>
                    <select
                      value={settings.style}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, style: e.target.value }))
                      }
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                    >
                      <option>Natural</option>
                      <option>Editorial</option>
                      <option>Premium Studio</option>
                      <option>Rustic</option>
                      <option>Minimalist</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Tone
                    </label>
                    <select
                      value={settings.tone}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, tone: e.target.value }))
                      }
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                    >
                      <option>Warm</option>
                      <option>Neutral</option>
                      <option>Cool</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-orange-200 bg-orange-50 cursor-pointer hover:bg-orange-100 transition-colors">
                  <div className="flex-shrink-0">
                    <Sparkles
                      className={`w-5 h-5 ${settings.appetisingMode ? "text-orange-600" : "text-stone-400"}`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-stone-900">
                      Make it appetising
                    </div>
                    <div className="text-xs text-stone-500">
                      Enhance lighting, contrast, and textures
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.appetisingMode}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        appetisingMode: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-orange-600 rounded border-stone-300 focus:ring-orange-500"
                  />
                </label>

                <button
                  onClick={generateImages}
                  disabled={isGenerating || !referenceImage}
                  className="w-full bg-stone-900 text-white rounded-xl py-3 px-4 font-medium hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Generating 3 Angles...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5" />
                      Generate 3 Angles
                    </>
                  )}
                </button>
              </div>
            </section>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8">
            {results.length === 0 && !isGenerating ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-stone-400 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
                <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium text-stone-600">
                  No images generated yet
                </p>
                <p className="text-sm text-stone-500 mt-1">
                  Upload a reference photo and click generate
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.map((result, index) => (
                  <div
                    key={result.id}
                    className={`bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200 flex flex-col ${index === 2 ? "md:col-span-2 md:w-1/2 md:mx-auto" : ""}`}
                  >
                    <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                      <div>
                        <h3 className="font-medium text-stone-900">
                          {result.angle}
                        </h3>
                        <p className="text-xs text-stone-500">
                          {result.description}
                        </p>
                      </div>
                      <button
                        onClick={() => regenerateSingle(index)}
                        disabled={result.loading || isGenerating}
                        className="p-2 text-stone-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Regenerate this angle"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${result.loading ? "animate-spin text-orange-600" : ""}`}
                        />
                      </button>
                    </div>

                    <div className="relative aspect-square bg-stone-100 flex-1">
                      {result.loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400">
                          <Sparkles className="w-8 h-8 animate-pulse mb-2 text-orange-400" />
                          <span className="text-sm font-medium animate-pulse">
                            Crafting...
                          </span>
                        </div>
                      ) : result.error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 p-6 text-center">
                          <span className="text-sm font-medium mb-1">
                            Generation Failed
                          </span>
                          <span className="text-xs text-red-300">
                            {result.error}
                          </span>
                        </div>
                      ) : result.url ? (
                        <div
                          className="group w-full h-full relative cursor-zoom-in"
                          onClick={() => setSelectedImage(result.url)}
                        >
                          <img
                            src={result.url}
                            alt={result.angle}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 md:p-8"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/50 rounded-full transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedImage}
            alt="Fullscreen view"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <a
            href={selectedImage}
            download="plated-generation.png"
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-6 right-6 flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full font-medium shadow-lg hover:bg-stone-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            Save Image
          </a>
        </div>
      )}
    </div>
  );
}

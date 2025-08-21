
import React, { useState } from 'react';
import { ICONS } from '../constants';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { generateImages } from '../services/geminiService';

interface ImageGeneratorProps {
  onClose: () => void;
}

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
const aspectRatios: AspectRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:4'];

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!prompt || isLoading) return;
    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);
    try {
      const images = await generateImages(prompt, numberOfImages, aspectRatio);
      setGeneratedImages(images);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = (base64Image: string, index: number) => {
    const link = document.createElement('a');
    link.href = `data:image/jpeg;base64,${base64Image}`;
    link.download = `generated-image-${index + 1}.jpeg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex w-full h-full p-4 gap-4">
      {/* Controls Pane */}
      <div className="w-1/3 flex flex-col gap-4">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-fuchsia-400 flex items-center gap-2">
                {React.cloneElement(ICONS.IMAGE, { className: 'h-6 w-6' })}
                Image Studio
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close Image Studio">
                {React.cloneElement(ICONS.CLOSE, { className: 'h-5 w-5' })}
            </Button>
        </div>
        
        <Card className="flex-grow flex flex-col">
            <div className="p-4 flex-grow flex flex-col gap-6">
                <div>
                    <label htmlFor="image-prompt" className="block text-sm font-medium text-gray-400 mb-2">Prompt</label>
                    <textarea
                        id="image-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A majestic cyberpunk cat warrior on a neon-lit rooftop..."
                        className="w-full h-48 p-2 bg-white/5 border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500 font-mono text-sm"
                        aria-label="Image generation prompt"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Aspect Ratio</label>
                    <div className="grid grid-cols-5 gap-2">
                        {aspectRatios.map(ratio => (
                            <Button
                                key={ratio}
                                variant={aspectRatio === ratio ? 'primary' : 'secondary'}
                                size="sm"
                                onClick={() => setAspectRatio(ratio)}
                            >
                                {ratio}
                            </Button>
                        ))}
                    </div>
                </div>
                <div>
                    <label htmlFor="num-images" className="block text-sm font-medium text-gray-400 mb-2">Number of Images: {numberOfImages}</label>
                    <input
                        id="num-images"
                        type="range"
                        min="1" max="4" step="1"
                        value={numberOfImages}
                        onChange={(e) => setNumberOfImages(parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                    />
                </div>
            </div>
            <div className="p-4 border-t border-white/10 mt-auto flex-shrink-0">
                <Button onClick={handleGenerate} disabled={isLoading || !prompt} className="w-full" size="lg">
                    {isLoading ? React.cloneElement(ICONS.SPINNER, { className: 'mr-2 h-5 w-5' }) : null}
                    {isLoading ? 'Conjuring Pixels...' : 'Generate'}
                </Button>
            </div>
        </Card>
      </div>

      {/* Results Pane */}
      <div className="w-2/3">
        <Card className="h-full">
            <div className="p-4 h-full overflow-y-auto right-pane-scroller">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        {React.cloneElement(ICONS.SPINNER, { className: "h-12 w-12" })}
                        <p className="mt-4 text-lg">Generating your masterpiece...</p>
                        <p className="text-sm text-gray-500">This can sometimes take a moment.</p>
                    </div>
                )}
                {error && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-red-400">
                            <h3 className="text-lg font-semibold">Generation Failed</h3>
                            <p className="text-sm font-mono mt-2 bg-red-900/50 p-3 rounded-md">{error}</p>
                        </div>
                    </div>
                )}
                {!isLoading && !error && generatedImages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        {React.cloneElement(ICONS.IMAGE, { className: "h-16 w-16 opacity-50" })}
                        <p className="mt-4 text-lg">Your generated images will appear here</p>
                    </div>
                )}
                {!isLoading && generatedImages.length > 0 && (
                    <div className={`grid gap-4 ${numberOfImages > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {generatedImages.map((img, index) => (
                            <div key={index} className="group relative rounded-lg overflow-hidden border border-white/20">
                                <img src={`data:image/jpeg;base64,${img}`} alt={`Generated image ${index + 1}`} className="w-full h-full object-contain" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button onClick={() => handleDownload(img, index)} variant="secondary" size="md" leftIcon={React.cloneElement(ICONS.DOWNLOAD, {className: 'h-4 w-4'})}>
                                        Download
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Card>
      </div>
    </div>
  );
};

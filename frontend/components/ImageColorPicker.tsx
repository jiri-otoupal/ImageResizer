"use client";

import {useCallback, useRef, useState} from "react";

interface ImageColorPickerProps {
    images: File[];
    fileIds: string[];
    fillColors?: Record<string, string>;
    onColorSelect: (fileId: string, color: string) => void;
    disabled?: boolean;
}

export default function ImageColorPicker({
                                             images,
                                             fileIds,
                                             fillColors = {},
                                             onColorSelect,
                                             disabled,
                                         }: ImageColorPickerProps) {
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isPicking, setIsPicking] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    const selectedImage = images[selectedImageIndex] || null;
    const selectedFileId = fileIds[selectedImageIndex] || "";

    const handleImageClick = useCallback(
        (e: React.MouseEvent<HTMLImageElement>) => {
            if (disabled || !isPicking || !imageRef.current || !selectedFileId) return;

            const rect = imageRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const scaleX = imageRef.current.naturalWidth / rect.width;
            const scaleY = imageRef.current.naturalHeight / rect.height;

            const pixelX = Math.floor(x * scaleX);
            const pixelY = Math.floor(y * scaleY);

            const imageData = ctx.getImageData(pixelX, pixelY, 1, 1);
            const [r, g, b] = imageData.data;

            const hex = `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
            onColorSelect(selectedFileId, hex);
            setIsPicking(false);
        },
        [disabled, isPicking, onColorSelect, selectedFileId]
    );

    const handleImageLoad = useCallback(
        (e: React.SyntheticEvent<HTMLImageElement>) => {
            const img = e.currentTarget;
            if (!img || !canvasRef.current) return;

            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);
        },
        []
    );

    if (images.length === 0) return null;

    return (
        <div className="mt-4">
            <div className="flex items-center gap-4 mb-4">
                <button
                    onClick={() => setIsPicking(!isPicking)}
                    disabled={disabled}
                    className={`
            px-4 py-2 rounded-lg border-2 transition-all
            ${
                        isPicking
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-gray-300 hover:border-gray-400 text-gray-700"
                    }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
                >
                    {isPicking ? "Click on image to pick color" : "Pick Color from Image"}
                </button>
                {isPicking && (
                    <button
                        onClick={() => setIsPicking(false)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                        Cancel
                    </button>
                )}
            </div>

            {images.length > 1 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {images.map((file, idx) => {
                        const fileId = fileIds[idx];
                        const imageColor = fillColors[fileId] || "#ffffff";
                        return (
                            <button
                                key={idx}
                                onClick={() => setSelectedImageIndex(idx)}
                                disabled={disabled}
                                className={`
                  flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden relative
                  ${
                                    selectedImageIndex === idx
                                        ? "border-primary-500"
                                        : "border-gray-200 hover:border-gray-300"
                                }
                  disabled:opacity-50
                `}
                            >
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={`Preview ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                {fillColors[fileId] && (
                                    <div
                                        className="absolute bottom-0 left-0 right-0 h-2"
                                        style={{backgroundColor: imageColor}}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {selectedImage && (
                <div className="relative">
                    <img
                        ref={imageRef}
                        src={URL.createObjectURL(selectedImage)}
                        alt="Color picker"
                        onClick={handleImageClick}
                        className={`
              max-w-full max-h-64 rounded-lg border-2
              ${isPicking ? "cursor-crosshair border-primary-500" : "border-gray-200"}
            `}
                        onLoad={handleImageLoad}
                    />
                    <canvas ref={canvasRef} className="hidden"/>
                </div>
            )}
        </div>
    );
}


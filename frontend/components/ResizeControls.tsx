"use client";

import {useCallback, useEffect, useState} from "react";
import {HexColorPicker} from "react-colorful";
import ImageColorPicker from "./ImageColorPicker";

interface ResizeControlsProps {
    onResize: (params: {
        width: number;
        height: number;
        mode: "stretch" | "fit" | "fill";
        fillColor?: string;
        fillColors?: Record<string, string>;
    }) => void;
    uploadedFiles?: File[];
    fileIds?: string[];
    disabled?: boolean;
}

export default function ResizeControls({
                                           onResize,
                                           uploadedFiles = [],
                                           fileIds = [],
                                           disabled,
                                       }: ResizeControlsProps) {
    const [width, setWidth] = useState(800);
    const [height, setHeight] = useState(600);
    const [mode, setMode] = useState<"stretch" | "fit" | "fill">("fit");
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [fillColor, setFillColor] = useState("#ffffff");
    const [perImageColors, setPerImageColors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (mode === "fill" && uploadedFiles.length > 0 && fillColor === "#ffffff") {
            // Auto-extract color from first image when fill mode is selected
            import("@/lib/colorExtractor").then(({extractColorFromImage}) => {
                extractColorFromImage(uploadedFiles[0]).then((color) => {
                    setFillColor(color);
                    // Set as default for all images
                    const defaultColors: Record<string, string> = {};
                    fileIds.forEach((id) => {
                        defaultColors[id] = color;
                    });
                    setPerImageColors(defaultColors);
                });
            });
        }
    }, [mode, uploadedFiles, fillColor, fileIds]);

    const handleImageColorSelect = useCallback((fileId: string, color: string) => {
        setFillColor(color);
        setPerImageColors((prev) => ({
            ...prev,
            [fileId]: color,
        }));
    }, []);

    const handleResize = useCallback(() => {
        const hasPerImageColors = Object.keys(perImageColors).length > 0;
        onResize({
            width,
            height,
            mode,
            fillColor: mode === "fill" && !hasPerImageColors ? fillColor : undefined,
            fillColors: mode === "fill" && hasPerImageColors ? perImageColors : undefined,
        });
    }, [width, height, mode, fillColor, perImageColors, onResize]);

    return (
        <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Resize Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Width (px)
                    </label>
                    <input
                        type="number"
                        value={width}
                        onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                        min="1"
                        max="10000"
                        disabled={disabled}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Height (px)
                    </label>
                    <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                        min="1"
                        max="10000"
                        disabled={disabled}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    Resize Mode
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => setMode("stretch")}
                        disabled={disabled}
                        className={`
              px-6 py-4 rounded-lg border-2 transition-all
              ${
                            mode === "stretch"
                                ? "border-primary-500 bg-primary-50 text-primary-700"
                                : "border-gray-200 hover:border-primary-300 text-gray-700"
                        }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
                    >
                        <div className="font-semibold mb-1">Stretch</div>
                        <div className="text-sm text-gray-600">
                            Fill exact dimensions
                        </div>
                    </button>

                    <button
                        onClick={() => setMode("fit")}
                        disabled={disabled}
                        className={`
              px-6 py-4 rounded-lg border-2 transition-all
              ${
                            mode === "fit"
                                ? "border-primary-500 bg-primary-50 text-primary-700"
                                : "border-gray-200 hover:border-primary-300 text-gray-700"
                        }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
                    >
                        <div className="font-semibold mb-1">Fit</div>
                        <div className="text-sm text-gray-600">
                            Maintain aspect ratio
                        </div>
                    </button>

                    <button
                        onClick={() => setMode("fill")}
                        disabled={disabled}
                        className={`
              px-6 py-4 rounded-lg border-2 transition-all
              ${
                            mode === "fill"
                                ? "border-primary-500 bg-primary-50 text-primary-700"
                                : "border-gray-200 hover:border-primary-300 text-gray-700"
                        }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
                    >
                        <div className="font-semibold mb-1">Fill</div>
                        <div className="text-sm text-gray-600">
                            Fill with color
                        </div>
                    </button>
                </div>
            </div>

            {mode === "fill" && (
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Fill Color
                        {Object.keys(perImageColors).length > 0 && (
                            <span className="ml-2 text-xs text-gray-500">
                ({Object.keys(perImageColors).length} image{Object.keys(perImageColors).length !== 1 ? 's' : ''} have custom colors)
              </span>
                        )}
                    </label>
                    <div className="flex items-center gap-4 mb-4">
                        <button
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            disabled={disabled}
                            className="w-16 h-16 rounded-lg border-2 border-gray-300 shadow-sm hover:shadow-md transition-shadow disabled:opacity-50"
                            style={{backgroundColor: fillColor}}
                        />
                        <input
                            type="text"
                            value={fillColor}
                            onChange={(e) => {
                                setFillColor(e.target.value);
                                // Update all images that don't have custom colors
                                const newColors: Record<string, string> = {};
                                fileIds.forEach((id) => {
                                    if (!perImageColors[id]) {
                                        newColors[id] = e.target.value;
                                    }
                                });
                                if (Object.keys(newColors).length > 0) {
                                    setPerImageColors((prev) => ({...prev, ...newColors}));
                                }
                            }}
                            disabled={disabled}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                            placeholder="#ffffff"
                        />
                        <span className="text-sm text-gray-600">
              {Object.keys(perImageColors).length > 0
                  ? "Pick colors from images below for per-image colors"
                  : "Use color picker or pick from image"}
            </span>
                    </div>

                    {showColorPicker && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <HexColorPicker
                                color={fillColor}
                                onChange={(color) => {
                                    setFillColor(color);
                                    // Update all images that don't have custom colors
                                    const newColors: Record<string, string> = {};
                                    fileIds.forEach((id) => {
                                        if (!perImageColors[id]) {
                                            newColors[id] = color;
                                        }
                                    });
                                    if (Object.keys(newColors).length > 0) {
                                        setPerImageColors((prev) => ({...prev, ...newColors}));
                                    }
                                }}
                            />
                            <button
                                onClick={() => setShowColorPicker(false)}
                                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    )}

                    {uploadedFiles.length > 0 && (
                        <ImageColorPicker
                            images={uploadedFiles}
                            fileIds={fileIds}
                            fillColors={perImageColors}
                            onColorSelect={handleImageColorSelect}
                            disabled={disabled}
                        />
                    )}
                </div>
            )}

            <button
                onClick={handleResize}
                disabled={disabled || width <= 0 || height <= 0}
                className="w-full md:w-auto px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
                Start Resizing
            </button>
        </div>
    );
}


export async function extractColorFromImage(file: File): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            resolve("#ffffff");
            return;
        }

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Sample colors from the image
            const colorCounts: Record<string, number> = {};
            const sampleSize = Math.min(10000, data.length / 4);

            for (let i = 0; i < sampleSize; i++) {
                const idx = Math.floor(Math.random() * (data.length / 4)) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const a = data[idx + 3];

                // Skip transparent pixels
                if (a < 128) continue;

                // Quantize colors to reduce noise
                const qr = Math.floor(r / 32) * 32;
                const qg = Math.floor(g / 32) * 32;
                const qb = Math.floor(b / 32) * 32;
                const colorKey = `${qr},${qg},${qb}`;

                colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
            }

            // Find most common color
            let maxCount = 0;
            let dominantColor = "255,255,255";

            for (const [color, count] of Object.entries(colorCounts)) {
                if (count > maxCount) {
                    maxCount = count;
                    dominantColor = color;
                }
            }

            const [r, g, b] = dominantColor.split(",").map(Number);
            const hex = `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
            resolve(hex);
        };

        img.onerror = () => {
            resolve("#ffffff");
        };

        img.src = URL.createObjectURL(file);
    });
}


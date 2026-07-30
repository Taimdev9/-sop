(function () {
    'use strict';

    window.GameAssets = {
        createNoiseTexture: function () {
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            const imgData = ctx.createImageData(128, 128);
            for (let i = 0; i < imgData.data.length; i += 4) {
                const val = Math.floor(Math.random() * 255);
                imgData.data[i] = val;
                imgData.data[i + 1] = val;
                imgData.data[i + 2] = val;
                imgData.data[i + 3] = 25;
            }
            ctx.putImageData(imgData, 0, 0);
            return canvas.toDataURL();
        },
        createTileTexture: function () {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#0a0e14';
            ctx.fillRect(0, 0, 256, 256);
            ctx.strokeStyle = '#151c28';
            ctx.lineWidth = 4;
            ctx.strokeRect(0, 0, 256, 256);
            return canvas.toDataURL();
        }
    };
})();
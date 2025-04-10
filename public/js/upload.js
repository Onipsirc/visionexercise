// public/js/upload.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('uploadForm');
    const statusDiv = document.getElementById('uploadStatus');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent the default form submission

            const formData = new FormData(form);

            try {
                const response = await fetch('/uploadImage', {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();

                if (data.success) {
                    statusDiv.textContent = 'Image uploaded successfully!';

                    // Create or update the image element
                    let imagePreview = document.getElementById('uploadedImage');
                    if (!imagePreview) {
                        imagePreview = document.createElement('img');
                        imagePreview.id = 'uploadedImage';
                        imagePreview.style.maxWidth = '300px';
                        imagePreview.style.marginTop = '10px';
                        statusDiv.appendChild(imagePreview);
                    }
                    imagePreview.src = data.imageUrl;
                } else {
                    statusDiv.textContent = 'Image upload failed.';
                }
            } catch (error) {
                console.error('Upload error:', error);
                statusDiv.textContent = 'An error occurred during upload.';
            }
        });
    }
});

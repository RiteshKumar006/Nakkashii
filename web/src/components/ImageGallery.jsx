import { useState } from "react";

export default function ImageGallery({ images, alt }) {
    const [index, setIndex] = useState(0);

    if (!images || images.length === 0) {
        return <div className="gallery-empty">No image</div>;
    }

    // images change when the variant changes, so index can be out of range
    const current = images[index] || images[0];

    return (
        <div className="gallery">
            <img className="gallery-main" src={current.url} alt={alt} />
            {images.length > 1 && (
                <div className="gallery-thumbs">
                    {images.map((img, i) => (
                        <img
                            key={img._id}
                            src={img.url}
                            alt=""
                            className={img === current ? "active" : ""}
                            onClick={() => setIndex(i)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

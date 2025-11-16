import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Image, X } from 'lucide-react';
import { Dialog, DialogContent } from '../ui/dialog';

interface UserGalleryProps {
    avatar?: string;
    photoURL?: string;
    gallery?: string[];
}

export default function UserGallery({ avatar, photoURL, gallery }: UserGalleryProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    
    const allImages = [];
    if (avatar || photoURL) allImages.push(avatar || photoURL);
    if (gallery && gallery.length > 0) allImages.push(...gallery);

    if (allImages.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Image className="w-5 h-5" />
                        Galleria Immagini
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500 text-center py-4">Nessuna immagine disponibile</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Image className="w-5 h-5" />
                        Galleria Immagini ({allImages.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {allImages.map((image, index) => (
                            <div
                                key={index}
                                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity bg-gray-100"
                                onClick={() => setSelectedImage(image)}
                            >
                                <img
                                    src={image}
                                    alt={`Foto ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                {index === 0 && (
                                    <div className="absolute top-2 left-2">
                                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                            Avatar
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Image Preview Dialog */}
            <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
                <DialogContent className="max-w-4xl p-0">
                    <div className="relative">
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        {selectedImage && (
                            <img
                                src={selectedImage}
                                alt="Anteprima"
                                className="w-full h-auto max-h-[80vh] object-contain"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

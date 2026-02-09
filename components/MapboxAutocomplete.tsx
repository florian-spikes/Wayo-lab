import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';

interface MapboxFeature {
    id: string;
    place_name: string;
    center: [number, number];
    text: string;
    context?: { text: string }[];
}

interface MapboxAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onSelect?: (feature: MapboxFeature) => void;
    placeholder?: string;
    type?: 'country' | 'place'; // Restrict types to country or place/city
    className?: string;
}

const MapboxAutocomplete: React.FC<MapboxAutocompleteProps> = ({
    value,
    onChange,
    onSelect,
    placeholder = "Rechercher...",
    type = 'place',
    className = ""
}) => {
    const [query, setQuery] = useState(value);
    const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Sync internal state with prop value
    useEffect(() => {
        setQuery(value);
    }, [value]);

    // Handle outside click to close suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch suggestions from Mapbox
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!query || query.length < 2) {
                setSuggestions([]);
                return;
            }

            // Avoid fetching if the query matches the current value (user selected something)
            // But we allow if user is typing. We'll handle this by checking if showSuggestions is true
            if (!showSuggestions) return;

            setLoading(true);
            try {
                const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
                if (!mapboxToken) {
                    console.error("Mapbox token is missing in VITE_MAPBOX_TOKEN");
                    setLoading(false);
                    return;
                }

                const types = type === 'country' ? 'country' : 'place,locality,country';
                const response = await fetch(
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&types=${types}&language=fr&limit=5`
                );

                if (response.ok) {
                    const data = await response.json();
                    setSuggestions(data.features || []);
                }
            } catch (error) {
                console.error("Error fetching Mapbox suggestions:", error);
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timeoutId);
    }, [query, type, showSuggestions]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setQuery(newValue);
        onChange(newValue);
        setShowSuggestions(true);
    };

    const handleSelect = (feature: MapboxFeature) => {
        setQuery(feature.place_name);
        onChange(feature.place_name);
        setSuggestions([]);
        setShowSuggestions(false);
        if (onSelect) onSelect(feature);
    };

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder={placeholder}
                    className="w-full bg-dark-800 border-2 border-white/5 rounded-xl py-3 px-4 pl-10 text-white focus:outline-none focus:border-brand-500 transition-all text-sm md:text-base font-medium shadow-inner placeholder:text-gray-600"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                </div>
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-2 bg-dark-800 border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                    {suggestions.map((feature) => (
                        <button
                            key={feature.id}
                            onClick={() => handleSelect(feature)}
                            className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-start gap-3 border-b border-white/5 last:border-0"
                        >
                            <MapPin size={16} className="text-brand-500 mt-1 shrink-0" />
                            <div>
                                <span className="block font-bold text-sm text-gray-200">{feature.text}</span>
                                <span className="block text-xs text-gray-500 truncate">{feature.place_name}</span>
                            </div>
                        </button>
                    ))}
                    <div className="px-2 py-1 flex justify-end">
                        <span className="text-[10px] text-gray-600 font-mono">mapbox</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapboxAutocomplete;

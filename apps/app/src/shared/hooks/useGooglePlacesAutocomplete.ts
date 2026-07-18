import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../../lib/supabaseClient";


export interface AutocompleteSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

/**
 * useGooglePlacesAutocomplete
 * Pure data hook driven by a controlled external query value.
 */
export function useGooglePlacesAutocomplete(query: string) {
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate a persistent session token per autocompletion flow session
  const sessionTokenRef = useRef<string | null>(null);

  // Track the resolved Google Place ID to suppress autocomplete requests on programmatic overrides
  const selectedPlaceIdRef = useRef<string | null>(null);
  // Track whether we should currently ignore programmatic updates (e.g. while details resolve)
  const suppressRequestsRef = useRef<boolean>(false);
  // Keep the latest query string length so we can check it
  const lastUserTypedQueryRef = useRef<string>("");

  const getSessionToken = () => {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = Math.random().toString(36).substring(2, 17);
    }
    return sessionTokenRef.current;
  };

  const resetSessionToken = () => {
    sessionTokenRef.current = null;
  };

  useEffect(() => {
    
    
    // 1. Minimum query length check (Ignore queries shorter than 3 characters)
    if (!query || query.trim().length < 3) {
      
      setSuggestions([]);
      return;
    }

    // 2. Ignore programmatic updates while resolving details
    if (suppressRequestsRef.current) {
      
      return;
    }

    // 3. Clear suggestions if user resumes typing after selection
    if (selectedPlaceIdRef.current && query !== lastUserTypedQueryRef.current) {
      
      selectedPlaceIdRef.current = null;
    }

    lastUserTypedQueryRef.current = query;

    const delayDebounce = setTimeout(async () => {
      
      setIsLoading(true);
      setError(null);
      try {
        const token = getSessionToken();
        const { data, error: invokeError } = await supabase.functions.invoke("maps", {
          body: { action: "autocomplete", input: query, sessiontoken: token },
        });

        if (invokeError) {
          throw invokeError;
        }
        
        if (data.status === "OK" || data.status === "ZERO_RESULTS") {
          const preds = data.predictions || [];
          
          setSuggestions(preds);
        } else {
          const errMsg = data.error_message || `API error status: ${data.status}`;
          console.error("[useGooglePlacesAutocomplete Hook] Google API error:", errMsg);
          setError(errMsg);
        }
      } catch (err: any) {
        console.error("[useGooglePlacesAutocomplete Hook] Fetch exception:", err);
        setError(err.message || "Failed to search locations.");
      } finally {
        setIsLoading(false);
      }
    }, 400); // 400ms debounce

    return () => {
      
      clearTimeout(delayDebounce);
    };
  }, [query]);

  /**
   * Fetch details for a specific place suggestion
   */
  const getPlaceDetails = useCallback(async (placeId: string): Promise<PlaceDetails | null> => {
    setIsLoading(true);
    setError(null);
    suppressRequestsRef.current = true; // Lock autocomplete requests while resolving
    selectedPlaceIdRef.current = placeId;
    try {
      const token = getSessionToken();
      const { data, error: invokeError } = await supabase.functions.invoke("maps", {
        body: { action: "place-details", placeid: placeId, sessiontoken: token },
      });
      if (invokeError) {
        throw invokeError;
      }
      resetSessionToken(); // Invalidate token after final place details fetch

      if (data.status === "OK") {
        return data.result as PlaceDetails;
      } else {
        setError(data.error_message || `API error status: ${data.status}`);
        return null;
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch place details.");
      return null;
    } finally {
      setIsLoading(false);
      // Keep suppress flag active for a brief tick so state updates resolve cleanly
      setTimeout(() => {
        suppressRequestsRef.current = false;
      }, 100);
    }
  }, []);

  /**
   * Forward/Reverse geocode an address string
   */
  const geocodeAddress = useCallback(async (address: string): Promise<any | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("maps", {
        body: { action: "geocode", address },
      });
      if (invokeError) {
        throw invokeError;
      }
      if (data.status === "OK") {
        return data.results;
      } else {
        setError(data.error_message || `API error status: ${data.status}`);
        return null;
      }
    } catch (err: any) {
      setError(err.message || "Failed to geocode.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  const setProgrammaticSelection = useCallback((placeId: string | null) => {
    selectedPlaceIdRef.current = placeId;
    if (placeId) {
      suppressRequestsRef.current = true;
      setTimeout(() => {
        suppressRequestsRef.current = false;
      }, 100);
    }
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    getPlaceDetails,
    geocodeAddress,
    resetSessionToken,
    clearSuggestions,
    setProgrammaticSelection,
  };
}

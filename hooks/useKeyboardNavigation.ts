import { useEffect, useRef, useState } from 'react';

interface UseKeyboardNavigationOptions {
    itemSelector: string; // CSS selector for the items to navigate
    onSelect?: (index: number, element: HTMLElement) => void;
    axis?: 'vertical' | 'horizontal' | 'both';
    enabled?: boolean;
    columns?: number; // Number of columns for grid navigation
    allowBodyFocus?: boolean; // Allow navigation if document.body is focused (e.g. for global sidebar)
}

export const useKeyboardNavigation = ({
    itemSelector,
    onSelect,
    axis = 'vertical',
    enabled = true,
    columns = 1,
    allowBodyFocus = false
}: UseKeyboardNavigationOptions) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!containerRef.current) return;

            // Strict Focus Check: Only navigate if focus is within the container
            // UNLESS allowBodyFocus is true and the active element is the body
            const isFocusInside = containerRef.current.contains(document.activeElement);
            const isBodyFocus = document.activeElement === document.body;

            if (!isFocusInside && (!allowBodyFocus || !isBodyFocus)) return;

            const items = Array.from(containerRef.current.querySelectorAll(itemSelector)) as HTMLElement[];
            if (items.length === 0) return;

            let currentIndex = focusedIndex;

            // Sync with DOM focus if internal state is lost
            if (currentIndex === -1 && document.activeElement && isFocusInside) {
                const domIndex = items.indexOf(document.activeElement as HTMLElement);
                if (domIndex !== -1) {
                    currentIndex = domIndex;
                }
            }

            let nextIndex = currentIndex;

            if (e.key === 'ArrowDown' && (axis === 'vertical' || axis === 'both')) {
                e.preventDefault();
                nextIndex = currentIndex === -1 ? 0 : currentIndex + columns;
                if (nextIndex >= items.length) nextIndex = nextIndex % items.length;
            } else if (e.key === 'ArrowUp' && (axis === 'vertical' || axis === 'both')) {
                e.preventDefault();
                nextIndex = currentIndex === -1 ? items.length - 1 : currentIndex - columns;
                if (nextIndex < 0) {
                    nextIndex = items.length + nextIndex; // Simple wrap for grid? Or just wrap to end?
                    // The original logic was complex wrapping, simplifying or keeping specific behavior? 
                    // Original: nextIndex = items.length + nextIndex; if (nextIndex < 0) nextIndex = items.length - 1;
                    // Let's stick to simple wrap for single column which is most common used here.
                    if (nextIndex < 0) nextIndex = items.length - 1;
                }
            } else if (e.key === 'ArrowRight' && (axis === 'horizontal' || axis === 'both')) {
                e.preventDefault();
                nextIndex = currentIndex === -1 ? 0 : currentIndex + 1;
                if (nextIndex >= items.length) nextIndex = 0;
            } else if (e.key === 'ArrowLeft' && (axis === 'horizontal' || axis === 'both')) {
                e.preventDefault();
                nextIndex = currentIndex === -1 ? items.length - 1 : currentIndex - 1;
                if (nextIndex < 0) nextIndex = items.length - 1;
            } else {
                return;
            }

            setFocusedIndex(nextIndex);

            const target = items[nextIndex];
            if (target) {
                target.focus();
                if (onSelect) onSelect(nextIndex, target);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [enabled, focusedIndex, itemSelector, axis, onSelect, allowBodyFocus, columns]);

    return { containerRef, focusedIndex, setFocusedIndex };
};
